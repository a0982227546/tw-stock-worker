export default {
  async fetch(request) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=UTF-8"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    try {
      const requestUrl = new URL(request.url);
      const codesText = requestUrl.searchParams.get("codes") || "2330";

      const codes = codesText
        .split(",")
        .map(x => x.trim())
        .filter(x => /^\d{4,6}$/.test(x))
        .slice(0, 100);

      if (!codes.length) {
        return new Response(JSON.stringify({
          ok: false,
          error: "沒有有效的股票代號"
        }), { status: 400, headers });
      }

      const channels = [];

      for (const code of codes) {
        channels.push(`tse_${code}.tw`);
        channels.push(`otc_${code}.tw`);
      }

      const twseUrl =
        "https://mis.twse.com.tw/stock/api/getStockInfo.jsp" +
        "?json=1&delay=0&ex_ch=" +
        encodeURIComponent(channels.join("|"));

      const r = await fetch(twseUrl, {
        headers: {
          "Accept": "application/json,text/plain,*/*",
          "Referer": "https://mis.twse.com.tw/"
        }
      });

      if (!r.ok) {
        throw new Error(`TWSE HTTP ${r.status}`);
      }

      const data = await r.json();
      const stocks = [];
      const seen = new Set();

      for (const q of data.msgArray || []) {
        const code = q.c;

        if (!code || seen.has(code)) continue;

        let price = parseFloat(q.z);
        let priceType = "latest";

        if (!Number.isFinite(price) || price <= 0) {
          price = parseFloat(q.y);
          priceType = "previousClose";
        }

        if (!Number.isFinite(price) || price <= 0) continue;

        seen.add(code);

        stocks.push({
          code,
          name: q.n || "",
          price,
          priceType,
          previousClose: parseFloat(q.y) || null,
          open: parseFloat(q.o) || null,
          high: parseFloat(q.h) || null,
          low: parseFloat(q.l) || null,
          time: q.t || "",
          date: q.d || "",
          market: q.ex || ""
        });
      }

      return new Response(JSON.stringify({
        ok: true,
        requested: codes.length,
        received: stocks.length,
        stocks
      }), { headers });

    } catch (error) {
      return new Response(JSON.stringify({
        ok: false,
        error: error.message
      }), { status: 500, headers });
    }
  }
};

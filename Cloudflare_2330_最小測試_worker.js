export default {
  async fetch() {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=UTF-8"
    };

    try {
      const url =
        "https://mis.twse.com.tw/stock/api/getStockInfo.jsp" +
        "?ex_ch=tse_2330.tw&json=1&delay=0";

      const r = await fetch(url, {
        headers: {
          "Accept": "application/json,text/plain,*/*",
          "Referer": "https://mis.twse.com.tw/"
        }
      });

      const data = await r.json();
      const q = data.msgArray?.[0];

      return new Response(JSON.stringify({
        ok: true,
        code: q?.c || "2330",
        name: q?.n || "",
        price: q?.z || q?.y || null,
        time: q?.t || "",
        date: q?.d || ""
      }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({
        ok: false,
        error: String(e.message || e)
      }), { status: 500, headers });
    }
  }
};

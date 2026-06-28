const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-5282347655";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Telegram token is not configured" })
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const phone = String(payload.phone || "").trim();
    const digits = phone.replace(/\D/g, "");

    if (digits.length < 11) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid phone" })
      };
    }

    const details = payload.details && typeof payload.details === "object" ? payload.details : {};
    const tracking = payload.tracking && typeof payload.tracking === "object" ? payload.tracking : {};

    const lines = [
      "Новая заявка с сайта",
      "Телефон: " + phone
    ];

    Object.entries(details).forEach(([key, value]) => {
      if (key !== "phone" && value) {
        lines.push(key + ": " + value);
      }
    });

    if (Object.keys(tracking).length > 0) {
      lines.push("UTM: " + JSON.stringify(tracking));
    }

    if (payload.page) {
      lines.push("Страница: " + payload.page);
    }

    lines.push("Время: " + new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }));

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: lines.join("\n")
      })
    });

    if (!response.ok) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Telegram request failed" })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Lead delivery failed" })
    };
  }
};

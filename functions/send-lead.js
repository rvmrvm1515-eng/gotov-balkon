const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!env.TELEGRAM_BOT_TOKEN) {
    return jsonResponse({ error: "Telegram token is not configured" }, 500);
  }

  try {
    const payload = await request.json();
    const phone = String(payload.phone || "").trim();
    const digits = phone.replace(/\D/g, "");

    if (digits.length < 11) {
      return jsonResponse({ error: "Invalid phone" }, 400);
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

    const telegramResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID || "-5282347655",
        text: lines.join("\n")
      })
    });

    if (!telegramResponse.ok) {
      return jsonResponse({ error: "Telegram request failed" }, 502);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    return jsonResponse({ error: "Lead delivery failed" }, 500);
  }
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

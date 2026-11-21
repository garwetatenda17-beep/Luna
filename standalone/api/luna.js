// LUNA assistant — real AI answers (Vercel serverless function).
// Turn it on: Vercel → Project → Settings → Environment Variables → add ANTHROPIC_API_KEY.
// Optional: LUNA_MODEL to pick another Claude model. Without a key this returns 503
// and the app uses its built-in replies instead.
const Anthropic = require("@anthropic-ai/sdk");

const MODEL = process.env.LUNA_MODEL || "claude-opus-5-5";
const PERSONA = `You are LUNA, the assistant inside the LUNA app — an app that helps ordinary people across Africa run a small online shop from their phone: find suppliers, list products, get paid by mobile money (EcoCash, M-Pesa, MoMo) or cash on delivery, and market on WhatsApp, TikTok and Facebook.

How you answer:
- Talk like a calm, capable business partner. Plain, simple English (or the user's language — Shona, Ndebele, Swahili, Pidgin, French…). Short: usually 2–5 sentences or a short numbered list. No headings, no tables.
- Actually help. Use the seller's real situation below: their shop, products, prices, money, orders, setup progress and nearby suppliers. Give the concrete next step, the exact words to say, or the exact message to send.
- If they are confused, find out where they are stuck and walk them through one step at a time.
- Be honest: market numbers in the app are estimates; never promise income. You cannot press buttons, send WhatsApp messages or post for them — tell them which button to tap in LUNA and you can write the text for them.
- Never ask for PINs or passwords. Refuse scams, fake or dangerous products and suggest a legit alternative.`;

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string") return Promise.resolve(JSON.parse(req.body || "{}"));
  return new Promise((resolve) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { resolve(JSON.parse(d || "{}")); } catch { resolve({}); } }); });
}

module.exports = async function handler(req, res) {
  const send = (code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); };
  if (req.method !== "POST") return send(405, { error: "POST only" });
  if (!process.env.ANTHROPIC_API_KEY) return send(503, { error: "ai_not_configured" });

  const body = await readBody(req);
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, m.role === "user" ? 1000 : 3000) }))
    .slice(-12);
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return send(400, { error: "bad_request" });
  const context = String(body.context || "").slice(0, 6000);

  try {
    const client = new Anthropic();
    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low" }, // quick chat replies
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // if a request is declined, a fallback model answers instead
      system: [{ type: "text", text: PERSONA }, { type: "text", text: "The seller right now:\n" + context }],
      messages,
    });
    if (msg.stop_reason === "refusal") return send(200, { text: "I can't help with that one. Ask me about selling, suppliers, posts or your orders." });
    const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    return send(200, { text: text || "Sorry, I didn't catch that. Can you say it another way?" });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) console.error("LUNA AI: invalid ANTHROPIC_API_KEY");
    else if (err instanceof Anthropic.RateLimitError) console.error("LUNA AI: rate limited");
    else if (err instanceof Anthropic.APIError) console.error(`LUNA AI error ${err.status}:`, err.message);
    else console.error("LUNA AI error:", err);
    return send(502, { error: "ai_unavailable" });
  }
};

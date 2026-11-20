// POST /api/luna — streams Luna's reply from Claude as plain text.
// Needs ANTHROPIC_API_KEY on the server. Without it this returns 503 and the app
// falls back to the built-in (offline) Luna.
import Anthropic from "@anthropic-ai/sdk";
import { COUNTRIES } from "../../../lib/africa";
import { LUNA_PERSONA, lunaContext } from "../../../lib/lunaPrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.LUNA_MODEL || "claude-opus-5-5";
const MAX_HISTORY = 16; // messages sent to Claude
const MAX_CHARS = 1000; // per user message

let client;
const getClient = () => (client ??= new Anthropic());

function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, m.role === "user" ? MAX_CHARS : 4000) }))
    .slice(-MAX_HISTORY);
  while (msgs.length && msgs[0].role !== "user") msgs.shift(); // must start with the user
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json({ error: "ai_not_configured" }, { status: 503 });
  }

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad_json" }, { status: 400 }); }

  const messages = cleanMessages(body?.messages);
  const country = COUNTRIES.find((c) => c.name === body?.context?.country);
  const city = String(body?.context?.city || "").slice(0, 60).trim();
  const role = body?.context?.role === "Supplier" ? "Supplier" : "Seller";
  if (!messages || !country || !city) return Response.json({ error: "bad_request" }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claude = getClient().beta.messages.stream({
          model: MODEL,
          max_tokens: 4000,
          output_config: { effort: "low" }, // quick, chatty replies
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default", // if a request is declined, retry on a fallback model automatically
          cache_control: { type: "ephemeral" },
          system: [
            { type: "text", text: LUNA_PERSONA },
            { type: "text", text: lunaContext({ city, country, role }) },
          ],
          messages,
        });
        for await (const event of claude) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await claude.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\nSorry, I can't help with that one 🙏 Ask me about what to sell, prices, delivery or getting paid."));
        }
        controller.close();
      } catch (err) {
        if (err instanceof Anthropic.RateLimitError) console.error("Luna AI rate limited");
        else if (err instanceof Anthropic.AuthenticationError) console.error("Luna AI: invalid ANTHROPIC_API_KEY");
        else if (err instanceof Anthropic.APIError) console.error(`Luna AI error ${err.status}:`, err.message);
        else console.error("Luna AI error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

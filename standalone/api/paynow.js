// LUNA × Paynow — EcoCash Express checkout (Vercel serverless function).
//
// POST /api/paynow               {action:"initiate", orderId, phone}  → sends the EcoCash PIN prompt
// GET  /api/paynow?action=status&id=ORDER_ID                          → checks Paynow, marks order paid
// POST /api/paynow?action=result  (Paynow server → us)                 → same, pushed by Paynow
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   PAYNOW_INTEGRATION_ID, PAYNOW_INTEGRATION_KEY   from Paynow → Receive Payments → 3rd party integration
//   PAYNOW_AUTH_EMAIL           the merchant email (required while the integration is in test mode)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY          from Supabase → Project Settings → API
//   PUBLIC_SITE_URL             e.g. https://luna.vercel.app
const crypto = require("crypto");

const PAYNOW_MOBILE_URL = process.env.PAYNOW_URL || "https://www.paynow.co.zw/interface/remotetransaction"; // PAYNOW_URL only for testing
const env = (k) => process.env[k] || "";
const PAID = ["paid", "awaiting delivery", "delivered"];
const FAILED = ["cancelled", "failed", "disputed", "refunded"];

// Paynow hash: every value in order (except "hash") + integration key → SHA512 → uppercase hex.
function paynowHash(pairs, key) {
  const joined = pairs.filter(([k]) => k.toLowerCase() !== "hash").map(([, v]) => v).join("") + key;
  return crypto.createHash("sha512").update(joined, "utf8").digest("hex").toUpperCase();
}
function parsePaynow(text) {
  const pairs = [...new URLSearchParams(text)];
  const obj = Object.fromEntries(pairs.map(([k, v]) => [k.toLowerCase(), v]));
  return { pairs, obj };
}
function verified({ pairs, obj }) {
  return !!obj.hash && obj.hash.toUpperCase() === paynowHash(pairs, env("PAYNOW_INTEGRATION_KEY"));
}

async function sb(path, init = {}) {
  const res = await fetch(`${env("SUPABASE_URL")}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env("SUPABASE_SERVICE_ROLE_KEY"),
      Authorization: `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}
const getOrder = async (id) => (await sb(`orders?id=eq.${encodeURIComponent(id)}&select=*`))[0];
const patchOrder = (id, body) => sb(`orders?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });

// Apply a verified Paynow status to the order.
async function applyStatus(order, parsed) {
  const status = String(parsed.obj.status || "").toLowerCase();
  if (PAID.includes(status) && order.status === "pending_paynow") {
    await patchOrder(order.id, { status: "paid", ref: parsed.obj.paynowreference || order.ref });
    return "paid";
  }
  if (FAILED.includes(status) && order.status === "pending_paynow") {
    await patchOrder(order.id, { status: "payment_failed" });
    return "payment_failed";
  }
  return order.status === "pending_paynow" ? "pending" : order.status;
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return req.body;
  return await new Promise((resolve) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => resolve(d)); });
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const action = url.searchParams.get("action");
  const send = (code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); };

  if (!env("PAYNOW_INTEGRATION_ID") || !env("PAYNOW_INTEGRATION_KEY") || !env("SUPABASE_URL") || !env("SUPABASE_SERVICE_ROLE_KEY")) {
    return send(503, { ok: false, error: "Paynow is not set up on this server yet." });
  }

  try {
    // ---- Paynow pushes the result here ----
    if (req.method === "POST" && action === "result") {
      const raw = await readBody(req);
      const parsed = parsePaynow(typeof raw === "string" ? raw : new URLSearchParams(raw).toString());
      if (!verified(parsed)) return send(400, { ok: false, error: "bad hash" });
      const order = await getOrder(parsed.obj.reference);
      if (order) await applyStatus(order, parsed);
      return send(200, { ok: true });
    }

    // ---- Shop checks payment status ----
    if (req.method === "GET" && action === "status") {
      const order = await getOrder(url.searchParams.get("id") || "");
      if (!order) return send(404, { ok: false, error: "Order not found" });
      if (order.status !== "pending_paynow" || !order.paynow_poll) return send(200, { ok: true, status: order.status === "pending_paynow" ? "pending" : order.status });
      const poll = await fetch(order.paynow_poll, { method: "POST" });
      const parsed = parsePaynow(await poll.text());
      if (!verified(parsed)) return send(200, { ok: true, status: "pending" });
      return send(200, { ok: true, status: await applyStatus(order, parsed) });
    }

    // ---- Start an EcoCash payment ----
    if (req.method === "POST") {
      const raw = await readBody(req);
      const body = typeof raw === "string" ? JSON.parse(raw || "{}") : raw;
      if (body.action !== "initiate") return send(400, { ok: false, error: "Unknown action" });
      const phone = String(body.phone || "").replace(/\D/g, "");
      if (!/^07[78]\d{7}$/.test(phone)) return send(400, { ok: false, error: "Enter an EcoCash number (077 or 078)." });
      const order = await getOrder(String(body.orderId || ""));
      if (!order) return send(404, { ok: false, error: "Order not found" });
      if (order.status !== "pending_paynow") return send(409, { ok: false, error: "This order is not waiting for payment." });

      const site = env("PUBLIC_SITE_URL") || `https://${req.headers.host}`;
      const pairs = [
        ["id", env("PAYNOW_INTEGRATION_ID")],
        ["reference", order.id],
        ["amount", Number(order.total).toFixed(2)],
        ["additionalinfo", `LUNA order ${order.id} (${order.shop_slug})`],
        ["returnurl", `${site}/shop/${order.shop_slug}`],
        ["resulturl", `${site}/api/paynow?action=result`],
        ["authemail", env("PAYNOW_AUTH_EMAIL")],
        ["phone", phone],
        ["method", "ecocash"],
        ["status", "Message"],
      ];
      pairs.push(["hash", paynowHash(pairs, env("PAYNOW_INTEGRATION_KEY"))]);
      const pn = await fetch(PAYNOW_MOBILE_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(pairs).toString() });
      const parsed = parsePaynow(await pn.text());
      if (String(parsed.obj.status).toLowerCase() !== "ok") return send(502, { ok: false, error: parsed.obj.error || "Paynow refused the payment." });
      if (!verified(parsed)) return send(502, { ok: false, error: "Paynow reply could not be verified." });
      await patchOrder(order.id, { paynow_poll: parsed.obj.pollurl });
      return send(200, { ok: true, instructions: parsed.obj.instructions || "Check your phone and enter your EcoCash PIN." });
    }

    return send(405, { ok: false, error: "Method not allowed" });
  } catch (e) {
    console.error("paynow error", e);
    return send(500, { ok: false, error: "Payment server error. Try again." });
  }
};

module.exports.paynowHash = paynowHash; // for tests

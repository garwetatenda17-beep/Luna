// LUNA - AI Store Builder For Africa
// ONE APP - Seller / Supplier / Buyer
// Run: npm install && npm run dev

"use client";
import { useEffect, useRef, useState } from "react";
import { COUNTRIES, findCountry, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_WA } from "../lib/africa";
import { lunaReply, rankedMarket } from "../lib/luna";

const STEPS = [
  { id: 1, title: "Who are you?", desc: "Are you here to SELL or SUPPLY?", video: "https://www.youtube.com/embed/VIDEO_ID_1", videoTitle: "Confused? Watch: Seller vs Supplier in 30 sec" },
  { id: 2, title: "Where are you?", desc: "Pick your country and city. Luna shows you what is HOT there.", video: "https://www.youtube.com/embed/VIDEO_ID_2", videoTitle: "Confused? Watch: How to pick your country & city" },
  { id: 3, title: "What should you sell?", desc: "Ask Luna. She checks what is saturated in your city.", video: "https://www.youtube.com/embed/VIDEO_ID_3", videoTitle: "Confused? Watch: What to sell in your city" },
  { id: 4, title: "Luna builds your shop", desc: "Name, logo, products, mobile money - all done in 2 mins.", video: "https://www.youtube.com/embed/VIDEO_ID_4", videoTitle: "Confused? Watch: How Luna builds your shop" },
  { id: 5, title: "Share & Earn", desc: "Share link on WhatsApp Status. Get paid on mobile money.", video: "https://www.youtube.com/embed/VIDEO_ID_5", videoTitle: "Confused? Watch: How you get paid" },
];

const SUPPORT_LINK = `https://wa.me/${SUPPORT_PHONE_WA}?text=${encodeURIComponent("Hi Luna team, I need help with my shop")}`;

const slugify = (s) => (s || "myshop").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "myshop";

const chip = (active, color = "#00C853") => ({ padding: "10px 16px", borderRadius: 20, background: active ? color : "#1A1A1A", color: active && color === "#FFD700" ? "black" : "white", border: "1px solid #444", cursor: "pointer", fontSize: 14 });

export default function LunaApp() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("Seller");
  const [countryName, setCountryName] = useState("Zimbabwe");
  const [city, setCity] = useState("Harare");
  const [customCity, setCustomCity] = useState("");
  const [shopName, setShopName] = useState("");
  const [product, setProduct] = useState(null);
  const [started, setStarted] = useState(false);
  const [chat, setChat] = useState(null);
  const [msg, setMsg] = useState("");
  const [typing, setTyping] = useState(false);
  const [lastProduct, setLastProduct] = useState(null);
  const chatEnd = useRef(null);

  const country = findCountry(countryName);
  const pay = country.pay;
  const payLabel = `${pay.slice(0, 2).join(" + ")}${pay.includes("Cash on Delivery") ? "" : " + Pay on Delivery"}`;

  const greeting = `Hi, I'm Luna 🌙 What do you want to ${role === "Supplier" ? "supply" : "sell"} in ${city}, ${country.name}? Tell me a product, your budget, or ask "what's hot?"`;
  const messages = chat ?? [{ from: "luna", text: greeting }];

  useEffect(() => { chatEnd.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [chat, typing]);

  const resetChat = () => { setChat(null); setLastProduct(null); };
  const pickCountry = (name) => { setCountryName(name); setCity(findCountry(name).cities[0]); setCustomCity(""); resetChat(); };
  const pickCity = (c) => { setCity(c); resetChat(); };

  const send = (text) => {
    const userMsg = (text ?? msg).trim();
    if (!userMsg || typing) return;
    setChat([...messages, { from: "you", text: userMsg }]);
    setMsg("");
    setTyping(true);
    const reply = lunaReply(userMsg, { city, country, role, lastProduct });
    setTimeout(() => {
      setTyping(false);
      setChat((prev) => [...prev, { from: "luna", text: reply.text }]);
      if (reply.suggest) setLastProduct(reply.suggest);
      if (reply.action?.type === "build") {
        setProduct(reply.action.product);
        setTimeout(() => setStep(3), 1400);
      }
    }, 600 + Math.min(900, reply.text.length * 4));
  };

  const shopLink = `luna.app/${slugify(shopName)}`;
  const shareOnWhatsApp = () => {
    const text = `🌙 ${shopName || "My shop"} is LIVE in ${city}!${product ? ` ${product.emoji} ${product.name} available now.` : ""} Order here and pay with ${pay[0]}: https://${shopLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!started) {
    return (
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", padding: 20, fontFamily: "sans-serif", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", paddingTop: 30 }}>
          <div style={{ fontSize: 60 }}>🌙</div>
          <h1 style={{ fontSize: 48, margin: 0, color: "#FFD700" }}>LUNA</h1>
          <p style={{ color: "#aaa" }}>Your Shop Builds Itself While You Sleep</p>
          <p style={{ background: "#1A1A1A", padding: 12, borderRadius: 12, border: "1px solid #FFD700" }}>
            🌍 Built for all 54 African countries — from Cairo to Cape Town, Lagos to Nairobi
          </p>
          <button onClick={() => setStarted(true)} style={{ background: "#FFD700", color: "black", padding: "16px 32px", borderRadius: 30, fontWeight: "bold", fontSize: 18, border: "none", marginTop: 20, width: "100%", cursor: "pointer" }}>
            START - Build My Shop in 2 Mins →
          </button>
          <p style={{ fontSize: 12, color: "#888" }}>No money needed. No Visa card. Mobile money only — EcoCash, M-Pesa, MoMo & more.</p>
        </div>

        <div style={{ marginTop: 30 }}>
          <h3>Confused? Watch how LUNA works (30 sec)</h3>
          <iframe title="How LUNA works" width="100%" height="200" src="https://www.youtube.com/embed/VIDEO_ID_MAIN" style={{ borderRadius: 12, border: "none" }} allowFullScreen />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", padding: 16, paddingBottom: 80, fontFamily: "sans-serif", boxSizing: "border-box" }}>
      {/* PROGRESS BAR */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ flex: 1, height: 6, borderRadius: 10, background: i <= step ? "#FFD700" : "#333" }} />
        ))}
      </div>
      <p style={{ color: "#FFD700", fontSize: 12 }}>STEP {step + 1} OF 5 • LUNA IS GUIDING YOU • {country.flag} {city}</p>
      <h2 style={{ fontSize: 26 }}>{STEPS[step].title}</h2>
      <p style={{ color: "#aaa" }}>{STEPS[step].desc}</p>

      {/* STEP CONTENT */}
      {step === 0 && (
        <div style={{ display: "flex", gap: 12 }}>
          {["Seller", "Supplier"].map(r => (
            <button key={r} onClick={() => { setRole(r); resetChat(); }} style={{ flex: 1, padding: 20, borderRadius: 16, background: role === r ? "#FFD700" : "#1A1A1A", color: role === r ? "black" : "white", border: "1px solid #FFD700", fontWeight: "bold", cursor: "pointer" }}>
              {r === "Seller" ? "🛍️ I want to SELL" : "🏭 I want to SUPPLY"}
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div>
          <label htmlFor="country" style={{ fontSize: 14, color: "#ccc" }}>Your country</label>
          <select id="country" value={countryName} onChange={e => pickCountry(e.target.value)} style={{ width: "100%", padding: 14, borderRadius: 12, background: "#1A1A1A", color: "white", border: "1px solid #FFD700", marginTop: 8, fontSize: 16 }}>
            {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
          </select>

          <p style={{ fontSize: 14, color: "#ccc", marginTop: 18, marginBottom: 8 }}>Your city</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {country.cities.map(c => (
              <button key={c} onClick={() => { setCustomCity(""); pickCity(c); }} style={chip(city === c)}>{c}</button>
            ))}
          </div>
          <input value={customCity} onChange={e => { setCustomCity(e.target.value); if (e.target.value.trim()) pickCity(e.target.value.trim()); else pickCity(country.cities[0]); }} placeholder="Other town? Type it here" style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 12, background: "#1A1A1A", color: "white", border: "1px solid #444", marginTop: 12 }} />

          <div style={{ background: "#111", borderRadius: 12, padding: 12, marginTop: 14, fontSize: 13, color: "#ccc" }}>
            💰 Customers in {country.name} pay with: <b style={{ color: "#FFD700" }}>{pay.join(", ")}</b>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ background: "#1A1A1A", borderRadius: 16, padding: 12, marginBottom: 12 }}>
            <div style={{ maxHeight: 380, overflowY: "auto", marginBottom: 8 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ background: m.from === "luna" ? "#222" : "#FFD700", color: m.from === "luna" ? "white" : "black", padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: "90%", marginLeft: m.from === "luna" ? 0 : "auto", whiteSpace: "pre-line", lineHeight: 1.4, fontSize: 14 }}>
                  {m.text}
                </div>
              ))}
              {typing && <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>🌙 Luna is checking {city}…</div>}
              <div ref={chatEnd} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {[`What's hot in ${city}?`, "I have $50", "How do I get paid?", lastProduct ? "Yes, build it!" : "Solar lamps?"].map(q => (
                <button key={q} onClick={() => send(q)} style={{ ...chip(false), padding: "6px 12px", fontSize: 12, border: "1px solid #FFD700" }}>{q}</button>
              ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); send(); }} style={{ display: "flex", gap: 8 }}>
              <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Ask Luna: What should I sell?" style={{ flex: 1, minWidth: 0, padding: 12, borderRadius: 12, background: "#000", color: "white", border: "1px solid #444" }} />
              <button type="submit" style={{ background: "#00C853", padding: "12px 18px", borderRadius: 12, border: "none", fontWeight: "bold", cursor: "pointer" }}>Ask →</button>
            </form>
          </div>

          <p style={{ fontSize: 13, color: "#aaa", margin: "16px 0 8px" }}>📊 Top picks in {city} — tap one to choose it</p>
          {rankedMarket({ city, country }).slice(0, 6).map(m => (
            <div key={m.product.id} onClick={() => { setProduct(m.product); setLastProduct(m.product); }} style={{ background: product?.id === m.product.id ? "#2a2a10" : "#1A1A1A", padding: 14, borderRadius: 16, marginBottom: 10, borderLeft: `4px solid ${m.level.color}`, cursor: "pointer" }}>
              <b>{m.product.emoji} {m.product.name}</b> <span style={{ fontSize: 12 }}>{m.level.label} - ~{m.sellers} sellers</span><br />
              <span style={{ color: "#aaa", fontSize: 13 }}>Supplier ${m.product.supplier} • Sell ${m.product.sell} • <b style={{ color: "#FFD700" }}>You keep ~${m.keep}</b></span>
            </div>
          ))}
          <p style={{ fontSize: 11, color: "#666" }}>Market numbers are Luna estimates for {city}.</p>
        </div>
      )}

      {step === 3 && (
        <div>
          <label htmlFor="shopName">Your Shop Name</label>
          <input id="shopName" value={shopName} onChange={e => setShopName(e.target.value)} placeholder={`e.g. ${product ? product.name.split(" ")[0] : "Blessed"} Hub ${city}`} style={{ width: "100%", boxSizing: "border-box", padding: 14, borderRadius: 12, background: "#1A1A1A", color: "white", border: "1px solid #444", marginTop: 8 }} />
          <div style={{ background: "linear-gradient(135deg, #FFD700, #00C853)", padding: 20, borderRadius: 16, marginTop: 16, color: "black", lineHeight: 1.5 }}>
            <b>✨ Luna Preview:</b><br />
            {shopName || "Your Shop"} • {city}, {country.flag} {country.name}<br />
            {product ? <>Selling: {product.emoji} {product.name} at ${product.sell}<br /></> : <>Selling: pick a product in step 3<br /></>}
            Logo: 🌙 {shopName || "Shop"} • {payLabel} enabled
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: "center", background: "#1A1A1A", padding: 24, borderRadius: 20 }}>
          <div style={{ fontSize: 50 }}>🎉</div>
          <h3>Your shop is LIVE!</h3>
          <p>Share this link on WhatsApp Status:</p>
          <div style={{ background: "black", padding: 12, borderRadius: 12, color: "#FFD700", wordBreak: "break-all" }}>{shopLink}</div>
          <p style={{ fontSize: 13, color: "#aaa" }}>Customers pay you with {pay.join(", ")}.</p>
          <button onClick={shareOnWhatsApp} style={{ background: "#25D366", padding: 16, borderRadius: 30, width: "100%", marginTop: 8, fontWeight: "bold", border: "none", fontSize: 16, cursor: "pointer" }}>Share on WhatsApp →</button>
        </div>
      )}

      {/* VIDEO HELP - UNDER EVERY STEP */}
      <div style={{ marginTop: 24, background: "#111", padding: 14, borderRadius: 16 }}>
        <b>😕 {STEPS[step].videoTitle}</b>
        <iframe title={STEPS[step].videoTitle} width="100%" height="180" src={STEPS[step].video} style={{ borderRadius: 12, border: "none", marginTop: 10 }} allowFullScreen />
        <p style={{ fontSize: 12, color: "#888" }}>Still confused? WhatsApp us: <a href={SUPPORT_LINK} target="_blank" rel="noopener noreferrer" style={{ color: "#25D366" }}>{SUPPORT_PHONE_DISPLAY}</a></p>
      </div>

      {/* NEXT / BACK */}
      <div style={{ display: "flex", gap: 10, marginTop: 20, marginBottom: 40 }}>
        {step > 0 && <button onClick={() => setStep(step - 1)} style={{ flex: 1, padding: 14, borderRadius: 12, background: "#222", color: "white", border: "none", cursor: "pointer" }}>← Back</button>}
        {step < 4 && <button onClick={() => setStep(step + 1)} style={{ flex: 2, padding: 14, borderRadius: 12, background: "#FFD700", color: "black", fontWeight: "bold", border: "none", cursor: "pointer" }}>Next →</button>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#111", display: "flex", justifyContent: "space-around", padding: 12, borderTop: "1px solid #333", fontSize: 13 }}>
        <span>🌙 Ask Luna</span><span>🛍️ My Shop</span><span>🏆 Leaderboard</span><span>🎓 School</span>
      </div>
    </div>
  );
}

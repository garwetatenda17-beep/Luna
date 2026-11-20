// LUNA - AI Store Builder For Africa
// ONE APP - Seller / Supplier / Buyer
// Run: npm install && npm run dev

"use client";
import { useState } from "react";

const STEPS = [
  { id: 1, title: "Who are you?", desc: "Are you here to SELL or SUPPLY?", video: "https://www.youtube.com/embed/VIDEO_ID_1", videoTitle: "Confused? Watch: Seller vs Supplier in 30 sec" },
  { id: 2, title: "Where are you?", desc: "Luna will show you what is HOT in your city.", video: "https://www.youtube.com/embed/VIDEO_ID_2", videoTitle: "Confused? Watch: How to pick your city" },
  { id: 3, title: "What should you sell?", desc: "Ask Luna. She checks what is saturated.", video: "https://www.youtube.com/embed/VIDEO_ID_3", videoTitle: "Confused? Watch: What to sell in your city" },
  { id: 4, title: "Luna builds your shop", desc: "Name, logo, products, EcoCash - all done in 2 mins.", video: "https://www.youtube.com/embed/VIDEO_ID_4", videoTitle: "Confused? Watch: How Luna builds your shop" },
  { id: 5, title: "Share & Earn", desc: "Share link on WhatsApp Status. Get paid on EcoCash.", video: "https://www.youtube.com/embed/VIDEO_ID_5", videoTitle: "Confused? Watch: How you get paid" },
];

const CITIES = ["Harare", "Bulawayo", "Mutare", "Lusaka", "Lagos"];

const PRODUCTS = [
  { name: "Wireless Earphones", supplier: 8, sell: 15, profit: 5, status: "🔥 HOT - Only 12 sellers", color: "green" },
  { name: "Phone Holder + Stand", supplier: 4, sell: 10, profit: 4, status: "🟢 GOOD - Low competition", color: "green" },
  { name: "Wigs - Brazilian 26 inch", supplier: 15, sell: 28, profit: 8, status: "🔴 SATURATED - 200 sellers", color: "red" },
  { name: "Sneakers - Air Force Style", supplier: 18, sell: 30, profit: 7, status: "🟡 MEDIUM - 85 sellers", color: "yellow" },
];

const slugify = (s) => (s || "myshop").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "myshop";

export default function LunaApp() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("Seller");
  const [city, setCity] = useState("Harare");
  const [shopName, setShopName] = useState("");
  const [started, setStarted] = useState(false);
  const [chat, setChat] = useState(null);
  const [msg, setMsg] = useState("");

  const messages = chat ?? [{ from: "luna", text: `Hi, I'm Luna 🌙 What do you want to ${role === "Supplier" ? "supply" : "sell"} in ${city}?` }];

  const askLuna = () => {
    const userMsg = msg.trim();
    if (!userMsg) return;
    setChat([...messages, { from: "you", text: userMsg }]);
    setMsg("");
    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let reply = `Good idea! Let me check saturation... In ${city}, that is 🔴 SATURATED. Try Phone Accessories instead - only 12 sellers, profit $4 per sale. Want me to build you a shop for that?`;
      if (lower.includes("earphone") || lower.includes("phone")) reply = `🟢 GREAT PICK! Earphones are HOT in ${city}. Supplier $8, you sell $15, you keep $5. Want me to build your shop now?`;
      setChat(prev => [...prev, { from: "luna", text: reply }]);
    }, 800);
  };

  const shopLink = `luna.app/${slugify(shopName)}`;
  const shareOnWhatsApp = () => {
    const text = `🌙 My shop is LIVE! ${shopName || "My Shop"} in ${city} - order now, pay with EcoCash: https://${shopLink}`;
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
            🔥 20 sellers already earning in Harare this week
          </p>
          <button onClick={() => setStarted(true)} style={{ background: "#FFD700", color: "black", padding: "16px 32px", borderRadius: 30, fontWeight: "bold", fontSize: 18, border: "none", marginTop: 20, width: "100%", cursor: "pointer" }}>
            START - Build My Shop in 2 Mins →
          </button>
          <p style={{ fontSize: 12, color: "#888" }}>No money needed. No Visa card. EcoCash only.</p>
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
      <p style={{ color: "#FFD700", fontSize: 12 }}>STEP {step + 1} OF 5 • LUNA IS GUIDING YOU</p>
      <h2 style={{ fontSize: 26 }}>{STEPS[step].title}</h2>
      <p style={{ color: "#aaa" }}>{STEPS[step].desc}</p>

      {/* STEP CONTENT */}
      {step === 0 && (
        <div style={{ display: "flex", gap: 12 }}>
          {["Seller", "Supplier"].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: 20, borderRadius: 16, background: role === r ? "#FFD700" : "#1A1A1A", color: role === r ? "black" : "white", border: "1px solid #FFD700", fontWeight: "bold", cursor: "pointer" }}>
              {r === "Seller" ? "🛍️ I want to SELL" : "🏭 I want to SUPPLY"}
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {CITIES.map(c => (
            <button key={c} onClick={() => setCity(c)} style={{ padding: "12px 20px", borderRadius: 20, background: city === c ? "#00C853" : "#1A1A1A", color: "white", border: "1px solid #444", cursor: "pointer" }}>{c}</button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ background: "#1A1A1A", borderRadius: 16, padding: 12, marginBottom: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ background: m.from === "luna" ? "#222" : "#FFD700", color: m.from === "luna" ? "white" : "black", padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: "90%", marginLeft: m.from === "luna" ? 0 : "auto" }}>
                {m.text}
              </div>
            ))}
            <form onSubmit={e => { e.preventDefault(); askLuna(); }} style={{ display: "flex", gap: 8 }}>
              <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Ask Luna: What should I sell?" style={{ flex: 1, minWidth: 0, padding: 12, borderRadius: 12, background: "#000", color: "white", border: "1px solid #444" }} />
              <button type="submit" style={{ background: "#00C853", padding: "12px 18px", borderRadius: 12, border: "none", fontWeight: "bold", cursor: "pointer" }}>Ask →</button>
            </form>
          </div>
          {PRODUCTS.map(p => (
            <div key={p.name} style={{ background: "#1A1A1A", padding: 14, borderRadius: 16, marginBottom: 10, borderLeft: `4px solid ${p.color === "green" ? "#00C853" : p.color === "red" ? "red" : "gold"}` }}>
              <b>{p.name}</b> <span style={{ fontSize: 12 }}>{p.status}</span><br />
              <span style={{ color: "#aaa", fontSize: 13 }}>Supplier ${p.supplier} • Sell ${p.sell} • <b style={{ color: "#FFD700" }}>You keep ${p.profit}</b></span>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div>
          <label htmlFor="shopName">Your Shop Name</label>
          <input id="shopName" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. Blessed Wigs Harare" style={{ width: "100%", boxSizing: "border-box", padding: 14, borderRadius: 12, background: "#1A1A1A", color: "white", border: "1px solid #444", marginTop: 8 }} />
          <div style={{ background: "linear-gradient(135deg, #FFD700, #00C853)", padding: 20, borderRadius: 16, marginTop: 16, color: "black" }}>
            <b>✨ Luna Preview:</b><br />
            {shopName || "Your Shop"} • {city}<br />
            Logo: 🌙 {shopName || "Shop"} • EcoCash + Pay on Delivery enabled
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: "center", background: "#1A1A1A", padding: 24, borderRadius: 20 }}>
          <div style={{ fontSize: 50 }}>🎉</div>
          <h3>Your shop is LIVE!</h3>
          <p>Share this link on WhatsApp Status:</p>
          <div style={{ background: "black", padding: 12, borderRadius: 12, color: "#FFD700", wordBreak: "break-all" }}>{shopLink}</div>
          <button onClick={shareOnWhatsApp} style={{ background: "#25D366", padding: 16, borderRadius: 30, width: "100%", marginTop: 16, fontWeight: "bold", border: "none", fontSize: 16, cursor: "pointer" }}>Share on WhatsApp →</button>
        </div>
      )}

      {/* VIDEO HELP - UNDER EVERY STEP */}
      <div style={{ marginTop: 24, background: "#111", padding: 14, borderRadius: 16 }}>
        <b>😕 {STEPS[step].videoTitle}</b>
        <iframe title={STEPS[step].videoTitle} width="100%" height="180" src={STEPS[step].video} style={{ borderRadius: 12, border: "none", marginTop: 10 }} allowFullScreen />
        <p style={{ fontSize: 12, color: "#888" }}>Still confused? WhatsApp us: +263 XXX XXX XXXX</p>
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

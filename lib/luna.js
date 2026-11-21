// Luna's reply engine. Runs in the browser, no API key needed.
// Market numbers are estimates generated per city until live seller data is connected.

export const PRODUCTS = [
  { id: "earphones", name: "Wireless Earphones", emoji: "🎧", supplier: 8, sell: 15, base: 30, cat: "phone", keys: ["earphone", "earbud", "headphone", "airpod", "bluetooth", "music"] },
  { id: "holder", name: "Phone Holder + Stand", emoji: "📱", supplier: 4, sell: 10, base: 20, cat: "phone", keys: ["phone holder", "phone stand", "holder", "stand", "tripod", "ring light"] },
  { id: "cases", name: "Phone Cases & Screen Guards", emoji: "🛡️", supplier: 2, sell: 6, base: 90, cat: "phone", keys: ["phone case", "case", "cover", "screen guard", "screen protector", "protector"] },
  { id: "powerbank", name: "Power Banks", emoji: "🔋", supplier: 10, sell: 20, base: 35, cat: "power", keys: ["power bank", "powerbank", "battery"] },
  { id: "solar", name: "Solar Lamps & Panels", emoji: "☀️", supplier: 12, sell: 25, base: 25, cat: "power", keys: ["solar", "lamp", "light", "load shedding", "loadshedding", "power cut", "blackout", "zesa", "nepa", "electricity"] },
  { id: "chargers", name: "Fast Chargers & Cables", emoji: "🔌", supplier: 3, sell: 8, base: 70, cat: "phone", keys: ["charger", "cable", "usb", "type c", "charging"] },
  { id: "watch", name: "Smart Watches", emoji: "⌚", supplier: 9, sell: 20, base: 40, cat: "phone", keys: ["smart watch", "smartwatch", "watch", "fitness band"] },
  { id: "wigs", name: "Wigs & Hair Extensions", emoji: "💇🏾‍♀️", supplier: 15, sell: 28, base: 220, cat: "beauty", keys: ["wig", "weave", "braid", "extension", "lace front", "frontal", "bundles", "brazilian", "hair"] },
  { id: "sneakers", name: "Sneakers", emoji: "👟", supplier: 18, sell: 30, base: 120, cat: "fashion", keys: ["sneaker", "shoe", "trainer", "air force", "jordan", "nike", "adidas", "footwear"] },
  { id: "dresses", name: "Ladies' Dresses", emoji: "👗", supplier: 7, sell: 16, base: 150, cat: "fashion", keys: ["dress", "clothes", "clothing", "fashion", "outfit", "ladies wear", "boutique"] },
  { id: "baby", name: "Baby Clothes Sets", emoji: "👶🏾", supplier: 5, sell: 12, base: 45, cat: "fashion", keys: ["baby", "kids", "children", "newborn", "toddler", "infant"] },
  { id: "skincare", name: "Skincare & Body Lotion", emoji: "🧴", supplier: 4, sell: 9, base: 80, cat: "beauty", keys: ["skincare", "skin care", "lotion", "cream", "cosmetic", "makeup", "make up", "beauty", "skin", "soap"] },
  { id: "perfume", name: "Perfumes", emoji: "🌸", supplier: 6, sell: 15, base: 100, cat: "beauty", keys: ["perfume", "fragrance", "cologne", "scent", "body spray", "oud"] },
  { id: "bags", name: "Handbags & Backpacks", emoji: "👜", supplier: 8, sell: 18, base: 60, cat: "fashion", keys: ["handbag", "bag", "purse", "backpack", "clutch"] },
  { id: "kitchen", name: "Kitchen Gadgets", emoji: "🍳", supplier: 10, sell: 20, base: 30, cat: "home", keys: ["kitchen", "blender", "pot", "cooking", "cook", "appliance", "kettle", "air fryer", "chopper"] },
  { id: "school", name: "School Supplies", emoji: "🎒", supplier: 3, sell: 7, base: 40, cat: "home", keys: ["school", "stationery", "exercise book", "pens", "uniform", "books"] },
  { id: "clippers", name: "Hair Clippers & Grooming", emoji: "💈", supplier: 9, sell: 18, base: 35, cat: "beauty", keys: ["hair clipper", "clipper", "shaver", "barber", "grooming", "beard", "trimmer"] },
];

const CAT_NAMES = { phone: "phone accessories", power: "power & solar", beauty: "beauty", fashion: "fashion", home: "home & school" };

// Stable 0..1 number for a string, so each city gets its own (but consistent) market.
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

const keepPerSale = (p) => Math.max(1, Math.round((p.sell - p.supplier) * 0.7));

export function marketFor(product, place) {
  const { city, country } = place;
  const rank = Math.max(0, country.cities.indexOf(city));
  const citySize = rank === -1 ? 0.5 : [1, 0.65, 0.5, 0.42, 0.36, 0.32][rank] ?? 0.3;
  const sellers = Math.max(3, Math.round(product.base * citySize * (0.55 + 0.9 * hash(city + product.id))));
  const demand = 0.6 + 0.8 * hash(product.id + country.name); // relative buyer demand
  const pressure = sellers / demand;
  const level =
    pressure < 28 ? { key: "hot", label: "🔥 HOT", color: "#00C853" } :
    pressure < 60 ? { key: "good", label: "🟢 GOOD", color: "#00C853" } :
    pressure < 120 ? { key: "medium", label: "🟡 MEDIUM", color: "gold" } :
    { key: "saturated", label: "🔴 SATURATED", color: "#FF5252" };
  return { product, sellers, level, keep: keepPerSale(product), score: pressure };
}

export const rankedMarket = (place) => PRODUCTS.map((p) => marketFor(p, place)).sort((a, b) => a.score - b.score);

const money = (n) => `$${n}`;
const has = (t, words) => words.some((w) => new RegExp(`\\b${w}`, "i").test(t));

function matchProduct(text) {
  let best = null, bestScore = 0;
  for (const p of PRODUCTS) {
    let score = 0;
    for (const k of p.keys) if (new RegExp(`\\b${k}`, "i").test(text)) score += k.length;
    if (score > bestScore) { best = p; bestScore = score; }
  }
  return best;
}

function parseBudget(text) {
  const m =
    text.match(/\$\s?(\d[\d,]*)/) ||
    text.match(/(\d[\d,]*)\s?(usd|dollars?|bucks|us\b)/i) ||
    text.match(/\b(?:budget|capital|have|got|only|start with|starting with)\b\D{0,12}(\d[\d,]*)/i);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : null;
}

const fmtMarket = (m, place) => `${m.product.emoji} ${m.product.name} — ${m.level.label} in ${place.city}, about ${m.sellers} sellers`;

function sellerAnalysis(m, place) {
  const p = m.product;
  const monthly = m.keep * 2 * 30;
  const head = `${fmtMarket(m, place)}.\nSupplier ${money(p.supplier)} → you sell ${money(p.sell)} → you keep about ${money(m.keep)} per sale after delivery & fees. Sell 2 a day ≈ ${money(monthly)} a month.`;
  if (m.level.key === "saturated" || m.level.key === "medium") {
    const alt = rankedMarket(place).find((x) => x.product.cat === p.cat && x.product.id !== p.id && x.score < m.score) || rankedMarket(place)[0];
    const warn = m.level.key === "saturated"
      ? `⚠️ Too many people sell this in ${place.city} — buyers will push your price down.`
      : `It can work, but you must stand out (better photos, fast delivery, bundle deals).`;
    return { text: `${head}\n\n${warn}\n💡 Better pick: ${alt.product.emoji} ${alt.product.name} (${alt.level.label}, ~${alt.sellers} sellers, keep ${money(alt.keep)}/sale). Say "yes" to build a shop for ${alt.product.name}, or "build ${p.name.split(" ")[0].toLowerCase()}" to go with your idea anyway.`, suggest: alt.product };
  }
  return { text: `${head}\n\n✅ GREAT PICK! Want me to build your shop for this now? Say "yes".`, suggest: p };
}

function supplierAnalysis(m, place) {
  const p = m.product;
  const need = Math.max(5, Math.round(m.sellers * 0.6));
  const tip = m.level.key === "saturated"
    ? `Lots of sellers = lots of buyers for YOU. Win with the lowest wholesale price and reliable stock.`
    : `Few suppliers serve this in ${place.city} yet — you can set the price.`;
  return { text: `${p.emoji} ${p.name} in ${place.city}: about ${m.sellers} sellers, roughly ${need} of them need a regular supplier.\nThey buy at about ${money(p.supplier)} each and resell at ${money(p.sell)}. Offer 10+ unit bundles a little under ${money(p.supplier)}.\n\n${tip}\nSay "yes" and I'll list you as a ${p.name} supplier in ${place.city}.`, suggest: p };
}

function recommend(place, role, budget) {
  let list = rankedMarket(place);
  if (budget) list = list.filter((m) => m.product.supplier * 3 <= budget);
  const fresh = list.filter((m) => m.level.key !== "saturated");
  if (fresh.length) list = fresh;
  if (!list.length) {
    const cheapest = [...PRODUCTS].sort((a, b) => a.supplier - b.supplier)[0];
    return { text: `With ${money(budget)} it's tight, but you can start! ${cheapest.emoji} ${cheapest.name} cost only ${money(cheapest.supplier)} each — buy ${Math.floor(budget / cheapest.supplier)} and grow from your profit.\n\nEven better: start with ${money(0)} stock. List products, collect the order + payment first, then buy from the supplier. Say "yes" to build that shop.`, suggest: cheapest };
  }
  const top = list.slice(0, 3);
  const lines = top.map((m, i) => {
    const units = budget ? ` — ${Math.floor(budget / m.product.supplier)} units with your ${money(budget)}` : "";
    if (role === "Supplier") return `${i + 1}. ${m.product.emoji} ${m.product.name} — ~${Math.max(5, Math.round(m.sellers * 0.6))} sellers need stock, wholesale ~${money(m.product.supplier)}`;
    return `${i + 1}. ${m.product.emoji} ${m.product.name} — ${m.level.label}, ~${m.sellers} sellers, keep ${money(m.keep)}/sale${units}`;
  });
  const intro = role === "Supplier"
    ? `Best products to SUPPLY in ${place.city} right now (sellers need stock, few suppliers):`
    : budget
      ? `With ${money(budget)} in ${place.city}, here's what I'd sell:`
      : `What's HOT in ${place.city} right now (low competition, good profit):`;
  return { text: `${intro}\n${lines.join("\n")}\n\n👉 My #1 pick: ${top[0].product.name}. Say "yes" to build it, or ask me about any product.`, suggest: top[0].product };
}

/**
 * @param {string} input   what the user typed
 * @param {{city:string,country:object,role:string,lastProduct?:object}} ctx
 * @returns {{text:string, suggest?:object, action?:{type:"build",product:object}}}
 */
export function lunaReply(input, ctx) {
  const text = input.trim().toLowerCase();
  const place = { city: ctx.city, country: ctx.country };
  const role = ctx.role;
  const pay = ctx.country.pay;
  const product = matchProduct(text);
  const budget = parseBudget(text);

  // Confirm / build
  const yes = /^(yes|yeah|yah|yebo|ehe|ndiyo|ndio|eeh|ok|okay|sure|sharp|let'?s go|go|do it|build( it)?|please|yes please)\b/i.test(text);
  if ((yes || /\bbuild\b/.test(text)) && (product || ctx.lastProduct)) {
    const p = product || ctx.lastProduct;
    return {
      text: `🛠️ On it! Building your ${role === "Supplier" ? "supplier page" : "shop"} for ${p.emoji} ${p.name} in ${place.city} with ${pay.slice(0, 2).join(" + ")}${pay.includes("Cash on Delivery") ? "" : " + Pay on Delivery"}. Taking you to the next step...`,
      suggest: p,
      action: { type: "build", product: p },
    };
  }

  if (has(text, ["thank", "thanks", "tatenda", "asante", "merci", "ngiyabonga", "siyabonga"])) {
    return { text: `You're welcome! 🌙 I'm here any time. When you're ready, say "yes" and I'll build your shop.` };
  }

  if (has(text, ["pay", "payment", "paid", "money transfer", "ecocash", "mpesa", "m-pesa", "momo", "mobile money", "bank", "withdraw", "cash out"]) && !product) {
    return { text: `💰 In ${ctx.country.name} your customers can pay with: ${pay.join(", ")}${pay.includes("Cash on Delivery") ? "" : ", or Cash on Delivery"}.\nMoney goes straight to your number — Luna never holds your money. Tip: for new customers, ask for payment BEFORE you buy from the supplier, so you never risk your own cash.` };
  }

  if (has(text, ["deliver", "delivery", "ship", "courier", "transport", "send to"])) {
    return { text: `🚚 Delivery in ${place.city}: start with local runners / kombi drivers or a motorbike courier, and charge delivery separately (usually ${money(1)}–${money(3)} in town). For other cities in ${ctx.country.name}, use a bus parcel service and send the waybill photo to the buyer. Pay on Delivery builds trust with first-time buyers.` };
  }

  if (has(text, ["supplier", "wholesale", "where.*(buy|get|find)", "stock", "source"]) && role !== "Supplier") {
    const p = product || ctx.lastProduct;
    return { text: `📦 You don't need to buy stock first! Luna connects you to verified suppliers in ${ctx.country.name}${p ? ` for ${p.name} (around ${money(p.supplier)} each)` : ""}. A buyer orders → pays you → you order from the supplier → supplier delivers. You keep the difference.`, suggest: p };
  }

  if (has(text, ["how much", "price", "charge", "markup", "profit", "margin"]) && (product || ctx.lastProduct)) {
    const p = product || ctx.lastProduct;
    const m = marketFor(p, place);
    return { text: `💵 ${p.name}: supplier ${money(p.supplier)}. Sell at ${money(p.sell)} (sweet spot in ${place.city}). Don't go below ${money(p.supplier + 3)} or delivery eats your profit. You keep about ${money(m.keep)} per sale. Bundle tip: 2 for ${money(p.sell * 2 - 2)} moves stock faster.`, suggest: p };
  }

  if (has(text, ["whatsapp", "status", "market", "advert", "promot", "customers", "followers", "tiktok", "facebook", "instagram", "sell more"])) {
    return { text: `📣 How top sellers in ${place.city} get customers:\n1. Post 3 WhatsApp Statuses a day — product photo, price, "DM to order".\n2. Show proof: screenshots of happy customers.\n3. Join local buy & sell groups on Facebook/WhatsApp.\n4. Short TikTok videos unboxing the product.\nYour Luna link makes ordering one tap.` };
  }

  if (product) return role === "Supplier" ? supplierAnalysis(marketFor(product, place), place) : sellerAnalysis(marketFor(product, place), place);

  if (budget !== null || has(text, ["what (should|can|do) i", "recommend", "suggest", "best", "hot", "trending", "idea", "profitable", "sell what", "help me", "don'?t know", "not sure", "anything", "what to sell", "what sells"])) {
    return recommend(place, role, budget);
  }

  if (has(text, ["phone", "cellphone", "mobile", "gadget", "electronic"])) {
    const best = rankedMarket(place).find((m) => m.product.cat === "phone");
    return sellerAnalysis(best, place);
  }

  const catHit = Object.entries({ beauty: ["beauty", "salon"], fashion: ["fashion", "clothes", "wear"], home: ["home", "house"] })
    .find(([, w]) => has(text, w));
  if (catHit) {
    const best = rankedMarket(place).find((m) => m.product.cat === catHit[0]);
    return sellerAnalysis(best, place);
  }

  if (has(text, ["hi", "hello", "hey", "mhoro", "mhoroi", "salibonani", "habari", "jambo", "sawubona", "bonjour", "salut", "salaam", "sannu", "bawo", "kedu", "good (morning|afternoon|evening)"])) {
    return { text: `Hey! 🌙 I'm Luna. Tell me a product you're thinking of (e.g. "wigs", "solar lamps"), your budget (e.g. "I have $50"), or just ask "what's hot in ${place.city}?"` };
  }

  if (has(text, ["scam", "safe", "trust", "legit", "real"])) {
    return { text: `🔒 Fair question. Luna never holds your money — buyers pay you directly on ${pay[0]}. Suppliers are rated by sellers, and you can always choose Pay on Delivery. Questions? WhatsApp our team any time.` };
  }

  return {
    text: `Hmm, I don't know that product yet 🤔 — but here's what's working in ${place.city}:\n${rankedMarket(place).slice(0, 3).map((m) => `• ${m.product.emoji} ${m.product.name} (${m.level.label}, keep ${money(m.keep)}/sale)`).join("\n")}\n\nTry: "I have $30", "how do I get paid?", or a product like "perfume".`,
  };
}

export const CATEGORY_NAMES = CAT_NAMES;

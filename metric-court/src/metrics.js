// Counting rules for the party and the orders, plus money formatting.

// How many times one guest is counted by each person.
export function countGuest(guest, who) {
  if (who === "caterer") return guest.came ? (guest.seconds ? 2 : 1) : 0;
  if (who === "host") return guest.rsvp ? 1 : 0;
  if (who === "photographer") return guest.came && !guest.leftEarly ? 1 : 0;
  throw new Error(`unknown counter ${who}`);
}

export const partyCount = (guests, who) => guests.reduce((n, g) => n + countGuest(g, who), 0);

// The switch that removes an order under a recipe, or null when it counts.
export const excludedBy = (order, recipe) => (order.kind && recipe[order.kind] ? order.kind : null);

export const revenue = (orders, recipe) => orders.reduce((n, o) => n + (excludedBy(o, recipe) ? 0 : o.amount), 0);

export const sameRecipe = (a, b) => Object.keys(b).every((k) => Boolean(a[k]) === Boolean(b[k]));

// The visitor's own currency and number format, guessed from the browser locale.
const currencyByRegion = {
  US: "USD", IN: "INR", GB: "GBP", JP: "JPY", CN: "CNY", AU: "AUD", CA: "CAD", SG: "SGD", NZ: "NZD",
  CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", BR: "BRL", MX: "MXN", ZA: "ZAR", AE: "AED", KR: "KRW",
};
const euro = "AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK".split(" ");

export function moneyFormatter(locale = globalThis.navigator?.language || "en-US") {
  let region = "US";
  try {
    region = new Intl.Locale(locale).maximize().region || "US";
  } catch {}
  const currency = euro.includes(region) ? "EUR" : currencyByRegion[region] || "USD";
  const f = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
  return (n) => f.format(Math.round(n));
}

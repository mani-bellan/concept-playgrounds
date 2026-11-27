// How rows become a number: party counts, case metrics, Build a metric, and money.

// How many times one guest is counted by each person.
export function countGuest(guest, who) {
  if (who === "caterer") return guest.came ? (guest.seconds ? 2 : 1) : 0;
  if (who === "host") return guest.rsvp ? 1 : 0;
  if (who === "photographer") return guest.came && !guest.leftEarly ? 1 : 0;
  throw new Error(`unknown counter ${who}`);
}

export const partyCount = (guests, who) => guests.reduce((n, g) => n + countGuest(g, who), 0);

// The switch that removes a row under a recipe, or undefined when it counts.
// "!key" removes the row while that switch is off.
export const excludedBy = (row, recipe) =>
  row.out?.find((k) => (k.startsWith("!") ? !recipe[k.slice(1)] : recipe[k]))?.replace("!", "");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// The case's number under a recipe.
//   sum: total of row values. rate: share of rows (or of value, when weighted)
//   marked hit, as a percent. average: mean of rows, or of each group's mean.
export function measure(c, recipe) {
  const rows = c.rows.filter((r) => !excludedBy(r, recipe));
  if (c.metric === "sum") return rows.reduce((n, r) => n + r.value, 0);
  if (c.metric === "rate") {
    const w = (r) => (recipe.weight ? r.value : 1);
    return (100 * rows.filter((r) => r.hit).reduce((n, r) => n + w(r), 0)) / rows.reduce((n, r) => n + w(r), 0);
  }
  if (c.metric === "average") {
    if (recipe.pooled) return mean(rows.map((r) => r.value));
    const groups = [...new Set(rows.map((r) => r.group))];
    return mean(groups.map((g) => mean(rows.filter((r) => r.group === g).map((r) => r.value))));
  }
  throw new Error(`unknown metric ${c.metric}`);
}

export const sameRecipe = (a, b) => Object.keys(b).every((k) => Boolean(a[k]) === Boolean(b[k]));

// Build a metric: what one order adds under a definition.
export function buildContribution(order, d) {
  if (d.test && order.test) return 0;
  if (d.staff && order.staff) return 0;
  if (d.net && order.refunded) return 0;
  if (d.localTz && order.lateTz) return 0; // already April in company time
  return order.amount * (d.grain ? order.items : 1);
}
export const buildTotal = (orders, d) => orders.reduce((n, o) => n + buildContribution(o, d), 0);

// The dbt MetricFlow YAML (dbt 1.12 style) for a Build a metric definition.
export function toMetricFlow(d) {
  const model = d.grain ? "order_items" : "orders";
  const time = d.localTz ? "ordered_at_local" : "ordered_at_utc";
  const filters = [
    d.net && `{{ Dimension('order__status') }} != 'refunded'`,
    d.test && `{{ Dimension('order__is_test') }} = false`,
    d.staff && `{{ Dimension('order__is_staff') }} = false`,
  ].filter(Boolean);
  return [
    "# Revenue, defined once. Every dashboard and AI assistant that queries the",
    "# dbt Semantic Layer gets this recipe. Written for dbt 1.12 YAML; column",
    "# names are assumptions about your orders model.",
    d.grain ? "# Warning: order_items has one row per item, so summing the order amount\n# counts each order once per item. Use the orders model instead." : null,
    d.localTz ? "# ordered_at_local: order time converted to Asia/Singapore in the model." : null,
    "models:",
    `  - name: ${model}`,
    "    semantic_model:",
    "      enabled: true",
    `      agg_time_dimension: ${time}`,
    "    columns:",
    d.grain ? "      - name: order_item_id\n        entity:\n          type: primary\n          name: order_item\n      - name: order_id\n        entity:\n          type: foreign\n          name: order" : "      - name: order_id\n        entity:\n          type: primary\n          name: order",
    `      - name: ${time}`,
    "        granularity: day",
    "        dimension:",
    "          type: time",
    ...["status", "is_test", "is_staff"].flatMap((col) => [`      - name: ${col}`, "        dimension:", "          type: categorical"]),
    "    metrics:",
    "      - name: revenue",
    "        label: Revenue",
    "        type: simple",
    "        agg: sum",
    "        expr: amount",
    ...(filters.length ? [`        filter: "${filters.join(" and ")}"`] : []),
  ]
    .filter((l) => l !== null)
    .join("\n");
}

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

// Formats a value in a case's unit.
export function formatter(unit, locale) {
  if (unit === "money") return moneyFormatter(locale);
  const n = new Intl.NumberFormat(locale || globalThis.navigator?.language || "en-US", { maximumFractionDigits: 0 });
  return unit === "percent" ? (v) => `${n.format(v)}%` : (v) => n.format(Math.round(v));
}

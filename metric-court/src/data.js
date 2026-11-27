// All content: the party warm-up and the eight cases.
// Every number a case claims is checked against the data by tests/content.test.mjs.
//
// A case is a dispute between teams that read the same rows. Rows can carry
// `out`: the switches that remove them ("!key" removes the row while the switch
// is off). Mode switches change how rows are combined instead (see metrics.js).
// Team claims are in the case's unit; money is in whole currency units.

// Everyone Sam invited. came: was at the party. rsvp: said yes beforehand.
// seconds: went back for a second plate. leftEarly: gone before the 9 PM photo.
const names = [
  "Ana", "Ben", "Chen", "Dara", "Eli", "Fatima", "Gus", "Hana", "Ivan", "Jade",
  "Kofi", "Lena", "Mateo", "Nia", "Omar", "Priya", "Quinn", "Rosa", "Tomas", "Uma",
  "Vik", "Wen", "Xavi", "Yara", "Zoe", "Aiko", "Bruno", "Chloe", "Diego", "Emma",
  "Femi", "Greta", "Hugo", "Ines", "Jonas", "Kira", "Liam", "Mei",
  "Noah", "Olga", "Pablo", "Rui",
];
const noShows = new Set(["Noah", "Olga", "Pablo", "Rui"]);
const walkIns = new Set(["Femi", "Greta"]);
const seconds = new Set(["Ben", "Gus", "Kofi", "Omar", "Tomas", "Xavi", "Diego", "Hugo"]);
const leftEarly = new Set(["Dara", "Jade", "Uma", "Chloe", "Liam"]);

export const party = {
  guests: names.map((name) => ({
    name,
    came: !noShows.has(name),
    rsvp: !walkIns.has(name),
    seconds: seconds.has(name),
    leftEarly: leftEarly.has(name),
  })),
  claims: { caterer: 46, host: 40, photographer: 33 },
  counters: {
    caterer: { label: "The caterer", says: "counted plates served", lesson: "Plates, not people. Anyone who went back for seconds counts twice." },
    host: { label: "Sam, the host", says: "counted RSVPs", lesson: "Promises, not arrivals. No-shows count, and walk-ins who never replied are left out." },
    photographer: { label: "The photographer", says: "counted the 9 PM group photo", lesson: "Only who was there at 9 PM. Guests who left early are missing." },
  },
};

// The twelve March orders shared by Case 01 and Case 08.
const marchOrders = (key) => [
  { id: "ORD-101", value: 480 },
  { id: "ORD-102", value: 360 },
  { id: "ORD-103", value: 250, out: key ? [key] : ["refund"], note: "Refunded on 2 Apr" },
  { id: "ORD-104", value: 520 },
  { id: "ORD-105", value: 300 },
  { id: "ORD-106", value: 50, out: key ? [key] : ["test"], note: "Test order by QA" },
  { id: "ORD-107", value: 440 },
  { id: "ORD-108", value: 380 },
  { id: "ORD-109", value: 100, out: key ? [key] : ["tz"], note: "31 Mar, 11:40 PM UTC. Already 1 Apr in Singapore" },
  { id: "ORD-110", value: 610 },
  { id: "ORD-111", value: 290 },
  { id: "ORD-112", value: 420 },
];

// Case 02: five orders joined to their items, one row per item. Every item row
// repeats its order's total, so summing the join counts an order once per item.
const joined = [
  ["O-201", 120, ["Mug", "Tea", "Card"]],
  ["O-202", 80, ["Lamp"]],
  ["O-203", 150, ["Chair", "Cushion"]],
  ["O-204", 60, ["Plant"]],
  ["O-205", 90, ["Book", "Bookmark"]],
].flatMap(([id, total, items]) =>
  items.map((item, i) => ({ id: `${id} · ${item}`, value: total, out: i ? ["dedupe"] : undefined, note: i ? `Same order again (item ${i + 1} of ${items.length})` : `Order total, item 1 of ${items.length}` })),
);

// Case 03: twelve people who signed up. A key action means creating a report;
// everyone who did one also logged in. Kofi pays yearly but never logged in.
const users = [
  ["Ana", 1, 1, 1], ["Ben", 1, 1, 1], ["Chen", 1, 1, 0], ["Dara", 1, 1, 0],
  ["Eli", 1, 1, 0], ["Fatima", 1, 1, 0], ["Gus", 1, 0, 1], ["Hana", 1, 0, 1],
  ["Lena", 1, 0, 0], ["Ivan", 0, 0, 0], ["Jade", 0, 0, 0], ["Kofi", 0, 0, 1],
].map(([name, login, action, paid]) => ({
  id: name,
  value: 1,
  out: [!login && "login", !action && "action", !paid && "paid"].filter(Boolean),
  note: [login ? "Logged in" : "No login", action ? "made a report" : null, paid ? "paying" : "free plan"].filter(Boolean).join(" · "),
}));

export const cases = [
  {
    id: "01",
    title: "March revenue",
    chapter: 2,
    unit: "money",
    metric: "sum",
    rowsLabel: "March orders",
    rows: marchOrders(),
    question: "Sales says March revenue was {sales}. Finance says {finance}. Same 12 orders. Who is right?",
    switches: [
      { key: "refund", label: "Remove refunds", short: "Refunds" },
      { key: "test", label: "Remove test orders", short: "Test orders" },
      { key: "tz", label: "Use company timezone", short: "Timezone" },
    ],
    start: { refund: false, test: false, tz: false },
    teams: [
      { key: "sales", label: "Sales dashboard", recipe: { refund: false, test: false, tz: false }, claim: 4200 },
      { key: "finance", label: "Finance dashboard", recipe: { refund: true, test: true, tz: true }, claim: 3800 },
    ],
    target: ["finance"],
    options: ["Sales", "Finance", "Both", "Neither"],
    answer: 2,
    explain: "Neither team made a mistake. They follow different recipes. Flip the switches to turn the Sales number into the Finance number.",
    hint: "Look for orders that one team would count and the other would not: one was refunded, one was a test, one happened near midnight.",
    verdict: ["REVIEW: BOTH RIGHT", "Same orders, different recipes."],
    lesson: "Sales counts every order placed. Finance removes refunds and test orders and counts dates in company time. Both are fair, as long as each dashboard says which recipe it uses.",
    sql: (r) => [
      "SELECT SUM(amount) AS revenue",
      "FROM orders",
      r.tz ? "+WHERE DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Singapore') = '2026-03-01'" : "WHERE DATE_TRUNC('month', created_at) = '2026-03-01'  -- UTC",
      r.refund && "+  AND status <> 'refunded'",
      r.test && "+  AND is_test = false",
    ],
  },
  {
    id: "02",
    title: "The join that made money",
    chapter: 3,
    unit: "money",
    metric: "sum",
    rowsLabel: "Rows after joining orders to items",
    rows: joined,
    question: "Marketing's dashboard says this week's revenue was {marketing}. Finance says {finance}. Who is right?",
    switches: [{ key: "dedupe", label: "Count each order once", short: "Repeated orders" }],
    start: { dedupe: false },
    teams: [
      { key: "marketing", label: "Marketing dashboard", recipe: { dedupe: false }, claim: 980 },
      { key: "finance", label: "Finance dashboard", recipe: { dedupe: true }, claim: 500 },
    ],
    target: ["finance"],
    options: ["Marketing", "Finance", "Both", "Neither"],
    answer: 1,
    explain: "This time one number is a mistake. Marketing joined orders to their items, so every order total appears once per item. Count each order once and see.",
    hint: "Count the rows for O-201. How many times does its $120 total appear?",
    verdict: ["REVIEW: FINANCE RIGHT", "Marketing counted each order once per item."],
    lesson: "This is called fan-out: a join turns one order into several rows, and a sum over those rows inflates the total. The level of the rows (one per order or one per item) has to match the level of the number you sum.",
    sql: (r) =>
      r.dedupe
        ? ["SELECT SUM(total) AS revenue", "+FROM orders            -- one row per order"]
        : ["SELECT SUM(o.total) AS revenue", "FROM orders o", "JOIN order_items i ON i.order_id = o.id  -- one row per item"],
  },
  {
    id: "03",
    title: "Active users, three ways",
    chapter: 1,
    unit: "count",
    metric: "sum",
    rowsLabel: "Everyone who has signed up",
    rows: users,
    question: "How many active users do we have? Marketing says {marketing}, Product says {product}, Finance says {finance}.",
    switches: [
      { key: "login", label: "Must have logged in this month", short: "No login" },
      { key: "action", label: "Must have made a report", short: "No report" },
      { key: "paid", label: "Must be paying", short: "Free plan" },
    ],
    start: { login: false, action: false, paid: false },
    teams: [
      { key: "marketing", label: "Marketing", recipe: { login: true, action: false, paid: false }, claim: 9 },
      { key: "product", label: "Product", recipe: { login: false, action: true, paid: false }, claim: 6 },
      { key: "finance", label: "Finance", recipe: { login: false, action: false, paid: true }, claim: 5 },
    ],
    target: ["marketing", "product", "finance"],
    options: ["Marketing", "Product", "Finance", "All three"],
    answer: 3,
    explain: "Each team answers a different question with the same word. Find each team's recipe: match all three numbers one at a time.",
    hint: "Marketing cares about visits, Product about people doing real work, Finance about money.",
    verdict: ["REVIEW: ALL THREE RIGHT", "Three definitions of \"active\"."],
    lesson: "\"Active user\" is a name, not a definition. Visitors, engaged users, and paying customers are all worth tracking; give each its own name so nobody has to guess which one a chart shows.",
    sql: (r) => [
      "SELECT COUNT(*) AS active_users",
      "FROM users",
      "WHERE signed_up_at < '2026-04-01'",
      r.login && "+  AND last_login_at >= '2026-03-01'",
      r.action && "+  AND reports_created_in_march > 0",
      r.paid && "+  AND plan <> 'free'",
    ],
  },
  {
    id: "04",
    title: "When does a week start?",
    chapter: 4,
    unit: "count",
    metric: "sum",
    rowsLabel: "Daily signups, 1 to 8 March 2026",
    rows: [
      { id: "Sun 1 Mar", value: 35, out: ["iso"], note: "Sunday" },
      { id: "Mon 2 Mar", value: 120 },
      { id: "Tue 3 Mar", value: 130 },
      { id: "Wed 4 Mar", value: 125 },
      { id: "Thu 5 Mar", value: 118 },
      { id: "Fri 6 Mar", value: 110 },
      { id: "Sat 7 Mar", value: 60 },
      { id: "Sun 8 Mar", value: 95, out: ["!iso"], note: "Sunday, promo email" },
    ],
    question: "\"Signups in the first week of March\": the New York office says {newyork}, the Berlin office says {berlin}. Who is right?",
    switches: [{ key: "iso", label: "Start weeks on Monday", short: "Week boundary" }],
    start: { iso: false },
    teams: [
      { key: "newyork", label: "New York office", recipe: { iso: false }, claim: 698 },
      { key: "berlin", label: "Berlin office", recipe: { iso: true }, claim: 758 },
    ],
    target: ["berlin"],
    options: ["New York", "Berlin", "Both", "Neither"],
    answer: 2,
    explain: "Both offices counted seven days. They just disagree on which seven. Switch the week start and watch which Sunday drops out.",
    hint: "Count the Sundays. Which one belongs to which week?",
    verdict: ["REVIEW: BOTH RIGHT", "Same days, different week boundaries."],
    lesson: "US calendars usually start the week on Sunday; ISO 8601, used across most of Europe, starts it on Monday. Every weekly number needs its week start written down.",
    sql: (r) => [
      "SELECT SUM(signups) AS weekly_signups",
      "FROM daily_signups",
      r.iso ? "+WHERE day BETWEEN '2026-03-02' AND '2026-03-08'  -- ISO week, Monday start" : "WHERE day BETWEEN '2026-03-01' AND '2026-03-07'  -- week starts Sunday",
    ],
  },
  {
    id: "05",
    title: "Churn: 20% or 5%?",
    chapter: 1,
    unit: "percent",
    rowUnit: "money",
    rowSuffix: "/mo",
    metric: "rate",
    rowsLabel: "Customers at the start of March, with monthly revenue",
    rows: [
      { id: "Atlas Co", value: 300 },
      { id: "Brightly", value: 250 },
      { id: "Cobalt", value: 150 },
      { id: "Dune Labs", value: 100 },
      { id: "Ember", value: 60 },
      { id: "Fjord", value: 40 },
      { id: "Gale", value: 30, hit: true, note: "Cancelled in March" },
      { id: "Harbor", value: 30 },
      { id: "Iris", value: 20, hit: true, note: "Cancelled in March" },
      { id: "Juniper", value: 20 },
      { id: "Kite", value: 0, out: ["trial"], hit: true, note: "Free trial, ended in March" },
      { id: "Lumen", value: 0, out: ["trial"], note: "Free trial" },
    ],
    hitLabel: "LEFT",
    question: "What was March churn? Customer Success says {success}. Finance says {finance}. Who is right?",
    switches: [
      { key: "trial", label: "Leave out free trials", short: "Free trials" },
      { key: "weight", label: "Weight by revenue", short: "Weighting", mode: true },
    ],
    start: { trial: false, weight: false },
    teams: [
      { key: "success", label: "Customer Success", recipe: { trial: true, weight: false }, claim: 20 },
      { key: "finance", label: "Finance", recipe: { trial: true, weight: true }, claim: 5 },
    ],
    target: ["success", "finance"],
    options: ["Customer Success", "Finance", "Both", "Neither"],
    answer: 2,
    explain: "One counts customers who left, the other counts revenue that left. Match both numbers, starting from the raw export.",
    hint: "The two customers who left were small. What share of customers is that, and what share of revenue?",
    verdict: ["REVIEW: BOTH RIGHT", "Customers churned vs revenue churned."],
    lesson: "Customer churn says how many accounts you lost; revenue churn says how much money walked away. Losing two small customers is 20% of accounts but only 5% of revenue. Name which one a chart shows.",
    sql: (r) => [
      r.weight ? "+SELECT SUM(CASE WHEN churned THEN mrr ELSE 0 END) * 100.0 / SUM(mrr)" : "SELECT SUM(CASE WHEN churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*)",
      "  AS churn_pct",
      "FROM customers_at_start_of_march",
      r.trial && "+WHERE plan <> 'trial'",
    ],
  },
  {
    id: "06",
    title: "The average of averages",
    chapter: 3,
    unit: "money",
    metric: "average",
    rowsLabel: "Last week's orders by region",
    rows: [
      { id: "N-1", value: 200, group: "North" },
      { id: "N-2", value: 190, group: "North" },
      ...[20, 25, 30, 20, 25, 30, 20, 30].map((value, i) => ({ id: `S-${i + 1}`, value, group: "South" })),
    ],
    question: "What is our average order value? The regional report says {regional}. Finance says {finance}. Who is right?",
    switches: [{ key: "pooled", label: "Average every order, not every region", short: "Averaging", mode: true }],
    start: { pooled: false },
    teams: [
      { key: "regional", label: "Regional report", recipe: { pooled: false }, claim: 110 },
      { key: "finance", label: "Finance", recipe: { pooled: true }, claim: 59 },
    ],
    target: ["finance"],
    options: ["Regional report", "Finance", "Both", "Neither"],
    answer: 1,
    explain: "The regional report averaged the two region averages, so North's 2 orders weigh as much as South's 8. Average every order instead.",
    hint: "North has 2 orders and South has 8. Does the regional report give them the same say?",
    verdict: ["REVIEW: FINANCE RIGHT", "An average of averages ignores how many orders each region has."],
    lesson: "Averages don't add up like totals. To combine groups, go back to the totals: all revenue divided by all orders. Averaging the group averages gives a small group the same weight as a big one.",
    sql: (r) =>
      r.pooled
        ? ["+SELECT AVG(amount) AS avg_order_value", "FROM orders"]
        : ["SELECT AVG(region_avg) AS avg_order_value", "FROM (", "  SELECT region, AVG(amount) AS region_avg", "  FROM orders GROUP BY region", ") per_region"],
  },
  {
    id: "07",
    title: "Yesterday's number changed",
    chapter: 4,
    unit: "money",
    metric: "sum",
    rowsLabel: "Orders placed on Tuesday 3 March",
    rows: [
      { id: "ORD-301", value: 120 },
      { id: "ORD-302", value: 90 },
      { id: "ORD-303", value: 60 },
      { id: "ORD-304", value: 70, out: ["!late"], note: "Store 12, arrived 11:15 AM Wed" },
      { id: "ORD-305", value: 150 },
      { id: "ORD-306", value: 40, out: ["!late"], note: "Store 12, arrived 11:15 AM Wed" },
      { id: "ORD-307", value: 80 },
      { id: "ORD-308", value: 100 },
      { id: "ORD-309", value: 90, out: ["!late"], note: "Store 12, arrived 11:15 AM Wed" },
    ],
    question: "Tuesday's revenue: the 8 AM report on Wednesday said {morning}. The dashboard at 3 PM says {afternoon}. Who is right?",
    switches: [{ key: "late", label: "Include orders that arrived after 8 AM", short: "Late arrivals" }],
    start: { late: false },
    teams: [
      { key: "morning", label: "8 AM report", recipe: { late: false }, claim: 600 },
      { key: "afternoon", label: "3 PM dashboard", recipe: { late: true }, claim: 800 },
    ],
    target: ["afternoon"],
    options: ["The 8 AM report", "The 3 PM dashboard", "Both, at the time they ran", "Neither"],
    answer: 2,
    explain: "Store 12 uploads its orders late. The morning report was right about what had arrived by 8 AM. Let the late orders in.",
    hint: "Read the notes on the orders. When did they reach the warehouse?",
    verdict: ["REVIEW: BOTH RIGHT", "Same day, different moments."],
    lesson: "Data often arrives late, so a day's number can grow after it was first reported. Show the time a number was calculated, and mark a day as final only once all its sources have arrived.",
    sql: (r) => [
      "SELECT SUM(amount) AS revenue",
      "FROM orders",
      "WHERE order_date = '2026-03-03'",
      r.late ? "+  -- every order loaded so far" : "  AND loaded_at < '2026-03-04 08:00'  -- when the report ran",
    ],
  },
  {
    id: "08",
    title: "Ask the AI",
    chapter: 5,
    unit: "money",
    metric: "sum",
    rowsLabel: "March orders",
    rows: marchOrders("metric"),
    chat: true,
    question: "The AI assistant says March revenue was {ai}. Finance says {finance}. Who do you trust?",
    switches: [{ key: "metric", label: "Give the AI the agreed revenue metric", short: "Agreed metric" }],
    start: { metric: false },
    teams: [
      { key: "ai", label: "AI assistant", recipe: { metric: false }, claim: 4200 },
      { key: "finance", label: "Finance dashboard", recipe: { metric: true }, claim: 3800 },
    ],
    target: ["finance"],
    options: ["The AI", "Finance", "Both", "Neither"],
    answer: 1,
    explain: "The AI wrote its own SQL and guessed a recipe. It never knew about refunds, test orders, or the company timezone. Give it the agreed metric.",
    hint: "Open the SQL the AI wrote. Which rules from Case 01 are missing?",
    verdict: ["REVIEW: FINANCE RIGHT", "The AI guessed a recipe; the semantic layer gave it the real one."],
    lesson: "An AI assistant that writes SQL from table names has to guess every business rule. When it queries metrics from a semantic layer, it gets the same answer as the Finance dashboard, because both read one definition.",
    sql: (r) =>
      r.metric
        ? ["+-- dbt Semantic Layer query: the rules live in the metric", "+SELECT * FROM {{ semantic_layer.query(", "+  metrics=['revenue'],", "+  group_by=[Dimension('metric_time').grain('month')]", "+) }}"]
        : ["-- written by the AI from the table names", "SELECT SUM(amount) AS revenue", "FROM orders", "WHERE created_at >= '2026-03-01'", "  AND created_at < '2026-04-01'"],
  },
];

// Build a metric: ten orders with everything that can go wrong at once.
// items: rows this order becomes when joined to order_items.
export const build = {
  orders: [
    { id: "ORD-401", amount: 480, items: 2 },
    { id: "ORD-402", amount: 360, items: 1 },
    { id: "ORD-403", amount: 250, items: 3, refunded: true, note: "Refunded" },
    { id: "ORD-404", amount: 520, items: 1 },
    { id: "ORD-405", amount: 50, items: 1, test: true, note: "Test order" },
    { id: "ORD-406", amount: 440, items: 2 },
    { id: "ORD-407", amount: 120, items: 1, staff: true, note: "Staff purchase" },
    { id: "ORD-408", amount: 100, items: 1, lateTz: true, note: "11:40 PM UTC on 31 Mar" },
    { id: "ORD-409", amount: 610, items: 2 },
    { id: "ORD-410", amount: 290, items: 1 },
  ],
  questions: [
    { key: "net", q: "What do we count?", options: ["Every order's amount", "Amount after refunds"] },
    { key: "leaveOut", q: "What's left out?", checks: [["test", "Test orders"], ["staff", "Staff purchases"]] },
    { key: "grain", q: "Counted at what level?", options: ["One row per order (orders)", "One row per item (orders joined to items)"] },
    { key: "localTz", q: "Over what period?", options: ["March in UTC", "March in company time (Singapore)"] },
  ],
  start: { net: 0, test: false, staff: false, grain: 0, localTz: 0 },
  dashboards: [
    { key: "sales", label: "Sales", recipe: { net: 0, test: false, staff: false, grain: 0, localTz: 0 } },
    { key: "marketing", label: "Marketing", recipe: { net: 0, test: true, staff: false, grain: 1, localTz: 0 } },
    { key: "finance", label: "Finance", recipe: { net: 1, test: true, staff: true, grain: 0, localTz: 1 } },
  ],
};

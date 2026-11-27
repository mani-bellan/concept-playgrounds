// Course chapters. Each has a lesson, an everyday and a data example, the cases
// that practise it, a 2-question check, and sources.

export const chapters = [
  {
    title: "What do we count?",
    minutes: 4,
    lesson: "Before any maths, a metric has to say what one unit is. \"Active user\", \"customer\", and \"churn\" sound precise, but each team quietly fills in its own meaning. The number only makes sense once the unit is written down.",
    everyday: "\"How many people came?\" Sam counted RSVPs, the caterer counted plates. Both counted something real, just not the same thing.",
    data: "Product counts users who made a report this month; Marketing counts anyone who logged in. Both call it \"active users\".",
    takeaway: "Give every metric a definition, not just a name. If two teams need different units, give them two names.",
    cases: ["03", "05"],
    quiz: [
      { q: "Marketing says 9 active users and Product says 6, from the same users. What is the most likely reason?", options: ["One team made a calculation error", "They define \"active\" differently", "The data is stale"], answer: 1 },
      { q: "Two of ten customers cancel, but they were small accounts. Which statement is true?", options: ["Customer churn and revenue churn will be the same", "Customer churn can be high while revenue churn is low", "Revenue churn is always higher"], answer: 1 },
    ],
    sources: [["Churn rate (Wikipedia)", "https://en.wikipedia.org/wiki/Churn_rate"]],
  },
  {
    title: "What's left out?",
    minutes: 3,
    lesson: "Most disagreements come from rows one team removes and the other keeps: refunds, test orders, staff purchases, free trials. Neither choice is wrong. The problem is not saying which rows are in.",
    everyday: "Sam's guest list left out the two walk-ins who never replied, so the headcount missed two people who were really there.",
    data: "Sales counts every order placed; Finance removes refunds and test orders. The same twelve orders give $4,200 and $3,800.",
    takeaway: "Write the exclusions into the definition, and show them next to the number on the dashboard.",
    cases: ["01"],
    quiz: [
      { q: "Finance's revenue is lower than Sales' revenue for the same month. What should you check first?", options: ["Which rows each one excludes", "Whose dashboard tool is newer", "Which team has more analysts"], answer: 0 },
      { q: "A test order is left in Sales' revenue. Is Sales wrong?", options: ["Yes, always", "Not necessarily: it is a different recipe, but it should be stated", "No, test orders are real revenue"], answer: 1 },
    ],
    sources: [],
  },
  {
    title: "Counted at what level?",
    minutes: 5,
    lesson: "Every table has a grain: what one row means. One row per order, per item, per day, per region. Summing or averaging at the wrong grain is how numbers silently double or skew.",
    everyday: "The caterer counted plates, so anyone who went back for seconds counted twice. Plates are a finer grain than people.",
    data: "Join orders to their items and each order's total repeats once per item. Sum it and revenue doubles. Average the regional averages and a region with 2 orders weighs as much as one with 8.",
    takeaway: "Before you sum or average, ask what one row is. Sum totals at their own grain, and build averages from totals: total value divided by total count.",
    cases: ["02", "06"],
    quiz: [
      { q: "After joining orders to order items, SUM(order_total) is about twice the real revenue. Why?", options: ["The join drops some orders", "Each order total now appears once per item", "Items have their own prices"], answer: 1 },
      { q: "North averages $195 over 2 orders, South $25 over 8. What is the true average order value?", options: ["$110", "$59", "$25"], answer: 1 },
    ],
    sources: [["Simpson's paradox (Wikipedia)", "https://en.wikipedia.org/wiki/Simpson%27s_paradox"]],
  },
  {
    title: "Over what period?",
    minutes: 4,
    lesson: "\"March\", \"last week\", and \"yesterday\" all need a clock and a calendar. Timezones move orders across midnight, offices start their week on different days, and late data changes a day after it was first reported.",
    everyday: "The photographer counted who was in the 9 PM photo. Guests who left at 8 were real, but outside the window.",
    data: "An order at 11:40 PM UTC on 31 March is already 1 April in Singapore. A Sunday-start week and a Monday-start (ISO 8601) week swap one Sunday.",
    takeaway: "Every time-based metric needs its timezone, week start, and cut-off written down, and a report should show when it was calculated.",
    cases: ["04", "07"],
    quiz: [
      { q: "New York and Berlin both report \"first week of March\" signups and differ. Most likely cause?", options: ["Different week start days", "Berlin has more users", "Daylight saving time"], answer: 0 },
      { q: "Yesterday's revenue went up between 8 AM and 3 PM. What happened?", options: ["Someone edited the dashboard", "Some of yesterday's orders arrived late", "Revenue is calculated randomly"], answer: 1 },
    ],
    sources: [["ISO week date (Wikipedia)", "https://en.wikipedia.org/wiki/ISO_week_date"]],
  },
  {
    title: "Agree once: the semantic layer",
    minutes: 5,
    lesson: "A semantic layer is one shared place where each metric's recipe is written down: what to count, what to leave out, the grain, and the time rules. Dashboards, spreadsheets, and AI assistants ask the layer for \"revenue\" instead of writing their own SQL, so they all get the same number.",
    everyday: "Sam's family agrees once: \"guests means people who came, counted once\". From then on every count of the party matches.",
    data: "Tools such as the dbt Semantic Layer (MetricFlow), Snowflake semantic views, Looker's LookML, and Cube store metric definitions centrally. An AI assistant that queries them stops guessing business rules.",
    takeaway: "Define each metric once, in one place, and make every tool read from it. Disagreements then become conversations about the definition, not about whose number is right.",
    cases: ["08"],
    build: true,
    quiz: [
      { q: "What does a semantic layer store?", options: ["Copies of every dashboard", "Shared metric definitions that tools query", "Raw event logs"], answer: 1 },
      { q: "Why does an AI assistant give a better revenue number when it uses the semantic layer?", options: ["It runs on a bigger model", "It no longer has to guess the business rules", "It skips the database"], answer: 1 },
    ],
    sources: [
      ["dbt Semantic Layer", "https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl"],
      ["dbt MetricFlow", "https://docs.getdbt.com/docs/build/about-metricflow"],
      ["Snowflake semantic views", "https://docs.snowflake.com/en/user-guide/views-semantic/overview"],
      ["Looker LookML", "https://cloud.google.com/looker/docs/what-is-lookml"],
      ["Cube", "https://cube.dev/docs"],
    ],
  },
];

export const QUIZ_COUNT = chapters.reduce((n, c) => n + c.quiz.length, 0);

// Example worlds for the sandbox and the Detective levels.
// Positions are in the graph's 800 x 500 coordinate space.

export const presets = {
  pets: {
    name: "Pets",
    world: {
      classes: ["Animal", "Mammal", "Dog", "Cat", "Person"],
      individuals: ["Rex", "Alice", "Tom"],
      properties: [{ id: "owns", domain: "Person", range: "Animal" }],
      facts: [
        { s: "Mammal", p: "subClassOf", o: "Animal" },
        { s: "Dog", p: "subClassOf", o: "Mammal" },
        { s: "Cat", p: "subClassOf", o: "Mammal" },
        { s: "Rex", p: "type", o: "Dog" },
        { s: "Alice", p: "owns", o: "Rex" },
        { s: "Alice", p: "owns", o: "Tom" },
      ],
    },
    positions: {
      Animal: [400, 50], Mammal: [400, 160], Dog: [230, 270], Cat: [570, 270], Person: [400, 300],
      Rex: [150, 420], Tom: [650, 420], Alice: [400, 440],
    },
  },
  services: {
    name: "Microservices",
    world: {
      classes: ["Service", "Datastore"],
      individuals: ["Checkout", "Payments", "Auth", "UsersDB"],
      properties: [{ id: "dependsOn", domain: "Service", transitive: true }],
      facts: [
        { s: "UsersDB", p: "type", o: "Datastore" },
        { s: "Checkout", p: "dependsOn", o: "Payments" },
        { s: "Payments", p: "dependsOn", o: "Auth" },
        { s: "Auth", p: "dependsOn", o: "UsersDB" },
      ],
    },
    positions: {
      Service: [160, 70], Datastore: [640, 70],
      Checkout: [130, 300], Payments: [310, 380], Auth: [490, 300], UsersDB: [660, 380],
    },
  },
  data: {
    name: "Data pipeline",
    world: {
      classes: ["Asset", "Table", "Dashboard"],
      individuals: ["raw_orders", "stg_orders", "fct_revenue", "exec_dashboard"],
      properties: [{ id: "dependsOn", transitive: true }],
      facts: [
        { s: "Table", p: "subClassOf", o: "Asset" },
        { s: "Dashboard", p: "subClassOf", o: "Asset" },
        { s: "Table", p: "disjointWith", o: "Dashboard" },
        { s: "raw_orders", p: "type", o: "Table" },
        { s: "exec_dashboard", p: "type", o: "Dashboard" },
        { s: "stg_orders", p: "dependsOn", o: "raw_orders" },
        { s: "fct_revenue", p: "dependsOn", o: "stg_orders" },
        { s: "exec_dashboard", p: "dependsOn", o: "fct_revenue" },
      ],
    },
    positions: {
      Asset: [400, 50], Table: [230, 160], Dashboard: [570, 160],
      raw_orders: [110, 400], stg_orders: [300, 320], fct_revenue: [500, 400], exec_dashboard: [690, 320],
    },
  },
  empty: {
    name: "Empty",
    world: { classes: [], individuals: [], properties: [], facts: [] },
    positions: {},
  },
};

export const levels = [
  {
    title: "The Family Tree of Types",
    concept: "Classes & inheritance",
    primer: `A class is a category, like Dog. "Subclass of" means every member of one class is also a member of another: every Dog is a Mammal.`,
    hint: `Follow the arrows upward from Rex. Each "subclass of" arrow carries Rex along with it.`,
    story:
      "A shelter database says Rex is a Dog. The adoption app only lists Animals. Will Rex show up?",
    world: {
      classes: ["Animal", "Mammal", "Dog"],
      individuals: ["Rex"],
      properties: [],
      facts: [
        { s: "Dog", p: "subClassOf", o: "Mammal" },
        { s: "Mammal", p: "subClassOf", o: "Animal" },
        { s: "Rex", p: "type", o: "Dog" },
      ],
    },
    positions: { Animal: [560, 80], Mammal: [560, 240], Dog: [560, 400], Rex: [220, 400] },
    question: "Is Rex an Animal?",
    options: ["Yes", "No", "Can't tell, nobody said so"],
    answer: 0,
    targets: ["Rex|type|Animal"],
    takeaway:
      "Subclasses pass their meaning upward. You only state \"Rex is a Dog\"; the reasoner works out the rest. A plain database would need that fact stored or computed by a query.",
  },
  {
    title: "Who's Who in the Classroom",
    concept: "Domain & range",
    primer: `A property is a named relationship, like "teaches". Its domain says what kind of thing sits at the start of the arrow; its range says what kind sits at the end.`,
    hint: `The range of "teaches" is Student. Sam is at the end of a "teaches" arrow.`,
    story:
      "The property \"teaches\" is defined as going from a Teacher to a Student. A new record arrives: Priya teaches Sam. Nobody filled in Sam's role.",
    world: {
      classes: ["Teacher", "Student"],
      individuals: ["Priya", "Sam"],
      properties: [{ id: "teaches", domain: "Teacher", range: "Student" }],
      facts: [{ s: "Priya", p: "teaches", o: "Sam" }],
    },
    positions: { Teacher: [220, 90], Student: [580, 90], Priya: [220, 360], Sam: [580, 360] },
    question: "What can the reasoner conclude about Sam?",
    options: ["Sam is a Teacher", "Sam is a Student", "Nothing, Sam has no type"],
    answer: 1,
    targets: ["Sam|type|Student", "Priya|type|Teacher"],
    takeaway:
      "A property's domain and range classify whatever it connects. Using a relationship is itself information.",
  },
  {
    title: "The 3 AM Outage",
    concept: "Transitive properties",
    primer: `A transitive property chains: if A relates to B and B relates to C, then A relates to C. Think "is inside" or "depends on".`,
    hint: `Checkout needs Payments, Payments needs Auth, Auth needs UsersDB. Who is ultimately stuck?`,
    story:
      "UsersDB just went down. \"dependsOn\" is marked transitive: if A depends on B and B depends on C, A depends on C. Which services should be paged?",
    world: {
      classes: [],
      individuals: ["Checkout", "Payments", "Auth", "UsersDB"],
      properties: [{ id: "dependsOn", transitive: true }],
      facts: [
        { s: "Checkout", p: "dependsOn", o: "Payments" },
        { s: "Payments", p: "dependsOn", o: "Auth" },
        { s: "Auth", p: "dependsOn", o: "UsersDB" },
      ],
    },
    positions: { Checkout: [110, 130], Payments: [320, 370], Auth: [500, 130], UsersDB: [700, 370] },
    question: "Which services depend on UsersDB?",
    options: ["Only Auth", "Auth and Payments", "Auth, Payments and Checkout", "None of them"],
    answer: 2,
    targets: ["Checkout|dependsOn|UsersDB", "Payments|dependsOn|UsersDB"],
    takeaway:
      "Transitivity lets you query whole chains (part-of, depends-on, located-in) without writing every hop yourself.",
  },
  {
    title: "Two Sides of the Org Chart",
    concept: "Inverse properties",
    primer: `Two properties are inverses when they describe the same link from opposite ends, like "parent of" and "child of".`,
    hint: `If Maya manages Leo, read the same arrow backwards.`,
    story:
      "HR records who manages whom. The access system only looks at \"reportsTo\". The ontology says the two are inverses.",
    world: {
      classes: [],
      individuals: ["Maya", "Leo"],
      properties: [
        { id: "manages", inverseOf: "reportsTo" },
        { id: "reportsTo", inverseOf: "manages" },
      ],
      facts: [{ s: "Maya", p: "manages", o: "Leo" }],
    },
    positions: { Maya: [220, 250], Leo: [580, 250] },
    question: "Who does Leo report to?",
    options: ["Maya", "Nobody, it was never recorded", "Leo reports to himself"],
    answer: 0,
    targets: ["Leo|reportsTo|Maya"],
    takeaway:
      "Inverses let two systems talk about the same link from either end without storing it twice.",
  },
  {
    title: "The Impossible Android",
    concept: "Disjointness & contradictions",
    primer: "Disjoint classes share no members: nothing can be both. If the facts force something into both, the reasoner reports a contradiction, which usually means bad data.",
    hint: "The passport rule makes Ava a Human. Her type makes her a Robot. Can she be both?",
    story:
      "Ava is an Android. Androids are Robots. Only a Human can \"holdsPassport\", and the ontology says no one is both a Human and a Robot. Then this arrives: Ava holdsPassport P-42.",
    world: {
      classes: ["Human", "Robot", "Android"],
      individuals: ["Ava", "P-42"],
      properties: [{ id: "holdsPassport", domain: "Human" }],
      facts: [
        { s: "Android", p: "subClassOf", o: "Robot" },
        { s: "Human", p: "disjointWith", o: "Robot" },
        { s: "Ava", p: "type", o: "Android" },
        { s: "Ava", p: "holdsPassport", o: "P-42" },
      ],
    },
    positions: { Human: [180, 90], Robot: [520, 90], Android: [650, 250], Ava: [350, 410], "P-42": [110, 410] },
    question: "What does the reasoner report?",
    options: [
      "Everything is consistent",
      "Contradiction: Ava would have to be both Human and Robot",
      "P-42 must be a Robot",
    ],
    answer: 1,
    contradiction: true,
    takeaway:
      "Ontologies don't just add facts, they catch bad data. Disjointness turns a silent data bug into a reported contradiction.",
  },
  {
    title: "The Lab Door",
    concept: "Putting it together",
    primer: "Real decisions often chain several small rules. Here a domain rule and a subclass rule combine.",
    hint: "What must Alice be, if she worksOn an experiment? And what is every one of those?",
    story:
      "The lab door opens for anyone who is LabAuthorized. Researchers are LabAuthorized. Only a Researcher can \"worksOn\" an Experiment. Alice's badge record just says: Alice worksOn Exp-7.",
    world: {
      classes: ["LabAuthorized", "Researcher", "Experiment"],
      individuals: ["Alice", "Exp-7"],
      properties: [{ id: "worksOn", domain: "Researcher", range: "Experiment" }],
      facts: [
        { s: "Researcher", p: "subClassOf", o: "LabAuthorized" },
        { s: "Alice", p: "worksOn", o: "Exp-7" },
      ],
    },
    positions: { LabAuthorized: [200, 80], Researcher: [200, 260], Experiment: [600, 260], Alice: [200, 420], "Exp-7": [600, 420] },
    question: "Does the door open for Alice?",
    options: ["Yes", "No, she isn't listed as a Researcher", "Only with a manager's approval"],
    answer: 0,
    targets: ["Alice|type|LabAuthorized"],
    takeaway:
      "Two small rules (a domain, then a subclass) combine into a real decision. This is how ontologies power access control, search, and knowledge graphs.",
  },

  // Data pack: the same ideas, in the language of data engineering and analytics.
  {
    pack: "data",
    title: "The Blast Radius",
    concept: "Lineage & transitivity",
    primer: `Lineage says which assets are built from which. "dependsOn" is transitive: if a dashboard depends on a model and the model depends on a table, the dashboard depends on the table.`,
    hint: "Start at raw_orders and follow every path downstream. dim_customers never reads from it.",
    story:
      "raw_orders failed to load at 2 AM. Each model dependsOn the assets it reads from, and dependsOn is transitive. Before standup, you need the list of everything showing stale numbers.",
    world: {
      classes: [],
      individuals: ["raw_orders", "stg_orders", "raw_customers", "dim_customers", "fct_revenue", "exec_dashboard"],
      properties: [{ id: "dependsOn", transitive: true }],
      facts: [
        { s: "stg_orders", p: "dependsOn", o: "raw_orders" },
        { s: "dim_customers", p: "dependsOn", o: "raw_customers" },
        { s: "fct_revenue", p: "dependsOn", o: "stg_orders" },
        { s: "fct_revenue", p: "dependsOn", o: "dim_customers" },
        { s: "exec_dashboard", p: "dependsOn", o: "fct_revenue" },
      ],
    },
    positions: {
      raw_orders: [100, 100], stg_orders: [360, 100], raw_customers: [100, 400], dim_customers: [360, 400],
      fct_revenue: [560, 250], exec_dashboard: [670, 420],
    },
    question: "Which assets depend on raw_orders?",
    options: ["Only stg_orders", "stg_orders and fct_revenue", "stg_orders, fct_revenue and exec_dashboard", "All of them, dim_customers too"],
    answer: 2,
    targets: ["fct_revenue|dependsOn|raw_orders", "exec_dashboard|dependsOn|raw_orders"],
    takeaway:
      "One rule (dependsOn is transitive) gives you impact analysis for any asset. In SQL, that's a recursive query you write for each lineage question.",
  },
  {
    pack: "data",
    title: "Where Did the PII Go?",
    concept: "Glossary hierarchies",
    primer: "Business glossaries often nest terms: an EmailAddress is a kind of ContactInfo, which is a kind of PII. Tag a column with the narrowest term and it belongs to every broader term above it.",
    hint: "Walk up from EmailAddress: first ContactInfo, then PII.",
    story:
      "Analysts tag each column with its most specific term. The glossary says every EmailAddress is ContactInfo, and all ContactInfo is PII. The masking policy only mentions PII.",
    world: {
      classes: ["PII", "ContactInfo", "EmailAddress", "Measure"],
      individuals: ["users.email", "orders.email", "orders.amount"],
      properties: [],
      facts: [
        { s: "ContactInfo", p: "subClassOf", o: "PII" },
        { s: "EmailAddress", p: "subClassOf", o: "ContactInfo" },
        { s: "users.email", p: "type", o: "EmailAddress" },
        { s: "orders.email", p: "type", o: "EmailAddress" },
        { s: "orders.amount", p: "type", o: "Measure" },
      ],
    },
    positions: {
      PII: [400, 60], ContactInfo: [400, 180], EmailAddress: [400, 300], Measure: [680, 300],
      "users.email": [170, 420], "orders.email": [420, 430], "orders.amount": [680, 430],
    },
    question: "Which columns does the PII masking policy cover?",
    options: ["None, no column is tagged PII", "users.email and orders.email", "All three columns"],
    answer: 1,
    targets: ["users.email|type|PII", "orders.email|type|PII"],
    takeaway:
      "A policy written against a broad term covers every column tagged with a narrower one. Nobody has to remember to tag each level.",
  },
  {
    pack: "data",
    title: "Who Gets Paged?",
    concept: "Ownership & inverses",
    primer: `An inverse property is the same link read from the other end. "growth_team owns fct_signups" and "fct_signups ownedBy growth_team" are one fact.`,
    hint: "Read the owns arrow backwards.",
    story:
      "The team directory records which tables each team owns. The alerting bot works from the table's side: it looks up who fct_signups is ownedBy. The ontology says ownedBy is the inverse of owns.",
    world: {
      classes: [],
      individuals: ["growth_team", "fct_signups"],
      properties: [
        { id: "owns", inverseOf: "ownedBy" },
        { id: "ownedBy", inverseOf: "owns" },
      ],
      facts: [{ s: "growth_team", p: "owns", o: "fct_signups" }],
    },
    positions: { growth_team: [220, 250], fct_signups: [580, 250] },
    question: "fct_signups just failed a freshness check. Who gets paged?",
    options: ["growth_team", "Nobody, ownedBy was never filled in", "Everyone in the data channel"],
    answer: 0,
    targets: ["fct_signups|ownedBy|growth_team"],
    takeaway:
      "Record ownership once and query it from either side. There's no second mapping table to drift out of sync.",
  },
  {
    pack: "data",
    title: "The Untyped Feed",
    concept: "Types from relationships",
    primer: `A property's domain and range say what kind of thing sits at each end. "placedBy" goes from an Order to a Customer, so any row using it says something about types.`,
    hint: "ord_981 is at the start of a placedBy arrow; acct_7 is at the end.",
    story:
      "A new events feed lands with no type column, just rows like: ord_981 placedBy acct_7. Your ontology says placedBy always goes from an Order to a Customer.",
    world: {
      classes: ["Order", "Customer"],
      individuals: ["ord_981", "acct_7"],
      properties: [{ id: "placedBy", domain: "Order", range: "Customer" }],
      facts: [{ s: "ord_981", p: "placedBy", o: "acct_7" }],
    },
    positions: { Order: [220, 90], Customer: [580, 90], ord_981: [220, 380], acct_7: [580, 380] },
    question: "What can the reasoner conclude?",
    options: ["ord_981 is an Order and acct_7 is a Customer", "Both are Orders", "Nothing, the feed has no types"],
    answer: 0,
    targets: ["ord_981|type|Order", "acct_7|type|Customer"],
    takeaway:
      "Relationships carry type information even when a source sends none. That helps when you stitch together feeds from systems that model things differently.",
  },
  {
    pack: "data",
    title: "Two Revenues",
    concept: "Conflicting metric definitions",
    primer: "Disjoint classes share no members. If one metric is defined two incompatible ways, the reasoner reports a contradiction instead of letting both dashboards quietly disagree.",
    hint: "Sales and Finance each classified revenue_q3. Can one metric be both gross and net?",
    story:
      "Sales defines revenue_q3 as GrossRevenue (before refunds). Finance's semantic layer defines the same metric as NetRevenue (after refunds). The ontology says no metric is both.",
    world: {
      classes: ["Revenue", "GrossRevenue", "NetRevenue"],
      individuals: ["revenue_q3"],
      properties: [],
      facts: [
        { s: "GrossRevenue", p: "subClassOf", o: "Revenue" },
        { s: "NetRevenue", p: "subClassOf", o: "Revenue" },
        { s: "GrossRevenue", p: "disjointWith", o: "NetRevenue" },
        { s: "revenue_q3", p: "type", o: "GrossRevenue" },
        { s: "revenue_q3", p: "type", o: "NetRevenue" },
      ],
    },
    positions: { Revenue: [400, 80], GrossRevenue: [210, 240], NetRevenue: [590, 240], revenue_q3: [400, 420] },
    question: "What does the reasoner report?",
    options: ["Consistent: revenue is revenue", "Contradiction: revenue_q3 can't be both gross and net", "revenue_q3 is just plain Revenue"],
    answer: 1,
    contradiction: true,
    takeaway:
      "One name with two meanings is a classic reason dashboards don't match. Disjointness turns that into a reported error; the fix is two clearly named metrics.",
  },
];

export const corePack = levels.map((l, i) => i).filter((i) => !levels[i].pack);
export const dataPack = levels.map((l, i) => i).filter((i) => levels[i].pack === "data");

// Guided missions for Build a World. They use names that no template uses,
// so a mission only completes when the player builds it. Names match
// case-insensitively.
const lc = (s) => s.toLowerCase();
const hasNode = (list, name) => list.some((x) => lc(x) === lc(name));
const hasStated = (w, s, p, o) => w.facts.some((f) => lc(f.s) === lc(s) && f.p === p && lc(f.o) === lc(o));
const hasFact = (r, s, p, o) => [...r.facts.values()].some((f) => lc(f.s) === lc(s) && f.p === p && lc(f.o) === lc(o));

export const missions = [
  {
    id: "class",
    title: "Name a kind of thing",
    task: "In step 1, type Food and press Class.",
    why: "A class is a category. Food is now a kind of thing your ontology knows about.",
    done: (w) => hasNode(w.classes, "Food"),
  },
  {
    id: "subclass",
    title: "Build a hierarchy",
    task: "Add a class Fruit. Then in step 3, assert: Fruit · subclass of · Food.",
    why: "You just said every Fruit is a Food. That's a hierarchy, like folders inside folders.",
    done: (w) => hasStated(w, "Fruit", "subClassOf", "Food"),
  },
  {
    id: "individual",
    title: "Add a real thing",
    task: "Type Mango and press Individual. Then assert: Mango · is a · Fruit.",
    why: "Mango is an individual: an actual thing, not a category.",
    done: (w) => hasStated(w, "Mango", "type", "Fruit"),
  },
  {
    id: "reason",
    title: "Let the computer think",
    task: "Press Run reasoner above the canvas. Watch for a new dashed arrow.",
    why: "You never said Mango is a Food. The reasoner worked it out from your rules. That's inference.",
    done: (w, r, reasoned) => reasoned && hasFact(r, "Mango", "type", "Food"),
  },
  {
    id: "domain",
    title: "Give a relationship meaning",
    task: "Add a class Chef. In step 2, create a property cooks with domain Chef. Add an individual Priya, then assert: Priya · cooks · Mango.",
    why: "Only a Chef can cook, so the reasoner concludes Priya is a Chef, even though you never said so.",
    done: (w, r, reasoned) => reasoned && hasFact(r, "Priya", "type", "Chef"),
  },
  {
    id: "contradiction",
    title: "Break it on purpose",
    task: "Add a class Vegetable. Assert Fruit · disjoint with · Vegetable, then Mango · is a · Vegetable. Run the reasoner.",
    why: "Mango can't be both. Catching impossible data like this is one of the most useful things an ontology does.",
    done: (w, r, reasoned) => reasoned && r.contradictions.length > 0,
  },
];

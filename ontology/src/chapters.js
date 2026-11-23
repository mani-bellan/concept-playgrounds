// The course: six short chapters. Each lesson and example comes in two voices,
// "everyday" for newcomers and "tech" for people who work with data or code.
// Missions and cases refer to ids in data.js; quiz answers index the options
// as written here (the view shuffles their display order).

export const PATHS = {
  everyday: { name: "Everyday examples", blurb: "New to this. Explain it with libraries, families, and things I know." },
  tech: { name: "Tech examples", blurb: "I work with data or code. Use databases, APIs, and services." },
};

export const chapters = [
  {
    title: "Things and categories",
    minutes: 5,
    summary: "Classes, individuals, and your first inference.",
    lesson: {
      everyday: [
        "Every topic is made of kinds of things and the actual things themselves. In a library, Book and Novel are kinds of things; Pride and Prejudice is an actual book.",
        "An ontology calls kinds of things classes and actual things individuals. Classes form a family tree: every Novel is a Book. Once that's written down, a computer can work out facts nobody typed. If Pride and Prejudice is a Novel, it must be a Book.",
      ],
      tech: [
        "Classes are like types or tables; individuals are like instances or rows. The difference from a schema is that subclass links carry meaning a reasoner can use.",
        "Declare Novel ⊑ Book and every Novel instance is automatically a Book: no extra rows, no joins, and a query for Books returns Novels too.",
      ],
    },
    example: {
      everyday: { facts: ["Every Novel is a Book", "Every Book is a Library item", "Pride and Prejudice is a Novel"], conclusion: "So the computer knows Pride and Prejudice is a Library item." },
      tech: { facts: ["Novel subClassOf Book", "Book subClassOf CatalogItem", "item_4821 type Novel"], conclusion: "Query “all CatalogItems” and item_4821 is included, with no extra row." },
    },
    missions: ["class", "subclass", "individual", "reason"],
    cases: [0],
    quiz: [
      { q: "Which of these is an individual, not a class?", options: ["Rex", "Dog", "Animal"], answer: 0, why: "Rex is one specific dog. Dog and Animal are categories." },
      { q: "Every Cat is an Animal. Tom is a Cat. What can a reasoner conclude?", options: ["Tom is an Animal", "Every Animal is a Cat", "Nothing new"], answer: 0, why: "Subclass links carry members upward, so Tom is also an Animal." },
      { q: "What does a reasoner add that a plain list of facts doesn't?", options: ["It works out new facts from rules", "It stores data faster", "It draws diagrams"], answer: 0, why: "A reasoner reads your rules and works out what else must be true." },
    ],
  },
  {
    title: "Relationships",
    minutes: 4,
    summary: "Properties, and how they classify the things they connect.",
    lesson: {
      everyday: [
        "Relationships link things: Priya teaches Sam; Asha owns a scooter. In an ontology a relationship is called a property, and it can come with rules about what it connects.",
        "Say only a Teacher can teach and only a Student can be taught. Now simply recording “Priya teaches Sam” tells the computer who is the teacher and who is the student.",
      ],
      tech: [
        "Properties are typed edges. Domain and range describe each end, like a foreign key that also carries meaning.",
        "Unlike a database constraint, a reasoner doesn't reject data that lacks a type; it infers the type. Assert placedBy(order_17, u_42) with range Customer and u_42 is classified as a Customer.",
      ],
    },
    example: {
      everyday: { facts: ["Only a Teacher can teach", "Only a Student can be taught", "Priya teaches Sam"], conclusion: "So Priya is a Teacher and Sam is a Student." },
      tech: { facts: ["placedBy domain Order", "placedBy range Customer", "order_17 placedBy u_42"], conclusion: "Inferred: order_17 is an Order and u_42 is a Customer." },
    },
    missions: ["domain"],
    cases: [1],
    quiz: [
      { q: "In “Priya teaches Sam”, what is “teaches”?", options: ["A property", "A class", "An individual"], answer: 0, why: "It's a relationship between two things, which an ontology calls a property." },
      { q: "The range of “owns” is Vehicle. Asha owns Zippy. What follows?", options: ["Zippy is a Vehicle", "Asha is a Vehicle", "Nothing"], answer: 0, why: "The range classifies whatever sits at the end of the arrow." },
      { q: "What does a domain describe?", options: ["What kind of thing can start the relationship", "How many links are allowed", "Which database stores it"], answer: 0, why: "Domain is the start of the arrow; range is the end." },
    ],
  },
  {
    title: "Rules that chain",
    minutes: 5,
    summary: "Transitive and inverse properties.",
    lesson: {
      everyday: [
        "Some relationships chain. If the bolt is inside the engine and the engine is inside the car, the bolt is inside the car. That's called a transitive relationship.",
        "Others come in pairs that read the same link backwards, like “parent of” and “child of”. These are inverses: say one, and the computer knows the other.",
      ],
      tech: [
        "Mark a property transitive and the reasoner computes the closure for you: dependsOn chains, partOf hierarchies, locatedIn geography, with no recursive queries.",
        "Declare two properties inverse and either direction is queryable without storing the edge twice, so manages and reportsTo can never drift apart.",
      ],
    },
    example: {
      everyday: { facts: ["“is inside” chains (it's transitive)", "The bolt is inside the engine", "The engine is inside the car"], conclusion: "So the bolt is inside the car." },
      tech: { facts: ["dependsOn is transitive", "checkout dependsOn payments", "payments dependsOn auth"], conclusion: "Inferred: checkout dependsOn auth, so an auth outage pages checkout too." },
    },
    missions: [],
    cases: [2, 3],
    quiz: [
      { q: "“is ancestor of” is transitive. Ana is an ancestor of Ben, and Ben of Cara. What follows?", options: ["Ana is an ancestor of Cara", "Cara is an ancestor of Ana", "Nothing"], answer: 0, why: "Transitive relationships chain through the middle step." },
      { q: "“parent of” and “child of” are…", options: ["Inverse properties", "Transitive properties", "Disjoint classes"], answer: 0, why: "They describe the same link read from opposite ends." },
      { q: "Which relationship is most likely transitive?", options: ["is located in", "is married to", "has a birthday on"], answer: 0, why: "A street in a city in a country is in that country." },
    ],
  },
  {
    title: "Catching bad data",
    minutes: 4,
    summary: "Disjoint classes and contradictions.",
    lesson: {
      everyday: [
        "Some categories can never overlap: nothing is both a cat and a dog, or both a person and a company. Saying so lets the computer catch mistakes.",
        "If the facts ever force something into both, the computer reports a contradiction. That almost always means a data-entry error worth fixing.",
      ],
      tech: [
        "Disjointness axioms turn silent data-quality bugs into explicit errors.",
        "A record that ends up typed as both Individual and Organisation, perhaps through a domain rule on hasPassport, is flagged as inconsistent. It works like an integrity check, but it also covers facts that were only inferred.",
      ],
    },
    example: {
      everyday: { facts: ["Nothing is both a Person and a Company", "Only a Person has a date of birth", "Acme Ltd is a Company, with a date of birth"], conclusion: "Contradiction: Acme Ltd would have to be a Person and a Company. Someone filled the form in wrong." },
      tech: { facts: ["Individual disjointWith Organisation", "hasPassport domain Individual", "acme type Organisation; acme hasPassport p_9"], conclusion: "The reasoner reports acme as inconsistent. Fix the source record." },
    },
    missions: ["contradiction"],
    cases: [4],
    quiz: [
      { q: "Fruit and Vegetable are disjoint. What does that mean?", options: ["Nothing can be both", "Every Fruit is a Vegetable", "They are unrelated topics"], answer: 0, why: "Disjoint classes share no members." },
      { q: "A reasoner reports a contradiction. What's the usual cause?", options: ["Wrong or conflicting data", "The computer is broken", "Too many classes"], answer: 0, why: "The rules are usually fine; one of the facts is wrong." },
      { q: "Why is a contradiction useful?", options: ["It exposes errors you might never notice", "It makes queries faster", "It hides bad records"], answer: 0, why: "It turns a silent mistake into a visible one." },
    ],
  },
  {
    title: "Ontologies in the real world",
    minutes: 4,
    summary: "Schema.org, Wikidata, and healthcare.",
    lesson: {
      everyday: [
        "You use ontologies daily without seeing them. When Google shows a recipe card with cooking time and ratings, it's reading Schema.org, a shared vocabulary millions of websites use to describe recipes, events, and products.",
        "Wikidata describes over 100 million things, from rivers to film stars, in one connected graph. Hospitals use SNOMED CT so that “heart attack” and “myocardial infarction” mean the same thing everywhere.",
      ],
      tech: [
        "Schema.org is a lightweight ontology embedded as JSON-LD in web pages; search engines use it for rich results. Wikidata is a public knowledge graph you can query with SPARQL.",
        "In healthcare, SNOMED CT is an OWL ontology with hundreds of thousands of concepts, and HL7 FHIR records refer to it. Reusing an existing vocabulary nearly always beats inventing your own.",
      ],
    },
    example: {
      everyday: { facts: ["A web page says it is a Recipe", "Its cooking time is 30 minutes", "Its rating is 4.8"], conclusion: "So Google can show it as a recipe card with the time and stars." },
      tech: { facts: ['{ "@type": "Recipe",', '  "cookTime": "PT30M",', '  "aggregateRating": { "ratingValue": 4.8 } }'], conclusion: "Schema.org JSON-LD makes the page eligible for a recipe rich result." },
    },
    missions: [],
    cases: [],
    quiz: [
      { q: "What does Schema.org help search engines do?", options: ["Understand what a web page describes", "Store web pages", "Rank pages by length"], answer: 0, why: "It labels what a page is about, such as a recipe, event, or product." },
      { q: "Why do hospitals share an ontology like SNOMED CT?", options: ["So the same condition means the same thing everywhere", "To make records longer", "To replace doctors"], answer: 0, why: "Shared meaning lets records move safely between systems." },
      { q: "Before inventing your own ontology, you should…", options: ["Check whether a shared one already exists", "Write it in a spreadsheet", "Keep it secret"], answer: 0, why: "Reusing a standard makes your data understandable to others." },
    ],
  },
  {
    title: "Ontologies at work",
    minutes: 5,
    summary: "Access decisions, search, and AI.",
    lesson: {
      everyday: [
        "Small rules add up to real decisions. A lab door can open for anyone who's authorised, where researchers count as authorised and anyone working on an experiment counts as a researcher.",
        "Search engines use the same idea to know a sofa is a kind of furniture. And AI assistants answer more reliably when they can check facts against a knowledge graph instead of guessing.",
      ],
      tech: [
        "Ontology-backed rules drive attribute-based access control, semantic search that expands queries over subclass hierarchies, and data integration across teams.",
        "In AI pipelines a knowledge graph grounds the model: retrieve the relevant entities and relations, put them in the prompt, and the model cites facts instead of inventing them. This is often called GraphRAG.",
      ],
    },
    example: {
      everyday: { facts: ["Researchers are authorised", "Only a Researcher works on an experiment", "Alice works on Exp-7"], conclusion: "So the door opens for Alice, though nobody listed her as a researcher." },
      tech: { facts: ["Question: “What breaks if auth is down?”", "Graph: checkout → payments → auth (transitive dependsOn)", "Those facts go into the model's prompt"], conclusion: "The answer names checkout and payments, grounded in the graph." },
    },
    missions: [],
    cases: [5],
    quiz: [
      { q: "How can a knowledge graph help an AI assistant?", options: ["It gives the AI real facts to check against", "It makes the AI type faster", "It replaces the AI"], answer: 0, why: "Grounding answers in known facts reduces made-up answers." },
      { q: "A search for “furniture” also returns sofas because…", options: ["Sofa is a subclass of Furniture", "The words look similar", "Sofas are popular"], answer: 0, why: "Search can expand a query to every subclass." },
      { q: "In the lab-door case, which two rules combined?", options: ["A domain rule and a subclass rule", "Two inverse rules", "A disjointness rule and a range rule"], answer: 0, why: "worksOn's domain makes Alice a Researcher; Researcher ⊑ LabAuthorized does the rest." },
    ],
  },
];

export const QUIZ_COUNT = chapters.reduce((n, c) => n + c.quiz.length, 0);

// Content for the prototype: the party warm-up and Case 01.
// The numbers quoted in the copy are claims; tests/content.test.mjs checks
// that counting the data the way each person describes gives those numbers.

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
  host: "Sam",
  guests: names.map((name) => ({
    name,
    came: !noShows.has(name),
    rsvp: !walkIns.has(name),
    seconds: seconds.has(name),
    leftEarly: leftEarly.has(name),
  })),
  claims: { caterer: 46, host: 40, photographer: 33 },
  counters: {
    caterer: { label: "The caterer", says: "counted plates served", question: "Counted at what level?", lesson: "Plates, not people. Anyone who went back for seconds counts twice." },
    host: { label: "Sam, the host", says: "counted RSVPs", question: "What do we count?", lesson: "Promises, not arrivals. No-shows count, and walk-ins who never replied are left out." },
    photographer: { label: "The photographer", says: "counted the 9 PM group photo", question: "Over what period?", lesson: "Only who was there at 9 PM. Guests who left early are missing." },
  },
};

// Case 01: twelve March orders. kind marks the orders the two teams disagree on.
export const case01 = {
  title: "March revenue",
  orders: [
    { id: "ORD-101", amount: 480 },
    { id: "ORD-102", amount: 360 },
    { id: "ORD-103", amount: 250, kind: "refund", note: "Refunded on 2 Apr" },
    { id: "ORD-104", amount: 520 },
    { id: "ORD-105", amount: 300 },
    { id: "ORD-106", amount: 50, kind: "test", note: "Test order by QA" },
    { id: "ORD-107", amount: 440 },
    { id: "ORD-108", amount: 380 },
    { id: "ORD-109", amount: 100, kind: "tz", note: "31 Mar, 11:40 PM UTC. Already 1 Apr in Singapore" },
    { id: "ORD-110", amount: 610 },
    { id: "ORD-111", amount: 290 },
    { id: "ORD-112", amount: 420 },
  ],
  switches: [
    { key: "refund", label: "Remove refunds", short: "Refunds", sql: "AND status <> 'refunded'" },
    { key: "test", label: "Remove test orders", short: "Test orders", sql: "AND is_test = false" },
    { key: "tz", label: "Use company timezone", short: "Timezone", sql: "created_at AT TIME ZONE 'Asia/Singapore'" },
  ],
  recipes: {
    sales: { refund: false, test: false, tz: false },
    finance: { refund: true, test: true, tz: true },
  },
  claims: { sales: 4200, finance: 3800 },
  options: ["Sales", "Finance", "Both", "Neither"],
  answer: 2,
};

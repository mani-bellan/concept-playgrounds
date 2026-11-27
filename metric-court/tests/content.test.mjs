// Content checks: every number the copy states must come from counting the data.
// Run with: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { party, case01 } from "../src/data.js";
import { partyCount, revenue, excludedBy, moneyFormatter } from "../src/metrics.js";

test("each party count matches what that person claims", () => {
  for (const [who, claim] of Object.entries(party.claims)) assert.equal(partyCount(party.guests, who), claim, who);
});

test("the party story holds: 38 came, 2 walk-ins, 4 no-shows, 8 seconds, 5 left early", () => {
  const g = party.guests;
  assert.equal(new Set(g.map((x) => x.name)).size, g.length, "names are unique");
  assert.equal(g.filter((x) => x.came).length, 38);
  assert.equal(g.filter((x) => x.came && !x.rsvp).length, 2);
  assert.equal(g.filter((x) => !x.came && x.rsvp).length, 4);
  assert.equal(g.filter((x) => x.seconds && x.came).length, 8);
  assert.equal(g.filter((x) => x.leftEarly && x.came).length, 5);
  assert.ok(g.every((x) => x.came || (!x.seconds && !x.leftEarly)), "no-shows cannot have seconds or leave early");
});

test("Sales and Finance totals match their claims and differ only by the switches", () => {
  assert.equal(revenue(case01.orders, case01.recipes.sales), case01.claims.sales);
  assert.equal(revenue(case01.orders, case01.recipes.finance), case01.claims.finance);
  for (const s of case01.switches) {
    const only = { refund: false, test: false, tz: false, [s.key]: true };
    const removed = case01.orders.filter((o) => excludedBy(o, only));
    assert.ok(removed.length > 0 && removed.every((o) => o.kind === s.key), `${s.key} removes only its own orders`);
  }
  assert.equal(case01.options[case01.answer], "Both");
});

test("money follows the visitor's locale", () => {
  assert.equal(moneyFormatter("en-US")(4200), "$4,200");
  assert.equal(moneyFormatter("en-IN")(420000), "₹4,20,000");
  assert.match(moneyFormatter("de-DE")(4200), /4\.200\s€/);
  assert.equal(moneyFormatter("xx")(5), "$5");
});

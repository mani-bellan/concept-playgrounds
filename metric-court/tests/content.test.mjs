// Content checks: every number the copy states must come from the data,
// every case must be solvable, and the course must link real cases.
// Run with: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { party, cases, build } from "../src/data.js";
import { chapters } from "../src/chapters.js";
import { partyCount, measure, excludedBy, sameRecipe, buildTotal, toMetricFlow, moneyFormatter, formatter } from "../src/metrics.js";
import { casePoints, MAX_SCORE, BADGES } from "../src/progress.js";

test("each party count matches what that person claims", () => {
  for (const [who, claim] of Object.entries(party.claims)) assert.equal(partyCount(party.guests, who), claim, who);
  const g = party.guests;
  assert.equal(g.filter((x) => x.came).length, 38, "38 guests came");
  assert.ok(g.every((x) => x.came || (!x.seconds && !x.leftEarly)), "no-shows cannot have seconds or leave early");
});

test("every team's claim is what its recipe computes, rounded as shown", () => {
  for (const c of cases)
    for (const t of c.teams) assert.equal(Math.round(measure(c, t.recipe)), t.claim, `case ${c.id} ${t.key}`);
});

test("every case starts unsolved and every target team is reachable with its switches", () => {
  for (const c of cases) {
    assert.deepEqual(Object.keys(c.start).sort(), c.switches.map((s) => s.key).sort(), `case ${c.id} start covers every switch`);
    for (const t of c.teams) assert.deepEqual(Object.keys(t.recipe).sort(), Object.keys(c.start).sort(), `case ${c.id} ${t.key} recipe keys`);
    assert.ok(!c.target.every((k) => sameRecipe(c.start, c.teams.find((t) => t.key === k).recipe)), `case ${c.id} is not solved at the start`);
    assert.ok(c.answer < c.options.length, `case ${c.id} answer index`);
    // Teams disagree, otherwise there is no dispute.
    assert.equal(new Set(c.teams.map((t) => t.claim)).size, c.teams.length, `case ${c.id} teams disagree`);
    // Each switch that removes rows removes only rows tagged with it.
    for (const s of c.switches.filter((s) => !s.mode)) {
      const tagged = c.rows.filter((r) => r.out?.some((o) => o.replace("!", "") === s.key));
      assert.ok(tagged.length > 0, `case ${c.id} switch ${s.key} affects some rows`);
    }
  }
});

test("verdicts match the answer: wrong teams exist only in cases that say so", () => {
  for (const c of cases) {
    const both = /BOTH|ALL THREE/.test(c.verdict[0]);
    const optionSaysBoth = /Both|All three/.test(c.options[c.answer]);
    assert.equal(both, optionSaysBoth, `case ${c.id} verdict and answer agree`);
  }
  assert.ok(cases.some((c) => !/BOTH|ALL/.test(c.verdict[0])), "at least one case has a wrong team");
});

test("the case stories hold", () => {
  const byId = Object.fromEntries(cases.map((c) => [c.id, c]));
  // 02: each order counted once per item.
  const joinRows = byId["02"].rows;
  assert.equal(new Set(joinRows.map((r) => r.id.split(" · ")[0])).size, 5);
  // 04: both weeks are 7 days, one Sunday swapped (1 Mar 2026 is a Sunday).
  const wk = (iso) => byId["04"].rows.filter((r) => !excludedBy(r, { iso })).length;
  assert.equal(wk(false), 7);
  assert.equal(wk(true), 7);
  assert.equal(new Date(Date.UTC(2026, 2, 1)).getUTCDay(), 0);
  // 05: 2 of 10 paying customers left.
  const paying = byId["05"].rows.filter((r) => !excludedBy(r, { trial: true }));
  assert.equal(paying.length, 10);
  assert.equal(paying.filter((r) => r.hit).length, 2);
  // 06: North 2 orders, South 8.
  assert.equal(byId["06"].rows.filter((r) => r.group === "North").length, 2);
  assert.equal(byId["06"].rows.filter((r) => r.group === "South").length, 8);
  // 08 uses the same orders as 01.
  assert.deepEqual(byId["08"].rows.map((r) => r.value), byId["01"].rows.map((r) => r.value));
});

test("chapters link existing cases, cover every case, and have valid quizzes", () => {
  const ids = new Set(cases.map((c) => c.id));
  const linked = chapters.flatMap((c) => c.cases);
  assert.ok(linked.every((id) => ids.has(id)));
  assert.deepEqual([...new Set(linked)].sort(), [...ids].sort());
  for (const c of cases) assert.ok(chapters[c.chapter - 1].cases.includes(c.id), `case ${c.id} chapter link`);
  for (const ch of chapters) for (const q of ch.quiz) assert.ok(q.answer < q.options.length, ch.title);
  // Chapter 3's quiz quotes Case 06's numbers.
  assert.match(chapters[2].quiz[1].options[chapters[2].quiz[1].answer], /\$59/);
});

test("Build a metric: dashboards differ, and only Finance's recipe matches Finance", () => {
  const totals = build.dashboards.map((d) => buildTotal(build.orders, d.recipe));
  assert.deepEqual(totals, [3220, 5200, 2700]);
  const fin = build.dashboards.find((d) => d.key === "finance").recipe;
  let matches = 0;
  for (const net of [0, 1]) for (const grain of [0, 1]) for (const localTz of [0, 1]) for (const t of [false, true]) for (const s of [false, true])
    if (buildTotal(build.orders, { net, grain, localTz, test: t, staff: s }) === 2700) matches++;
  assert.equal(matches, 1, "Finance's number has exactly one recipe");
  const yaml = toMetricFlow(fin);
  assert.match(yaml, /agg: sum/);
  assert.match(yaml, /Dimension\('order__status'\)/);
  assert.match(yaml, /agg_time_dimension: ordered_at_local/);
});

test("scoring and formats", () => {
  assert.equal(casePoints(true, 0), 3);
  assert.equal(casePoints(true, 1), 2);
  assert.equal(casePoints(false, 1), 1);
  assert.equal(MAX_SCORE, 37);
  assert.equal(BADGES.length, 9);
  assert.equal(moneyFormatter("en-US")(4200), "$4,200");
  assert.equal(moneyFormatter("en-IN")(420000), "₹4,20,000");
  assert.match(moneyFormatter("de-DE")(4200), /4\.200\s€/);
  assert.equal(formatter("percent", "en-US")(20), "20%");
});

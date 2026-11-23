// Content checks: the puzzles, missions, and course must agree with the reasoner.
// Run with: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { reason } from "../src/ontology.js";
import { levels, missions } from "../src/data.js";
import { chapters } from "../src/chapters.js";

test("every Detective answer is what the reasoner concludes", () => {
  for (const [i, level] of levels.entries()) {
    const r = reason(level.world);
    if (level.contradiction) {
      assert.ok(r.contradictions.length > 0, `case ${i + 1} should be contradictory`);
    } else {
      assert.equal(r.contradictions.length, 0, `case ${i + 1} should be consistent`);
      for (const k of level.targets) assert.ok(r.facts.get(k)?.inferred, `case ${i + 1}: reasoner should infer ${k}`);
    }
    assert.ok(level.answer < level.options.length, `case ${i + 1} answer index`);
  }
});

test("the guided missions complete when built as instructed", () => {
  const w = { classes: [], individuals: [], properties: [], facts: [] };
  const done = () => missions.filter((m) => m.done(w, reason(w), true)).map((m) => m.id);
  w.classes.push("Food");
  assert.deepEqual(done(), ["class"]);
  w.classes.push("Fruit");
  w.facts.push({ s: "Fruit", p: "subClassOf", o: "Food" });
  w.individuals.push("Mango");
  w.facts.push({ s: "Mango", p: "type", o: "Fruit" });
  assert.deepEqual(done(), ["class", "subclass", "individual", "reason"]);
  w.classes.push("Chef");
  w.properties.push({ id: "cooks", domain: "Chef" });
  w.individuals.push("Priya");
  w.facts.push({ s: "Priya", p: "cooks", o: "Mango" });
  assert.ok(done().includes("domain"));
  w.classes.push("Vegetable");
  w.facts.push({ s: "Fruit", p: "disjointWith", o: "Vegetable" }, { s: "Mango", p: "type", o: "Vegetable" });
  assert.equal(done().length, missions.length);
});

test("course chapters reference real missions, cases, and sources", () => {
  for (const [c, ch] of chapters.entries()) {
    for (const id of ch.missions) assert.ok(missions.some((m) => m.id === id), `chapter ${c + 1}: mission ${id}`);
    for (const i of ch.cases) assert.ok(levels[i], `chapter ${c + 1}: case ${i}`);
    for (const q of ch.quiz) assert.ok(q.answer < q.options.length, `chapter ${c + 1}: quiz answer index`);
    assert.ok(ch.sources.length && ch.sources.every((s) => s.url.startsWith("https://")), `chapter ${c + 1}: sources`);
    for (const path of ["everyday", "tech"]) assert.ok(ch.lesson[path].length && ch.example[path].facts.length, `chapter ${c + 1}: ${path} content`);
  }
});

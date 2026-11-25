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

test("the generated SQL returns what the reasoner concludes", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const { sqlFor, sqlForContradiction, table } = await import("../src/sql.js");
  const { explain } = await import("../src/ontology.js");
  const { presets } = await import("../src/data.js");
  const worlds = [...levels.map((l, i) => [`case ${i + 1}`, l.world]), ...Object.entries(presets).map(([k, p]) => [k, p.world])];
  // Run a step's SQL (after any inverse views it relies on) and return every value in the result.
  const run = (world, result, sql, deps = [], views = []) => {
    const derived = new Set([...deps.map((d) => d.p), ...views]);
    const db = new DatabaseSync(":memory:");
    db.exec("CREATE TABLE is_a(entity, class); CREATE TABLE subclass_of(child, parent);");
    for (const p of world.properties) if (!derived.has(p.id)) db.exec(`CREATE TABLE ${table(p.id)}(source, target)`);
    for (const f of world.facts) {
      const t = f.p === "type" ? "is_a" : f.p === "subClassOf" ? "subclass_of" : f.p === "disjointWith" ? null : table(f.p);
      if (t && !derived.has(f.p)) db.prepare(`INSERT INTO ${t} VALUES (?, ?)`).run(f.s, f.o);
    }
    for (const d of deps) db.exec(sqlFor(d, result).split(/\n\n(?=SELECT)/)[0]);
    const parts = sql.split(/\n\n(?=SELECT)/);
    parts.slice(0, -1).forEach((s) => db.exec(s));
    return db.prepare(parts.at(-1)).all().flatMap(Object.values);
  };
  let checked = 0;
  for (const [name, world] of worlds) {
    const result = reason(world);
    for (const [k, f] of result.facts) {
      if (!f.inferred) continue;
      const sql = sqlFor(f, result);
      const deps = explain(result, [k]).filter((d) => d.rule === "Inverse" && d !== f);
      // An inverse-derived relation lives only in its view, so its table isn't created.
      const expected = ["Domain", "Range"].includes(f.rule) ? f.s : f.o;
      const rows = run(world, result, sql, deps, f.rule === "Inverse" ? [f.p] : []);
      assert.equal(rows.includes(expected), !sql.includes("Catch:"), `${name}: SQL for ${k}\n${sql}\nreturned ${rows}`);
      checked++;
    }
    for (const c of result.contradictions) {
      const sql = sqlForContradiction(c, result);
      assert.equal(run(world, result, sql).includes(c.individual), !sql.includes("Catch:"), `${name}: contradiction SQL\n${sql}`);
      checked++;
    }
  }
  assert.ok(checked > 40, `checked ${checked} queries`);
});

test("every suggested fix resolves its contradiction, and only real causes are offered", async () => {
  const { fixes } = await import("../src/ontology.js");
  for (const [i, level] of levels.entries()) {
    if (!level.contradiction) continue;
    const c = reason(level.world).contradictions[0];
    const list = fixes(level.world, c);
    assert.ok(list.some((f) => f.layer === "data") && list.some((f) => f.layer === "rule"), `case ${i + 1}: data and rule fixes`);
    for (const f of list) assert.equal(reason(f.world).contradictions.length, 0, `case ${i + 1}: "${f.label}" should fix it`);
  }
  // The Android case has five independent causes; the subclass facts in Two Revenues are not causes.
  const labels = (i) => fixes(levels[i].world, reason(levels[i].world).contradictions[0]).map((f) => f.label);
  assert.equal(labels(4).length, 5);
  assert.deepEqual(labels(10).sort(), ["Nothing can be both a GrossRevenue and a NetRevenue", "revenue_q3 is a GrossRevenue", "revenue_q3 is a NetRevenue"]);
});

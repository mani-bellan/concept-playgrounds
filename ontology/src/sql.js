// "Show the SQL": the query a data engineer would write to get the same
// conclusion as one reasoner step, using the world's own names. Assumes a
// simple warehouse layout: is_a(entity, class) for stated types,
// subclass_of(child, parent), and one table per relationship with columns
// (source, target). The tests run every query against SQLite.

export const SQL_SCHEMA = "is_a(entity, class), subclass_of(child, parent), and one (source, target) table per relationship";

export const table = (p) => p.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().replace(/[^a-z0-9_]/g, "_");
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const an = (w) => (/^[AEIOU]/i.test(w) ? "an " : "a ") + w;

const STORE = "show-sql";
export const sqlOn = () => localStorage.getItem(STORE) === "1";
export const setSqlOn = (on) => localStorage.setItem(STORE, on ? "1" : "0");

// SQL for one inferred fact. `result` is the reasoner output that produced it.
export function sqlFor(f, result) {
  const [a] = f.from.map((k) => result.facts.get(k));
  switch (f.rule) {
    case "Subclass chain":
      return `-- Every class above ${f.s}, at any depth
WITH RECURSIVE ancestors(class) AS (
  SELECT parent FROM subclass_of WHERE child = ${q(f.s)}
  UNION
  SELECT s.parent FROM subclass_of s JOIN ancestors a ON s.child = a.class
)
SELECT class FROM ancestors;  -- includes ${q(f.o)}`;
    case "Inheritance": {
      // The recursion covers inheritance itself; types from other rules are invisible to it.
      let root = a;
      while (root.inferred && root.rule === "Inheritance") root = result.facts.get(root.from[0]);
      const note = root.inferred
        ? `\n-- Catch: ${f.s} is ${an(root.o)} only by inference (${root.rule.toLowerCase()} rule), so is_a has no such row and this misses ${q(f.o)} until you add that branch too.`
        : "";
      return `-- ${f.s}'s stated types, plus every class above them
WITH RECURSIVE types(class) AS (
  SELECT class FROM is_a WHERE entity = ${q(f.s)}
  UNION
  SELECT s.parent FROM subclass_of s JOIN types t ON s.child = t.class
)
SELECT class FROM types;${note ? "" : `  -- includes ${q(f.o)}`}${note}`;
    }
    case "Domain":
    case "Range": {
      const col = f.rule === "Domain" ? "source" : "target";
      const note = a.inferred && a.rule === "Inverse" ? `\n-- ${table(a.p)} is the view from the inverse step, not a stored table.` : "";
      return `-- A database won't conclude this by itself. Every query that lists
-- ${f.o} rows needs an extra branch for the ${col} side of ${a.p}:
SELECT entity FROM is_a WHERE class = ${q(f.o)}
UNION
SELECT ${col} FROM ${table(a.p)};  -- includes ${q(f.s)}${note}`;
    }
    case "Inverse":
      return `-- ${f.p} isn't stored: derive it from ${a.p} by swapping the columns
CREATE VIEW ${table(f.p)} AS
SELECT target AS source, source AS target FROM ${table(a.p)};

SELECT target FROM ${table(f.p)} WHERE source = ${q(f.s)};  -- ${q(f.o)}`;
    case "Transitivity":
      return `-- Everything ${f.s} ${f.p}, directly or through a chain
WITH RECURSIVE reach(node) AS (
  SELECT target FROM ${table(f.p)} WHERE source = ${q(f.s)}
  UNION
  SELECT d.target FROM ${table(f.p)} d JOIN reach r ON d.source = r.node
)
SELECT node FROM reach;  -- includes ${q(f.o)}`;
  }
  return "";
}

// A data-quality test for a disjointness contradiction.
export function sqlForContradiction(c, result) {
  const [x, y] = c.classes;
  const inferred = c.from.slice(0, 2).some((k) => result.facts.get(k).inferred);
  return `-- A data-quality test (like a dbt test): rows that are both ${x} and ${y}
SELECT entity FROM is_a WHERE class = ${q(x)}
INTERSECT
SELECT entity FROM is_a WHERE class = ${q(y)};  -- should return no rows${
    inferred
      ? `\n-- Catch: ${c.individual}'s types are partly inferred, so is_a alone returns nothing and the test passes. The reasoner still catches it.`
      : `\n-- Returns ${q(c.individual)}, so the test fails.`
  }`;
}

// Toggle markup and the block shown under one trace step.
export const sqlToggle = () =>
  `<label class="sql-toggle"><input type="checkbox" data-sql-toggle ${sqlOn() ? "checked" : ""}><span class="switch"></span>Show the SQL</label>`;
export const sqlNote = () => (sqlOn() ? `<p class="sql-note">Illustrative SQL over tables ${SQL_SCHEMA}.</p>` : "");
export const sqlBlock = (code, esc) =>
  sqlOn() && code ? `<pre class="sql"><code>${esc(code).replace(/--[^\n]*/g, (c) => `<span class="${c.startsWith("-- Catch") ? "c catch" : "c"}">${c}</span>`)}</code></pre>` : "";

// Exports that take a world from ontology to data tooling:
//   R2RML (W3C): maps warehouse tables to the ontology, so a tool such as
//   Ontop can query the warehouse as a knowledge graph.
//   dbt MetricFlow: starter semantic models generated from the classes.
// Both assume the warehouse layout used by "Show the SQL": is_a(entity, class)
// and one (source, target) table per relationship.
import { table } from "./sql.js";
import { BASE, encode, iri } from "./ontology.js";

export function toR2RML(world) {
  const out = [
    "@prefix rr:  <http://www.w3.org/ns/r2rml#> .",
    "@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .",
    `@prefix ex:  <${BASE}> .`,
    "",
    "# Maps warehouse rows to facts in your ontology. Tables: is_a(entity, class)",
    "# and one (source, target) table per relationship. The class hierarchy and",
    "# rules stay in the OWL file; a tool such as Ontop combines both and answers",
    "# SPARQL queries over the warehouse, with subclass, domain, range and inverse",
    "# inferences included.",
    ...world.properties
      .filter((p) => p.transitive)
      .map((p) => `# Note: Ontop reasons with the OWL 2 QL profile, which has no transitive\n# properties, so it won't follow "${p.id}" chains; query them with a SPARQL path (+).`),
    "",
    "<#Types> a rr:TriplesMap ;",
    '  rr:logicalTable [ rr:tableName "is_a" ] ;',
    `  rr:subjectMap [ rr:template "${BASE}{entity}" ] ;`,
    `  rr:predicateObjectMap [ rr:predicate rdf:type ; rr:objectMap [ rr:template "${BASE}{class}" ] ] .`,
  ];
  for (const p of world.properties)
    out.push(
      "",
      `<#${encode(p.id)}> a rr:TriplesMap ;`,
      `  rr:logicalTable [ rr:tableName "${table(p.id)}" ] ;`,
      `  rr:subjectMap [ rr:template "${BASE}{source}" ] ;`,
      `  rr:predicateObjectMap [ rr:predicate ${iri(p.id)} ; rr:objectMap [ rr:template "${BASE}{target}" ] ] .`,
    );
  return out.join("\n");
}

export function toMetricFlow(world) {
  const an = (w) => (/^[AEIOU]/i.test(w) ? "an " : "a ") + w;
  const timeAndCount = (name, expr) => [
    "    dimensions:",
    "      - name: created_at",
    "        type: time",
    "        type_params:",
    "          time_granularity: day",
    "    measures:",
    `      - name: ${name}_count`,
    "        agg: count_distinct",
    `        expr: ${expr}`,
  ];
  const out = [
    "# dbt MetricFlow starter, generated from your ontology. Assumes one dbt model",
    "# per class with one row per member, e.g. for Dog:",
    "#   select entity as dog_id, created_at from is_a where class = 'Dog'",
    "# and one per relationship, with its (source, target) columns.",
    "# List inferred members too (the reasoner's job), or a class misses members",
    "# that only belong to it through a subclass or a domain rule.",
    "# created_at is an assumed timestamp column: MetricFlow needs one to",
    "# aggregate over time. Your project also needs a time spine model.",
    "# An ontology says what things are, not how to add them up: the counts",
    "# are a start; add real measures such as SUM(amount) yourself.",
    "",
    "semantic_models:",
  ];
  const models = [];
  for (const c of world.classes) {
    const name = table(c);
    const parents = world.facts.filter((f) => f.s === c && f.p === "subClassOf").map((f) => an(f.o));
    models.push([name, c]);
    out.push(
      `  - name: ${name}`,
      `    description: Members of ${c}.${parents.length ? ` Every ${c} is also ${parents.join(" and ")}; MetricFlow has no inheritance, so list them in those models too.` : ""}`,
      `    model: ref('${name}')`,
      "    defaults:",
      "      agg_time_dimension: created_at",
      "    entities:",
      `      - name: ${name}`,
      "        type: primary",
      `        expr: ${name}_id`,
      ...timeAndCount(name, `${name}_id`),
    );
  }
  // A relationship can link one thing to many, so it gets its own model.
  for (const p of world.properties) {
    const name = table(p.id);
    if (models.some(([m]) => m === name)) continue;
    models.push([name, `${p.id} links`]);
    const ends = [["source", p.domain], ["target", p.range]].filter(([, c]) => c && world.classes.includes(c));
    out.push(
      `  - name: ${name}`,
      `    description: Links from the "${p.id}" relationship, one row per link.`,
      `    model: ref('${name}')`,
      `    primary_entity: ${name}`,
      "    defaults:",
      "      agg_time_dimension: created_at",
      "    entities:",
      ...(ends.length
        ? ends.flatMap(([col, c], i) => [`      - name: ${table(c)}${i && table(c) === table(ends[0][1]) ? "_target" : ""}`, "        type: foreign", `        expr: ${col}`])
        : [`      - name: ${name}_source`, "        type: foreign", "        expr: source"]),
      ...timeAndCount(name, "source || '->' || target"),
    );
  }
  if (!models.length) out.push("  []");
  out.push("", "metrics:");
  for (const [m, label] of models)
    out.push(`  - name: ${m}_count`, `    label: Number of ${label}`, "    type: simple", "    type_params:", `      measure: ${m}_count`);
  if (!models.length) out.push("  []");
  return out.join("\n");
}

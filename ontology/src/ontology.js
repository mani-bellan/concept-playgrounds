// A tiny ontology reasoner. It understands a small, friendly subset of OWL:
// classes, individuals, subclass, disjointness, and object properties with
// domain, range, transitivity, and inverses. Every inferred fact remembers
// which rule produced it and from which facts, so the UI can explain itself.
//
// World shape:
// {
//   classes: ["Dog", ...],
//   individuals: ["Rex", ...],
//   properties: [{ id: "owns", domain?: "Person", range?: "Pet", transitive?: bool, inverseOf?: "ownedBy" }],
//   facts: [{ s: "Rex", p: "type" | "subClassOf" | "disjointWith" | <property id>, o: "Dog" }],
// }

const an = (w) => (/^[AEIOU]/i.test(w) ? "an " : "a ") + w;

export const key = (f) => `${f.s}|${f.p}|${f.o}`;

export function describe(f) {
  if (f.p === "type") return `${f.s} is ${an(f.o)}`;
  if (f.p === "subClassOf") return `Every ${f.s} is ${an(f.o)}`;
  if (f.p === "disjointWith") return `Nothing can be both ${an(f.s)} and ${an(f.o)}`;
  return `${f.s} ${f.p} ${f.o}`;
}

export function relationLabel(p) {
  if (p === "type") return "is a";
  if (p === "subClassOf") return "subclass of";
  if (p === "disjointWith") return "disjoint with";
  return p;
}

export function reason(world) {
  const facts = new Map();
  for (const f of world.facts) facts.set(key(f), { ...f, inferred: false });

  const props = new Map(world.properties.map((p) => [p.id, p]));
  const inverse = new Map();
  for (const p of world.properties) {
    if (p.inverseOf && props.has(p.inverseOf)) {
      inverse.set(p.id, p.inverseOf);
      if (!inverse.has(p.inverseOf)) inverse.set(p.inverseOf, p.id);
    }
  }

  const add = (f, rule, from, because) => {
    const k = key(f);
    if (facts.has(k)) return false;
    facts.set(k, { ...f, inferred: true, rule, from: from.map(key), because });
    return true;
  };

  let changed = true;
  while (changed) {
    changed = false;
    const all = [...facts.values()];
    const subs = all.filter((f) => f.p === "subClassOf");
    const types = all.filter((f) => f.p === "type");
    const rels = all.filter((f) => props.has(f.p));

    for (const a of subs)
      for (const b of subs)
        if (a.o === b.s && a.s !== b.o)
          changed |= add({ s: a.s, p: "subClassOf", o: b.o }, "Subclass chain", [a, b],
            `Every ${a.s} is ${an(a.o)}, and every ${a.o} is ${an(b.o)}, so every ${a.s} is ${an(b.o)}.`);

    for (const t of types)
      for (const s of subs)
        if (t.o === s.s)
          changed |= add({ s: t.s, p: "type", o: s.o }, "Inheritance", [t, s],
            `${t.s} is ${an(t.o)}, and every ${t.o} is ${an(s.o)}, so ${t.s} is ${an(s.o)}.`);

    for (const r of rels) {
      const p = props.get(r.p);
      if (p.domain)
        changed |= add({ s: r.s, p: "type", o: p.domain }, "Domain", [r],
          `The domain of "${p.id}" is ${p.domain}: anything that ${p.id} something is ${an(p.domain)}. ${r.s} ${p.id} ${r.o}, so ${r.s} is ${an(p.domain)}.`);
      if (p.range)
        changed |= add({ s: r.o, p: "type", o: p.range }, "Range", [r],
          `The range of "${p.id}" is ${p.range}: anything at the receiving end of "${p.id}" is ${an(p.range)}. ${r.s} ${p.id} ${r.o}, so ${r.o} is ${an(p.range)}.`);
      if (inverse.has(r.p)) {
        const q = inverse.get(r.p);
        changed |= add({ s: r.o, p: q, o: r.s }, "Inverse", [r],
          `"${q}" is the inverse of "${r.p}". ${r.s} ${r.p} ${r.o}, so ${r.o} ${q} ${r.s}.`);
      }
      if (p.transitive)
        for (const r2 of rels)
          if (r2.p === r.p && r.o === r2.s && r.s !== r2.o)
            changed |= add({ s: r.s, p: r.p, o: r2.o }, "Transitivity", [r, r2],
              `"${r.p}" is transitive (it chains). ${r.s} ${r.p} ${r.o} and ${r.o} ${r.p} ${r2.o}, so ${r.s} ${r.p} ${r2.o}.`);
    }
  }

  const all = [...facts.values()];
  const contradictions = [];
  for (const d of all.filter((f) => f.p === "disjointWith")) {
    for (const t1 of all) {
      if (t1.p !== "type" || t1.o !== d.s) continue;
      const t2 = facts.get(key({ s: t1.s, p: "type", o: d.o }));
      if (t2)
        contradictions.push({
          individual: t1.s,
          classes: [d.s, d.o],
          from: [key(t1), key(t2), key(d)],
          because: `${t1.s} is ${an(d.s)} and also ${an(d.o)}, but nothing can be both. The ontology contradicts itself.`,
        });
    }
  }

  return { facts, contradictions };
}

// Steps needed to derive the given fact keys, dependencies first.
export function explain(result, keys) {
  const steps = [];
  const seen = new Set();
  const visit = (k) => {
    if (seen.has(k)) return;
    seen.add(k);
    const f = result.facts.get(k);
    if (!f) return;
    if (f.inferred) f.from.forEach(visit);
    steps.push(f);
  };
  keys.forEach(visit);
  return steps;
}

const iri = (name) => "ex:" + name.replace(/[^A-Za-z0-9_]/g, "_");

export function toTurtle(world) {
  const out = [
    "@prefix ex:   <http://example.org/> .",
    "@prefix owl:  <http://www.w3.org/2002/07/owl#> .",
    "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .",
    "",
  ];
  const stated = (s, p) => world.facts.filter((f) => f.s === s && f.p === p).map((f) => f.o);

  for (const c of world.classes) {
    const parts = ["a owl:Class"];
    for (const o of stated(c, "subClassOf")) parts.push(`rdfs:subClassOf ${iri(o)}`);
    for (const o of stated(c, "disjointWith")) parts.push(`owl:disjointWith ${iri(o)}`);
    out.push(`${iri(c)} ${parts.join(" ;\n    ")} .`);
  }
  if (world.properties.length) out.push("");
  for (const p of world.properties) {
    const parts = [p.transitive ? "a owl:ObjectProperty, owl:TransitiveProperty" : "a owl:ObjectProperty"];
    if (p.domain) parts.push(`rdfs:domain ${iri(p.domain)}`);
    if (p.range) parts.push(`rdfs:range ${iri(p.range)}`);
    if (p.inverseOf) parts.push(`owl:inverseOf ${iri(p.inverseOf)}`);
    out.push(`${iri(p.id)} ${parts.join(" ;\n    ")} .`);
  }
  if (world.individuals.length) out.push("");
  for (const i of world.individuals) {
    const parts = [];
    const types = stated(i, "type");
    if (types.length) parts.push(`a ${types.map(iri).join(", ")}`);
    for (const f of world.facts.filter((f) => f.s === i && f.p !== "type"))
      parts.push(`${iri(f.p)} ${iri(f.o)}`);
    if (!parts.length) parts.push("a owl:NamedIndividual");
    out.push(`${iri(i)} ${parts.join(" ;\n    ")} .`);
  }
  return out.join("\n");
}

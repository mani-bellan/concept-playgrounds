// "Build a World": a free-form ontology editor with a live reasoner.
import { reason, explain, describe, relationLabel, toTurtle } from "./ontology.js";
import { createGraph, graphModel } from "./graph.js";
import { presets, missions } from "./data.js";
import { progress, save as saveProgress, award, toast, MISSION_POINTS } from "./progress.js";

const STORE = "ontology-sandbox";
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clone = (x) => JSON.parse(JSON.stringify(x));
const X_ICON = `<svg viewBox="0 0 16 16" width="12" height="12"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const ALERT_ICON = `<svg viewBox="0 0 16 16" width="15" height="15"><path d="M8 1.5l7 12.5H1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6v3.5M8 11.5v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const PLAY_ICON = `<svg viewBox="0 0 16 16" width="12" height="12"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>`;

let state;
let result;
let fresh = false;

function load(preset) {
  const p = presets[preset];
  state = { world: clone(p.world), positions: clone(p.positions), showInferred: false, selected: null, highlight: null };
}

function save() {
  const { world, positions } = state;
  localStorage.setItem(STORE, JSON.stringify({ world, positions }));
}

const graph = createGraph($("#sandbox-graph"), {
  onMove: (id, x, y) => {
    state.positions[id] = [x, y];
    save();
  },
  onSelect: (id) => {
    state.selected = id;
    state.highlight = null;
    update();
  },
});

const isClass = (id) => state.world.classes.includes(id);
const allNames = () => [...state.world.classes, ...state.world.individuals, ...state.world.properties.map((p) => p.id)];

function freeSpot() {
  const taken = Object.entries(state.positions)
    .filter(([id]) => allNames().includes(id))
    .map(([, p]) => p);
  let best = [400, 250];
  let bestD = -1;
  for (let x = 90; x <= 710; x += 104)
    for (let y = 60; y <= 440; y += 76) {
      const d = Math.min(...taken.map(([a, b]) => Math.hypot(a - x, (b - y) * 1.6)), 1e9);
      if (d > bestD) [best, bestD] = [[x, y], d];
    }
  return best;
}

function options(select, items, { blank, keep = true } = {}) {
  const prev = select.value;
  select.innerHTML =
    (blank ? `<option value="">${blank}</option>` : "") +
    items.map((i) => (i.group ? `<optgroup label="${i.group}">${i.items.map((v) => `<option>${esc(v)}</option>`).join("")}</optgroup>` : `<option value="${esc(i.value ?? i)}">${esc(i.label ?? i)}</option>`)).join("");
  if (keep && [...select.options].some((o) => o.value === prev)) select.value = prev;
}

function refreshForms() {
  const { classes, individuals, properties } = state.world;
  const pf = $("#add-prop");
  options(pf.domain, classes, { blank: "any" });
  options(pf.range, classes, { blank: "any" });
  options(pf.inverseOf, properties.map((p) => p.id), { blank: "none" });

  const ff = $("#add-fact");
  options(ff.s, [{ group: "Classes", items: classes }, { group: "Individuals", items: individuals }].filter((g) => g.items.length));
  const s = ff.s.value;
  const preds = !s
    ? []
    : isClass(s)
      ? [{ value: "subClassOf", label: "subclass of" }, { value: "disjointWith", label: "disjoint with" }]
      : [{ value: "type", label: "is a" }, ...properties.map((p) => p.id)];
  options(ff.p, preds);
  const p = ff.p.value;
  const objs = ["type", "subClassOf", "disjointWith"].includes(p) ? classes : individuals;
  options(ff.o, objs.filter((o) => o !== s));
}

function renderLists() {
  const { world } = state;
  $("#stated").innerHTML =
    world.facts.map((f, i) => `<li><span>${esc(describe(f))}</span><button class="x" data-del-fact="${i}" title="Remove">${X_ICON}</button></li>`).join("") ||
    `<li class="empty">No facts yet.</li>`;
  $("#props").innerHTML =
    world.properties
      .map((p, i) => {
        const bits = [p.domain && `from ${p.domain}`, p.range && `to ${p.range}`, p.transitive && "transitive", p.inverseOf && `inverse of ${p.inverseOf}`].filter(Boolean);
        return `<li><span><b>${esc(p.id)}</b> <span class="muted">${esc(bits.join(", ") || "no rules")}</span></span><button class="x" data-del-prop="${i}" title="Remove">${X_ICON}</button></li>`;
      })
      .join("") || `<li class="empty">None yet.</li>`;

  $("#selection").innerHTML = state.selected
    ? `<span>Selected <b>${esc(state.selected)}</b> (${isClass(state.selected) ? "class" : "individual"})</span><button class="btn btn-sm btn-danger" id="del-node">Delete</button>`
    : "";
  $("#del-node")?.addEventListener("click", () => deleteNode(state.selected));
}

function renderInsights() {
  const inferred = [...result.facts.entries()].filter(([, f]) => f.inferred);
  const box = $("#sub-inferred");
  if (!state.showInferred) {
    box.innerHTML = `<div class="empty-state"><b>Reasoner idle</b>Run the reasoner to see what it can derive from your rules.</div>`;
  } else if (!inferred.length) {
    box.innerHTML = `<div class="empty-state"><b>Nothing to infer yet</b>Try a subclass chain, or a property with a domain.</div>`;
  } else {
    box.innerHTML =
      `<p>Select a fact to trace how the reasoner derived it.</p><ul class="facts inferred">` +
      inferred
        .map(([k, f]) => {
          const open = state.highlight?.key === k;
          return `<li class="${open ? "open" : ""}" data-explain="${esc(k)}"><span class="rule">${f.rule}</span>${esc(describe(f))}${
            open ? `<ol class="why">${explain(result, [k]).map((s) => `<li class="${s.inferred ? "inf" : ""}">${esc(s.inferred ? s.because : describe(s) + " (stated)")}</li>`).join("")}</ol>` : ""
          }</li>`;
        })
        .join("") +
      `</ul>`;
  }

  const probs = result.contradictions;
  $("#problem-count").textContent = probs.length ? probs.length : "";
  $("#sub-problems").innerHTML = probs.length
    ? probs.map((c) => `<div class="problem">${ALERT_ICON}<span>${esc(c.because)}</span></div>`).join("")
    : `<div class="empty-state"><b>No issues</b>Mark two classes as disjoint, then put one individual in both.</div>`;
  $("#turtle").textContent = toTurtle(state.world);

  const msg = $("#reason-msg");
  $("#reason-btn").innerHTML = state.showInferred ? "Hide inferences" : `${PLAY_ICON}Run reasoner`;
  msg.textContent = state.showInferred
    ? `The reasoner found ${inferred.length} new fact${inferred.length === 1 ? "" : "s"}${probs.length ? ` and ${probs.length} contradiction${probs.length === 1 ? "" : "s"}` : ""}.`
    : "Inferred facts appear as dashed amber edges.";
  msg.className = "status" + (state.showInferred ? (probs.length ? " err" : " ok") : "");
}

function checkMissions() {
  let changed = false;
  for (const m of missions) {
    if (progress.missions.includes(m.id) || !m.done(state.world, result, state.showInferred)) continue;
    progress.missions.push(m.id);
    changed = true;
    toast("Mission complete", `${m.title} · +${MISSION_POINTS} pts`, { kind: "mission" });
  }
  if (changed) saveProgress();
  if (progress.missions.length === missions.length) award("architect");
  if (state.showInferred && result.contradictions.length) award("hunter");
}

function renderMissions() {
  const done = progress.missions.length;
  const current = missions.find((m) => !progress.missions.includes(m.id));
  const blank = !state.world.classes.length && !state.world.individuals.length;
  $("#sub-missions").innerHTML = `
    <div class="mission-head">
      <div><b>${done === missions.length ? "All missions complete" : "Your first ontology in 6 steps"}</b><span class="muted small">${done}/${missions.length} complete · ${MISSION_POINTS} pts each</span></div>
      <div class="bar"><span style="width:${(done / missions.length) * 100}%"></span></div>
    </div>
    ${current && !blank && done === 0 ? `<button class="btn btn-sm wide" data-preset-go="empty">Start on a blank canvas</button>` : ""}
    <ol class="missions">${missions
      .map((m, i) => {
        const isDone = progress.missions.includes(m.id);
        const isCurrent = m === current;
        return `<li class="${isDone ? "done" : isCurrent ? "current" : "todo"}">
          <span class="m-num">${isDone ? `<svg viewBox="0 0 16 16" width="11" height="11"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>` : i + 1}</span>
          <div><div class="m-title">${m.title}</div>
          ${isCurrent ? `<div class="m-task">${esc(m.task)}</div>` : ""}
          ${isDone ? `<div class="m-why">${esc(m.why)}</div>` : ""}</div>
        </li>`;
      })
      .join("")}</ol>
    ${done === missions.length ? `<p class="muted small">You've built and broken an ontology. Ready to test yourself? Try the Detective tab.</p>` : ""}`;
}

function update() {
  result = reason(state.world);
  checkMissions();
  if (state.highlight && !result.facts.has(state.highlight.key)) state.highlight = null;
  const model = graphModel(state.world, state.positions, result, {
    showInferred: state.showInferred,
    selected: state.selected,
    highlight: state.highlight ? new Set(explain(result, [state.highlight.key]).map((f) => f.s + "|" + f.p + "|" + f.o)) : null,
  });
  if (fresh) model.edges.forEach((e) => (e.fresh = e.inferred));
  fresh = false;
  graph.render(model);
  refreshForms();
  renderLists();
  renderInsights();
  renderMissions();
  save();
}

function deleteNode(id) {
  const w = state.world;
  w.classes = w.classes.filter((c) => c !== id);
  w.individuals = w.individuals.filter((c) => c !== id);
  w.facts = w.facts.filter((f) => f.s !== id && f.o !== id);
  for (const p of w.properties) {
    if (p.domain === id) delete p.domain;
    if (p.range === id) delete p.range;
  }
  state.selected = null;
  update();
}

export function initSandbox() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (saved?.world) state = { ...saved, showInferred: false, selected: null, highlight: null };
  } catch {}
  if (!state) {
    load("pets");
    $('[data-preset="pets"]').classList.add("active");
  }

  document.querySelectorAll("[data-preset]").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-preset]").forEach((x) => x.classList.toggle("active", x === b));
      load(b.dataset.preset);
      update();
    }),
  );

  $("#add-node").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = e.target.label;
    const name = input.value.trim();
    if (allNames().includes(name)) {
      input.setCustomValidity(`"${name}" already exists`);
      return input.reportValidity();
    }
    const kind = e.submitter?.value ?? "class";
    state.world[kind === "class" ? "classes" : "individuals"].push(name);
    state.positions[name] = freeSpot();
    input.value = "";
    update();
  });
  $("#add-node").label.addEventListener("input", (e) => e.target.setCustomValidity(""));

  $("#add-prop").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const id = f.pid.value.trim().replace(/\s+/g, "");
    if (allNames().includes(id)) {
      f.pid.setCustomValidity(`"${id}" already exists`);
      return f.pid.reportValidity();
    }
    const p = { id };
    if (f.domain.value) p.domain = f.domain.value;
    if (f.range.value) p.range = f.range.value;
    if (f.inverseOf.value) p.inverseOf = f.inverseOf.value;
    if (f.transitive.checked) p.transitive = true;
    state.world.properties.push(p);
    f.reset();
    update();
  });
  $("#add-prop").pid.addEventListener("input", (e) => e.target.setCustomValidity(""));

  const ff = $("#add-fact");
  ff.s.addEventListener("change", refreshForms);
  ff.p.addEventListener("change", refreshForms);
  ff.addEventListener("submit", (e) => {
    e.preventDefault();
    const fact = { s: ff.s.value, p: ff.p.value, o: ff.o.value };
    if (!fact.s || !fact.p || !fact.o) return;
    if (!state.world.facts.some((f) => f.s === fact.s && f.p === fact.p && f.o === fact.o)) state.world.facts.push(fact);
    update();
  });

  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-preset-go]");
    if (go) return $(`[data-preset="${go.dataset.presetGo}"]`).click();
    const t = e.target.closest("[data-del-fact],[data-del-prop],[data-explain]");
    if (!t) return;
    if (t.dataset.delFact) state.world.facts.splice(+t.dataset.delFact, 1);
    if (t.dataset.delProp) {
      const id = state.world.properties.splice(+t.dataset.delProp, 1)[0].id;
      state.world.facts = state.world.facts.filter((f) => f.p !== id);
      state.world.properties.forEach((p) => p.inverseOf === id && delete p.inverseOf);
    }
    if (t.dataset.explain) state.highlight = state.highlight?.key === t.dataset.explain ? null : { key: t.dataset.explain };
    update();
  });

  $("#reason-btn").addEventListener("click", () => {
    state.showInferred = !state.showInferred;
    if (state.showInferred) award("spark");
    state.highlight = null;
    fresh = state.showInferred;
    update();
  });

  document.querySelectorAll(".subtab").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".subtab, .sub").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      $(`#sub-${b.dataset.sub}`).classList.add("active");
      if (b.dataset.sub === "turtle") award("explorer");
    }),
  );

  update();
}

export function showMissions() {
  $('.subtab[data-sub="missions"]').click();
}

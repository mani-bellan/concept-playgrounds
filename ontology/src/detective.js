// "Ontology Detective": short puzzles where the player predicts what the
// reasoner will conclude, then steps through its reasoning on the graph.
import { reason, explain, describe, key } from "./ontology.js";
import { createGraph, graphModel } from "./graph.js";
import { levels } from "./data.js";

const STORE = "ontology-detective";
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let progress = { solved: {} }; // level index -> points earned
let lv; // current level state

const graph = createGraph($("#detective-graph"), {
  onMove: (id, x, y) => (lv.positions[id] = [x, y]),
});

const score = () => Object.values(progress.solved).reduce((a, b) => a + b, 0);

function propertyRules(p) {
  const rules = [];
  if (p.domain) rules.push(`Only ${/^[AEIOU]/i.test(p.domain) ? "an" : "a"} ${p.domain} can "${p.id}" something`);
  if (p.range) rules.push(`Whatever is "${p.id}" by something is ${/^[AEIOU]/i.test(p.range) ? "an" : "a"} ${p.range}`);
  if (p.transitive) rules.push(`"${p.id}" is transitive: it chains through intermediate steps`);
  if (p.inverseOf) rules.push(`"${p.id}" is the inverse of "${p.inverseOf}"`);
  return rules;
}

function steps() {
  if (!lv.level.contradiction) return explain(lv.result, lv.level.targets);
  const c = lv.result.contradictions[0];
  return [...explain(lv.result, c.from), { contradiction: c }];
}

function renderGraph() {
  const shown = lv.steps.slice(0, lv.revealed);
  const keys = new Set(shown.filter((s) => s.inferred).map(key));
  const current = shown.at(-1);
  const model = graphModel(lv.level.world, lv.positions, lv.result);
  model.edges = model.edges.filter((e) => !e.inferred || keys.has(e.key));
  model.highlight = current && !current.contradiction ? new Set([key(current)]) : null;
  model.edges.forEach((e) => (e.fresh = model.highlight?.has(e.key) && e.inferred));
  model.bad = current?.contradiction ? new Set([current.contradiction.individual]) : new Set();
  graph.render(model);
}

function renderFeedback() {
  const fb = $("#lv-feedback");
  if (lv.answered === null) {
    fb.innerHTML = lv.wrong.size ? `<p class="bad-msg">Not quite. Look at the rules on the left and try again.</p>` : "";
    return;
  }
  const shown = lv.steps.slice(0, lv.revealed);
  const done = lv.revealed >= lv.steps.length;
  const last = lv.index === levels.length - 1;
  const allSolved = levels.every((_, i) => i in progress.solved);
  fb.innerHTML = `
    <p class="good-msg">✔ Correct! +${progress.solved[lv.index]} ★</p>
    <h4>How the reasoner gets there</h4>
    <ol class="why steps">${shown
      .map((s) =>
        s.contradiction
          ? `<li class="contra">⚠ ${esc(s.contradiction.because)}</li>`
          : `<li class="${s.inferred ? "inf" : ""}">${s.inferred ? `<span class="rule">${s.rule}</span>${esc(s.because)}` : `${esc(describe(s))} <span class="muted">(given)</span>`}</li>`,
      )
      .join("")}</ol>
    ${done ? "" : `<button id="next-step" class="reason">${lv.revealed ? "Next step →" : "▶ Show the reasoning"}</button>`}
    ${done ? `<div class="takeaway"><b>Takeaway:</b> ${esc(lv.level.takeaway)}</div>` : ""}
    ${done && !last ? `<button id="next-level" class="primary">Next case →</button>` : ""}
    ${done && last && allSolved ? `<div class="badge">🕵️ All cases closed! You scored ${score()} / ${levels.length * 3} ★. Now try building your own world.</div>` : ""}
  `;
  $("#next-step")?.addEventListener("click", () => {
    lv.revealed++;
    renderGraph();
    renderFeedback();
  });
  $("#next-level")?.addEventListener("click", () => open(lv.index + 1));
}

function renderStrip() {
  $("#level-strip").innerHTML = levels
    .map((l, i) => {
      const pts = progress.solved[i];
      return `<button class="lvl ${i === lv.index ? "active" : ""} ${i in progress.solved ? "solved" : ""}" data-level="${i}">
        <span class="n">${i in progress.solved ? "✓" : i + 1}</span><span>${esc(l.concept)}</span>${pts ? `<span class="stars">${"★".repeat(pts)}</span>` : ""}
      </button>`;
    })
    .join("");
  $("#score").textContent = `★ ${score()}`;
}

function open(index) {
  const level = levels[index];
  lv = {
    index,
    level,
    positions: JSON.parse(JSON.stringify(level.positions)),
    result: reason(level.world),
    answered: null,
    wrong: new Set(),
    revealed: 0,
  };
  lv.steps = steps();

  $("#lv-concept").textContent = `Case ${index + 1} · ${level.concept}`;
  $("#lv-title").textContent = level.title;
  $("#lv-story").textContent = level.story;
  $("#lv-question").textContent = level.question;
  const given = [
    ...level.world.properties.flatMap(propertyRules),
    ...level.world.facts.map(describe),
  ];
  $("#lv-facts").innerHTML = `<li class="head">What we know</li>` + given.map((g) => `<li>${esc(g)}</li>`).join("");
  renderOptions();
  renderStrip();
  renderGraph();
  renderFeedback();
}

function renderOptions() {
  $("#lv-options").innerHTML = lv.level.options
    .map((o, i) => {
      const cls = lv.answered === i ? "right" : lv.wrong.has(i) ? "wrong" : "";
      return `<button class="opt ${cls}" data-opt="${i}" ${lv.answered !== null ? "disabled" : ""}>${esc(o)}</button>`;
    })
    .join("");
}

export function initDetective() {
  try {
    progress = JSON.parse(localStorage.getItem(STORE)) ?? progress;
  } catch {}

  $("#level-strip").addEventListener("click", (e) => {
    const b = e.target.closest("[data-level]");
    if (b) open(+b.dataset.level);
  });

  $("#lv-options").addEventListener("click", (e) => {
    const b = e.target.closest("[data-opt]");
    if (!b || lv.answered !== null) return;
    const i = +b.dataset.opt;
    if (i === lv.level.answer) {
      lv.answered = i;
      if (!(lv.index in progress.solved)) progress.solved[lv.index] = Math.max(1, 3 - lv.wrong.size);
      localStorage.setItem(STORE, JSON.stringify(progress));
    } else {
      lv.wrong.add(i);
    }
    renderOptions();
    renderStrip();
    renderFeedback();
  });

  const firstUnsolved = levels.findIndex((_, i) => !(i in progress.solved));
  open(firstUnsolved === -1 ? 0 : firstUnsolved);
}

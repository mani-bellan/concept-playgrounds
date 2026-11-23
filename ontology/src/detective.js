// "Ontology Detective": short puzzles where the player predicts what the
// reasoner will conclude, then steps through its reasoning on the graph.
import { reason, explain, describe, key } from "./ontology.js";
import { createGraph, graphModel } from "./graph.js";
import { levels } from "./data.js";
import { progress, save, award, casePoints, solvedCount, onChange, formatTime } from "./progress.js";
import { openProfile } from "./profile.js";

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const CHECK = `<svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BULB = `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M6 12.5h4M6.5 14.5h3M8 1.5a4.5 4.5 0 0 0-2.5 8.2V11h5V9.7A4.5 4.5 0 0 0 8 1.5z"/></svg>`;
const KEYS = "ABCD";

let lv; // current level state
const attempts = {}; // level index -> { wrong, hinted }, kept when a case is reopened

const graph = createGraph($("#detective-graph"), {
  onMove: (id, x, y) => (lv.positions[id] = [x, y]),
});

function propertyRules(p) {
  const a = (w) => (/^[AEIOU]/i.test(w) ? "an " : "a ") + w;
  const rules = [];
  if (p.domain) rules.push(`Anything that ${p.id} something is ${a(p.domain)} (domain)`);
  if (p.range) rules.push(`Anything at the receiving end of "${p.id}" is ${a(p.range)} (range)`);
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

const available = () => Math.max(1, 3 - lv.attempt.wrong.size - (lv.attempt.hinted ? 1 : 0));

function renderFeedback() {
  const fb = $("#lv-feedback");
  if (lv.answered === null) {
    fb.innerHTML = `
      ${lv.attempt.wrong.size ? `<div class="banner bad">Not quite. Re-read the known facts and rules, then try again.</div>` : ""}
      ${lv.attempt.hinted
        ? `<div class="hint">${BULB}<span>${esc(lv.level.hint)}</span></div>`
        : `<button id="hint-btn" class="btn btn-ghost btn-sm hint-btn">${BULB}Show a hint <span class="muted">−1 pt</span></button>`}
      <div class="worth mono">Worth ${available()} pt${available() === 1 ? "" : "s"}</div>`;
    $("#hint-btn")?.addEventListener("click", () => {
      lv.attempt.hinted = true;
      renderFeedback();
    });
    return;
  }
  const shown = lv.steps.slice(0, lv.revealed);
  const done = lv.revealed >= lv.steps.length;
  const last = lv.index === levels.length - 1;
  const allSolved = solvedCount() === levels.length;
  const earned = progress.cases[lv.index];
  fb.innerHTML = `
    <div class="banner good">${CHECK} Correct<span class="pts">${lv.firstSolve ? `+${earned} pts` : "already solved"}</span></div>
    <div class="reasoning">
      <div class="pane-title">Reasoner trace</div>
      ${shown.length ? `<ol class="why">${shown
        .map((s) =>
          s.contradiction
            ? `<li class="contra">${esc(s.contradiction.because)}</li>`
            : `<li class="${s.inferred ? "inf" : ""}">${s.inferred ? `<span class="rule">${s.rule}</span>${esc(s.because)}` : `${esc(describe(s))} <span class="muted">· given</span>`}</li>`,
        )
        .join("")}</ol>` : `<p class="muted small">Step through the derivation and watch each inferred edge appear on the graph.</p>`}
    </div>
    ${done ? `<div class="takeaway"><span class="mono label">Takeaway</span>${esc(lv.level.takeaway)}</div>` : ""}
    <div class="actions">
      ${done ? "" : `<button id="next-step" class="btn ${lv.revealed ? "" : "btn-primary"} btn-sm">${lv.revealed ? `Next step <span class="muted mono">${lv.revealed}/${lv.steps.length}</span>` : "Trace the reasoning"}</button>`}
      ${done && !last ? `<button id="next-level" class="btn btn-primary btn-sm">Next case →</button>` : ""}
    </div>
    ${done && allSolved ? `<div class="finale"><b>All cases closed.</b>${casePoints()} of ${levels.length * 3} points${progress.finishedAt && progress.startedAt ? ` in ${formatTime(progress.finishedAt - progress.startedAt)}` : ""}. Show your team how you did.<button id="share-result" class="btn btn-primary btn-sm">Share your result</button></div>` : ""}
  `;
  $("#next-step")?.addEventListener("click", () => {
    lv.revealed++;
    renderGraph();
    renderFeedback();
  });
  $("#next-level")?.addEventListener("click", () => open(lv.index + 1));
  $("#share-result")?.addEventListener("click", () => openProfile());
}

function renderStrip() {
  $("#level-strip").innerHTML = levels
    .map((l, i) => {
      const pts = progress.cases[i];
      const solved = i in progress.cases;
      return `<button class="lvl ${i === lv.index ? "active" : ""}" data-level="${i}">
        <span class="row"><span class="${solved ? "check" : ""}">${solved ? CHECK : ""}CASE 0${i + 1}</span>${solved ? `<span class="pips">${[1, 2, 3].map((n) => `<i class="${n <= pts ? "on" : ""}"></i>`).join("")}</span>` : ""}</span>
        <span class="name">${esc(l.concept)}</span>
      </button>`;
    })
    .join("");
  const strip = $("#level-strip");
  strip.scrollTo({ left: strip.querySelector(".active").offsetLeft - 14 }); // phones scroll the strip sideways
  const solved = solvedCount();
  $("#progress-bar").style.width = `${(solved / levels.length) * 100}%`;
  $("#progress-text").textContent = `${solved}/${levels.length} solved`;
}

function renderOptions() {
  $("#lv-options").innerHTML = lv.level.options
    .map((o, i) => {
      const cls = lv.answered === i ? "right" : lv.attempt.wrong.has(i) ? "wrong" : "";
      return `<button class="opt ${cls}" data-opt="${i}" ${lv.answered !== null ? "disabled" : ""}><kbd>${KEYS[i]}</kbd>${esc(o)}</button>`;
    })
    .join("");
}

function open(index) {
  const level = levels[index];
  lv = {
    index,
    level,
    positions: JSON.parse(JSON.stringify(level.positions)),
    result: reason(level.world),
    answered: null,
    revealed: 0,
  };
  lv.attempt = attempts[index] ??= { wrong: new Set(), hinted: false };
  lv.steps = steps();

  $("#lv-concept").textContent = `Case 0${index + 1} · ${level.concept}`;
  $("#lv-title").textContent = level.title;
  $("#lv-story").textContent = level.story;
  $("#lv-primer").textContent = level.primer;
  $("#lv-question").textContent = level.question;
  $("#lv-facts").innerHTML = [...level.world.properties.flatMap(propertyRules), ...level.world.facts.map(describe)]
    .map((g) => `<li>${esc(g)}</li>`)
    .join("");
  renderOptions();
  renderStrip();
  renderGraph();
  renderFeedback();
}

function answer(i) {
  if (lv.answered !== null || lv.attempt.wrong.has(i)) return;
  progress.startedAt ??= Date.now();
  if (i !== lv.level.answer) {
    lv.attempt.wrong.add(i);
  } else {
    lv.answered = i;
    lv.firstSolve = !(lv.index in progress.cases);
    if (lv.firstSolve) progress.cases[lv.index] = available();
    if (solvedCount() === levels.length) progress.finishedAt ??= Date.now();
    save();
    award("cracker");
    if (solvedCount() === levels.length) {
      award("detective");
      if (casePoints() === levels.length * 3) award("flawless");
      if (progress.finishedAt - progress.startedAt <= 4 * 60 * 1000) award("speed");
    }
  }
  renderOptions();
  renderStrip();
  renderFeedback();
}

export function initDetective() {
  $("#level-strip").addEventListener("click", (e) => {
    const b = e.target.closest("[data-level]");
    if (b) open(+b.dataset.level);
  });
  $("#lv-options").addEventListener("click", (e) => {
    const b = e.target.closest("[data-opt]");
    if (b) answer(+b.dataset.opt);
  });
  document.addEventListener("keydown", (e) => {
    if (!$("#view-detective").classList.contains("active") || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector("dialog[open]")) return;
    const i = KEYS.indexOf(e.key.toUpperCase());
    if (i >= 0 && i < lv.level.options.length) answer(i);
    else if (e.key === "Enter" && !e.target.closest("input, select, #lv-options, #lv-feedback, #level-strip")) ($("#next-step") ?? $("#next-level"))?.click();
  });
  // A progress reset from the profile panel starts the cases over.
  onChange(() => {
    if (!solvedCount() && lv?.answered !== null) open(0);
    else renderStrip();
  });

  const firstUnsolved = levels.findIndex((_, i) => !(i in progress.cases));
  open(firstUnsolved === -1 ? 0 : firstUnsolved);
}

export { open as openCase };

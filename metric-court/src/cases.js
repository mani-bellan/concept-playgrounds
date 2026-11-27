// The Cases tab: a case list and the case court (guess, switches, rows, gap, verdict).
import { cases } from "./data.js";
import { chapters } from "./chapters.js";
import { measure, excludedBy, sameRecipe, formatter } from "./metrics.js";
import { progress, closeCase, onChange } from "./progress.js";
import { guessBlock, tick } from "./ui.js";

const $ = (sel) => document.querySelector(sel);
const root = () => $("#view-cases");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function renderCases() {
  const done = Object.keys(progress.cases).length;
  root().innerHTML = `
    <div class="page-head">
      <p class="kicker">Cases</p>
      <h1 class="h1-sm">Eight number disputes. <span class="hi">Settle them all.</span></h1>
      <p class="lede">Make your call, then prove it by flipping the recipe until your number matches. ${done} of ${cases.length} closed.</p>
    </div>
    <div class="case-grid">${cases
      .map((c) => {
        const p = progress.cases[c.id];
        return `<a class="case-card${p ? " closed" : ""}" href="#cases/${c.id}">
          <span class="case-no num">${c.id}</span>
          <strong>${c.title}</strong>
          <span class="case-ch">${chapters[c.chapter - 1].title}</span>
          <span class="case-st">${p ? `<span class="pill ok">Closed · ${p.points} pts</span>` : '<span class="pill">Open</span>'}</span>
        </a>`;
      })
      .join("")}</div>`;
}

let state;

export function openCase(id) {
  const c = cases.find((x) => x.id === id);
  if (!c) return renderCases();
  const fmt = formatter(c.unit);
  const rowFmt = formatter(c.rowUnit || c.unit);
  const claims = Object.fromEntries(c.teams.map((t) => [t.key, measure(c, t.recipe)]));
  const done = progress.cases[c.id];
  state = { c, fmt, rowFmt, claims, recipe: { ...c.start }, lit: null, matched: new Set(done ? c.target : []), guessed: !!done, rightFirst: null, hints: 0, shown: measure(c, c.start), slam: false };
  const i = cases.indexOf(c);
  const q = c.question.replace(/\{(\w+)\}/g, (_, k) => `<span class="num-hi">${fmt(claims[k])}</span>`);

  root().innerHTML = `
    <a class="back" href="#cases">← All cases</a>
    <section class="scene case">
      <div class="scene-head">
        <span class="tag">Case ${c.id} · ${c.title}</span>
        <h2>${q}</h2>
      </div>
      ${c.chat ? chatHtml(c, fmt, claims) : ""}
      <div class="guess" id="case-guess"></div>
      <div class="hint-row"><button class="link-btn" id="hint-btn">Need a hint? (costs 1 point)</button><p class="hint" id="hint" hidden>${c.hint}</p></div>
      <div class="boards" id="case-boards" style="--n:${c.teams.length + 1}"></div>
      <div class="court">
        <div class="switches" id="switches"></div>
        <div>
          <p class="small-label">${c.rowsLabel}</p>
          <div class="rows" id="rows"></div>
        </div>
      </div>
      <div class="gap" id="gap"></div>
      <div class="verdict" id="verdict" aria-live="polite"></div>
      <div class="lesson" id="lesson" hidden></div>
      <details class="sql"><summary>Show the SQL</summary><pre id="sql"></pre></details>
      <div class="case-nav">
        ${i > 0 ? `<a class="btn ghost" href="#cases/${cases[i - 1].id}">← Case ${cases[i - 1].id}</a>` : "<span></span>"}
        ${i < cases.length - 1 ? `<a class="btn ghost" href="#cases/${cases[i + 1].id}">Case ${cases[i + 1].id} →</a>` : '<a class="btn ghost" href="#build">Build a metric →</a>'}
      </div>
    </section>`;

  guessBlock($("#case-guess"), "Make your call first.", c.options, c.answer, c.explain, (right) => {
    state.guessed = true;
    state.rightFirst = right;
    renderCourt();
  }, done ? c.answer : null);
  $("#hint-btn").onclick = () => {
    if ($("#hint").hidden && !done) state.hints = 1;
    $("#hint").hidden = false;
    $("#hint-btn").hidden = true;
  };
  $("#view-cases .case").onclick = (e) => {
    const t = e.target.closest(".toggle");
    if (t) {
      const k = t.dataset.k;
      state.recipe[k] = !state.recipe[k];
      state.lit = c.rows.some((r) => r.out?.some((o) => o.replace("!", "") === k)) ? k : null;
      return renderCourt(`.toggle[data-k="${k}"]`);
    }
    const s = e.target.closest("[data-seg]");
    if (s) {
      state.lit = state.lit === s.dataset.seg ? null : s.dataset.seg;
      renderCourt(`#gap [data-seg="${s.dataset.seg}"]`);
    }
  };
  renderCourt();
}

function chatHtml(c, fmt, claims) {
  return `<div class="chat">
    <div class="msg me">What was our revenue in March?</div>
    <div class="msg bot"><span class="bot-name">AI assistant</span>March revenue was <b class="num">${fmt(claims.ai)}</b>. I summed the amount column in the orders table for all of March.</div>
    <div id="chat-after"></div>
  </div>`;
}

function renderCourt(focusSel) {
  const { c, fmt, rowFmt, claims } = state;
  const value = measure(c, state.recipe);
  // A team is matched when your recipe is theirs.
  c.teams.forEach((t) => sameRecipe(state.recipe, t.recipe) && c.target.includes(t.key) && state.matched.add(t.key));
  const solved = c.target.every((k) => state.matched.has(k));
  const already = progress.cases[c.id];
  if (solved && !already && state.guessed) {
    closeCase(c.id, state.rightFirst, state.hints);
    state.slam = true;
  }
  const closed = solved || already;
  const current = c.teams.find((t) => sameRecipe(state.recipe, t.recipe));

  $("#case-boards").innerHTML =
    c.teams
      .map((t) => `<div class="board${state.matched.has(t.key) ? " matched" : ""}"><div class="lab">${t.label}${state.matched.has(t.key) ? ' <span class="tick">✓</span>' : ""}</div><div class="val num">${fmt(claims[t.key])}</div></div>`)
      .join("") +
    `<div class="board you${current && c.target.includes(current.key) ? " ok" : ""}"><div class="lab">Your recipe</div><div class="val num" id="yours">${fmt(state.shown)}</div><div class="sub">${current ? `Same as ${current.label}` : "Matches no team yet"}</div></div>`;

  $("#switches").innerHTML =
    `<p class="small-label">Your recipe</p>` +
    c.switches.map((s) => `<button class="toggle" data-k="${s.key}" aria-pressed="${!!state.recipe[s.key]}"><span>${s.label}</span><span class="k">${state.recipe[s.key] ? "ON" : "OFF"}</span></button>`).join("") +
    (c.target.length > 1 ? `<p class="match-list">${c.target.map((k) => `<span class="${state.matched.has(k) ? "done" : ""}">${state.matched.has(k) ? "✓" : "○"} ${c.teams.find((t) => t.key === k).label}</span>`).join("")}</p>` : "");

  $("#rows").innerHTML = c.rows
    .map((r) => {
      const out = excludedBy(r, state.recipe);
      const lit = state.lit && r.out?.some((o) => o.replace("!", "") === state.lit);
      const hit = r.hit && !out;
      return `<div class="row${out ? " out" : ""}${lit ? " lit" : ""}${hit ? " hit" : ""}">${out ? '<span class="st">OUT</span>' : hit ? `<span class="st hit">${c.hitLabel}</span>` : ""}<div class="id">${r.id}${r.group ? ` · ${r.group}` : ""}</div><div class="amt">${c.unit === "count" && r.value === 1 ? "" : rowFmt(r.value)}${c.rowSuffix || ""}</div><div class="note">${r.note || ""}</div></div>`;
    })
    .join("");

  $("#gap").innerHTML = gapHtml();
  $("#verdict").innerHTML = closed
    ? `<span class="stamp${state.slam ? " slam" : ""}">${c.verdict[0]}</span><span>${c.verdict[1]}</span>`
    : `<span class="hint-text">${state.guessed ? (c.target.length > 1 ? "Match every team's number, one at a time." : `Flip the switches until your number matches ${c.teams.find((t) => t.key === c.target[0]).label}.`) : "Make your call first, then prove it."}</span>`;
  state.slam = false;
  const lesson = $("#lesson");
  lesson.hidden = !closed;
  lesson.innerHTML = `<strong>What this case teaches</strong><p>${c.lesson}</p><a href="#course/${c.chapter}">Read chapter ${c.chapter}: ${chapters[c.chapter - 1].title}</a>`;
  $("#sql").innerHTML = c
    .sql(state.recipe)
    .filter(Boolean)
    .map((l) => (l.startsWith("+") ? `<span class="add">${esc(l.slice(1))}</span>` : esc(l).replace(/(--.*)$/, '<span class="cmt">$1</span>')))
    .join("\n");

  if (c.chat)
    $("#chat-after").innerHTML = state.recipe.metric
      ? `<div class="msg me">Use the revenue metric from the semantic layer.</div><div class="msg bot good"><span class="bot-name">AI assistant</span>Using the shared <b>revenue</b> metric, March revenue was <b class="num">${fmt(value)}</b>. It leaves out refunds and test orders and counts dates in company time.</div>`
      : "";
  tick($("#yours"), state.shown, value, fmt);
  state.shown = value;
  document.querySelectorAll("#switches .toggle").forEach((b) => (b.disabled = !state.guessed));
  if (focusSel) document.querySelector(focusSel)?.focus();
}

// The gap between the first team and the target, split by switch (sum metrics only).
function gapHtml() {
  const { c, fmt, claims } = state;
  if (c.metric !== "sum" || c.teams.length !== 2) return "";
  const [a, b] = c.teams;
  const segs = c.switches
    .map((s) => ({ ...s, amount: c.rows.filter((r) => r.out?.some((o) => o.replace("!", "") === s.key)).reduce((n, r) => n + r.value, 0) }))
    .filter((s) => s.amount);
  const low = Math.min(claims[a.key], claims[b.key]);
  const diff = Math.abs(claims[a.key] - claims[b.key]);
  const sign = claims[b.key] < claims[a.key] ? "−" : "+";
  return `<div class="gap-head"><span>Where the ${fmt(diff)} gap comes from</span><span class="num">${fmt(claims[a.key])} → ${fmt(claims[b.key])}</span></div>
    <div class="bridge"><div class="bar base" style="flex:${low}"></div>${segs.map((s) => `<button class="bar${state.lit === s.key ? " on" : ""}" data-seg="${s.key}" style="flex:${s.amount}" aria-label="${s.short}"></button>`).join("")}</div>
    <div class="legend"><span class="base"><i></i>Both count ${fmt(low)}</span>${segs.map((s) => `<button class="${state.lit === s.key ? "on" : ""}" data-seg="${s.key}" aria-pressed="${state.lit === s.key}"><i></i>${s.short} ${sign}${fmt(s.amount)}</button>`).join("")}</div>`;
}

onChange(() => {
  if (location.hash === "#cases") renderCases();
});

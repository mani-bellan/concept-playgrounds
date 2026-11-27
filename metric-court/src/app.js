import { party, case01 } from "./data.js";
import { countGuest, partyCount, excludedBy, revenue, sameRecipe, moneyFormatter } from "./metrics.js";

const $ = (sel) => document.querySelector(sel);
const money = moneyFormatter();
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

$("#theme-btn").addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("mc-theme", theme);
});

// Animate a number in place so learners see it move.
function tick(el, from, to, fmt) {
  if (reduced || from === to) return void (el.textContent = fmt(to));
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / 450);
    el.textContent = fmt(from + (to - from) * (1 - (1 - p) ** 3));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function guessBlock(root, prompt, options, answer, explain, onDone) {
  root.innerHTML = `<p>${prompt}</p><div class="options">${options.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join("")}</div>`;
  root.addEventListener("click", (e) => {
    const b = e.target.closest(".opt");
    if (!b || b.disabled) return;
    const i = Number(b.dataset.i);
    root.querySelectorAll(".opt").forEach((o, j) => {
      o.disabled = true;
      if (j === answer) o.classList.add("right");
      else if (j === i) o.classList.add("wrong");
    });
    root.insertAdjacentHTML("beforeend", `<div class="feedback">${i === answer ? "<b>Right.</b> " : '<b class="no">Not quite.</b> '}${explain}</div>`);
    onDone();
  });
}

/* Warm-up: the party */
const who = ["caterer", "host", "photographer"];
const P = party.counters;
$("#party-boards").innerHTML = who
  .map((w) => `<div class="board"><div class="lab">${P[w].label}</div><div class="val num">${party.claims[w]}</div><div class="sub">${P[w].says}</div></div>`)
  .join("");

let lens = "caterer";
function renderParty() {
  const n = partyCount(party.guests, lens);
  $("#party-lenses").innerHTML = who
    .map((w) => `<button class="lens" role="tab" data-w="${w}" aria-selected="${w === lens}">${P[w].label}</button>`)
    .join("");
  $("#party-note").innerHTML = `<b>${P[lens].label} counts ${n}.</b> ${P[lens].lesson}`;
  $("#party-guests").innerHTML = party.guests
    .map((g) => {
      const c = countGuest(g, lens);
      const why = !g.came ? "didn't come" : !g.rsvp ? "walk-in" : g.leftEarly ? "left early" : g.seconds ? "had seconds" : "";
      return `<div class="guest ${c ? "counted" : "skipped"}">${g.name}${c === 2 ? '<span class="x2">×2</span>' : ""}<span class="why">${why || "&nbsp;"}</span></div>`;
    })
    .join("");
  $("#party-legend").innerHTML = `<span class="on"><i></i>Counted by ${P[lens].label.toLowerCase()}</span><span class="base"><i></i>Not counted</span>`;
}
$("#party-lenses").addEventListener("click", (e) => {
  const b = e.target.closest(".lens");
  if (!b) return;
  lens = b.dataset.w;
  renderParty();
  $(`.lens[data-w="${lens}"]`).focus();
});
$("#four").innerHTML = [
  ["What do we count?", "Sam counted RSVPs, which are promises, not people who came."],
  ["Counted at what level?", "The caterer counted plates, so second helpings count twice."],
  ["Over what period?", "The photographer counted only who was there at 9 PM."],
  ["What's left out?", "Sam's list left out the two walk-ins who never replied."],
]
  .map(([q, a]) => `<li><strong>${q}</strong>${a}</li>`)
  .join("");
guessBlock(
  $("#party-guess"),
  "Who is right?",
  ["The caterer", "Sam", "The photographer", "All three"],
  3,
  "Each of them counted something different. Pick a person below to see exactly who they counted.",
  () => {
    $("#party-reveal").hidden = false;
    renderParty();
  },
);

/* Case 01: March revenue */
const C = case01;
const sales = revenue(C.orders, C.recipes.sales);
const finance = revenue(C.orders, C.recipes.finance);
$("#case-q").innerHTML = `Sales says March revenue was <span class="num">${money(sales)}</span>. Finance says <span class="num">${money(finance)}</span>. Same 12 orders. Who is right?`;
guessBlock(
  $("#case-guess"),
  "Make your call first.",
  C.options,
  C.answer,
  "Neither team made a mistake. They follow different recipes. Flip the switches below to turn the Sales number into the Finance number.",
  () => {},
);

const state = { recipe: { ...C.recipes.sales }, lit: null };
let shown = sales;
let wasSolved = false;

function renderCase(focusSel) {
  const yours = revenue(C.orders, state.recipe);
  const solved = sameRecipe(state.recipe, C.recipes.finance);
  const slam = solved && !wasSolved;
  const segs = C.switches.map((s) => ({ ...s, amount: C.orders.filter((o) => o.kind === s.key).reduce((n, o) => n + o.amount, 0) }));

  $("#case-boards").innerHTML = `
    <div class="board"><div class="lab">Sales dashboard</div><div class="val num">${money(sales)}</div></div>
    <div class="board"><div class="lab">Finance dashboard</div><div class="val num">${money(finance)}</div></div>
    <div class="board you${solved ? " ok" : ""}"><div class="lab">Your recipe</div><div class="val num" id="yours">${money(shown)}</div></div>`;
  $("#switches").innerHTML =
    `<p class="small-label">Your recipe</p>` +
    C.switches
      .map((s) => `<button class="toggle" data-k="${s.key}" aria-pressed="${state.recipe[s.key]}"><span>${s.label}</span><span class="k">${state.recipe[s.key] ? "ON" : "OFF"}</span></button>`)
      .join("");
  $("#orders").innerHTML = C.orders
    .map((o) => {
      const out = excludedBy(o, state.recipe);
      const lit = o.kind && o.kind === state.lit;
      return `<div class="order${out ? " out" : ""}${lit ? " lit" : ""}"><span class="st">OUT</span><div class="id">${o.id}</div><div class="amt">${money(o.amount)}</div><div class="note">${o.note || ""}</div></div>`;
    })
    .join("");
  $("#gap-title").textContent = `Where the ${money(sales - finance)} gap comes from`;
  $("#gap-range").textContent = `${money(sales)} → ${money(finance)}`;
  $("#bridge").innerHTML =
    `<div class="bar base" style="flex:${finance}"></div>` +
    segs.map((s) => `<button class="bar${state.lit === s.key ? " on" : ""}" data-seg="${s.key}" style="flex:${s.amount}" aria-label="${s.short}"></button>`).join("");
  $("#bridge-legend").innerHTML =
    `<span class="base"><i></i>Both agree ${money(finance)}</span>` +
    segs.map((s) => `<button class="${state.lit === s.key ? "on" : ""}" data-seg="${s.key}" aria-pressed="${state.lit === s.key}"><i></i>${s.short} −${money(s.amount)}</button>`).join("");
  $("#verdict").innerHTML = solved
    ? `<span class="stamp${slam ? " slam" : ""}">REVIEW: BOTH RIGHT</span><span>Same orders, different recipes.</span>`
    : `<span class="hint">Flip the switches until your number matches Finance. Click a slice of the gap to see its orders.</span>`;
  const tz = C.switches.find((s) => s.key === "tz");
  const where = state.recipe.tz
    ? `WHERE DATE_TRUNC('month', <span class="add">${tz.sql}</span>) = '2026-03-01'`
    : `WHERE DATE_TRUNC('month', created_at) = '2026-03-01'  <span class="cmt">-- UTC</span>`;
  $("#sql").innerHTML = [
    "SELECT SUM(amount) AS revenue",
    "FROM orders",
    where,
    ...C.switches.filter((s) => s.key !== "tz" && state.recipe[s.key]).map((s) => `<span class="add">  ${s.sql.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`),
  ].join("\n");

  tick($("#yours"), shown, yours, money);
  shown = yours;
  wasSolved = solved;
  if (focusSel) document.querySelector(focusSel)?.focus();
}

$("#case01").addEventListener("click", (e) => {
  const t = e.target.closest(".toggle");
  if (t) {
    const k = t.dataset.k;
    state.recipe[k] = !state.recipe[k];
    state.lit = k;
    return renderCase(`.toggle[data-k="${k}"]`);
  }
  const s = e.target.closest("[data-seg]");
  if (s) {
    state.lit = state.lit === s.dataset.seg ? null : s.dataset.seg;
    renderCase(`#bridge-legend [data-seg="${s.dataset.seg}"]`);
  }
});
renderCase();

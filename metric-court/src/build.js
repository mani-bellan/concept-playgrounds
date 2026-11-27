// Build a metric: answer the four questions, match Finance, publish, export.
import { build } from "./data.js";
import { buildContribution, buildTotal, toMetricFlow, moneyFormatter } from "./metrics.js";
import { progress, publishBuild } from "./progress.js";
import { tick } from "./ui.js";

const $ = (sel) => document.querySelector(sel);
const money = moneyFormatter();
const finance = build.dashboards.find((d) => d.key === "finance");
// Someone who already published sees their published (Finance) recipe.
let published = progress.built;
let def = { ...(published ? finance.recipe : build.start) };
let shown = buildTotal(build.orders, def);
let tab = "orders";

const matchesFinance = () => Object.keys(finance.recipe).every((k) => Number(def[k]) === Number(finance.recipe[k]));

export function renderBuild() {
  const root = $("#view-build");
  const total = buildTotal(build.orders, def);
  const ok = matchesFinance();
  root.innerHTML = `
    <div class="page-head">
      <p class="kicker">Build a metric</p>
      <h1 class="h1-sm">Write the revenue recipe once. <span class="hi">Watch every dashboard agree.</span></h1>
      <p class="lede">These ten March orders hide every trap from the cases. Answer the four questions to define revenue the way Finance does, then publish it to the semantic layer.</p>
    </div>
    <section class="scene">
      <div class="boards" style="--n:4">${build.dashboards
        .map((d) => {
          const v = published ? total : buildTotal(build.orders, d.recipe);
          return `<div class="board${published ? " matched" : ""}"><div class="lab">${d.label}${published ? ' <span class="tick">✓</span>' : ""}</div><div class="val num" data-dash="${d.key}">${money(v)}</div><div class="sub">${published ? "Reads the shared metric" : "Own SQL"}</div></div>`;
        })
        .join("")}<div class="board you${ok ? " ok" : ""}"><div class="lab">Your definition</div><div class="val num" id="build-yours">${money(shown)}</div><div class="sub">${ok ? "Matches Finance" : "Keep going"}</div></div></div>
      <div class="court build-court">
        <div class="questions">${build.questions.map(questionHtml).join("")}
          <button class="btn publish${published ? " done" : ""}" id="publish" ${ok && !published ? "" : "disabled"}>${published ? "Published to the semantic layer" : "Publish to the semantic layer"}</button>
          ${published ? "" : `<p class="hint-text small">${ok ? "Your recipe matches Finance. Publish it." : "Match Finance's number to publish."}</p>`}
        </div>
        <div>
          <div class="seg" role="tablist">
            <button role="tab" data-tab="orders" aria-selected="${tab === "orders"}">Orders</button>
            <button role="tab" data-tab="yaml" aria-selected="${tab === "yaml"}">Export: dbt MetricFlow</button>
          </div>
          ${tab === "orders" ? ordersHtml() : `<pre class="yaml">${toMetricFlow(def).replace(/</g, "&lt;")}</pre><button class="btn ghost small" id="copy-yaml">Copy YAML</button>`}
        </div>
      </div>
      ${published ? `<div class="verdict"><span class="stamp slam">SEMANTIC LAYER: LIVE</span><span>One definition. Every dashboard shows ${money(total)}.</span></div>
      <div class="lesson"><strong>What just happened</strong><p>Before, each team wrote its own SQL and got its own number. Now they all ask the semantic layer for "revenue" and get the recipe you wrote. If Sales needs gross revenue too, it becomes a second metric with its own name, not a fight.</p><a href="#course/5">Read chapter 5: Agree once</a></div>` : ""}
    </section>`;
  tick($("#build-yours"), shown, total, money);
  shown = total;
  root.querySelector(".scene").onclick = onClick;
}

function questionHtml(q) {
  if (q.checks)
    return `<fieldset class="q"><legend>${q.q}</legend>${q.checks
      .map(([k, label]) => `<button class="toggle" data-check="${k}" aria-pressed="${!!def[k]}"><span>Leave out ${label.toLowerCase()}</span><span class="k">${def[k] ? "YES" : "NO"}</span></button>`)
      .join("")}</fieldset>`;
  return `<fieldset class="q"><legend>${q.q}</legend>${q.options
    .map((o, i) => `<button class="choice" data-key="${q.key}" data-i="${i}" aria-pressed="${def[q.key] === i}">${o}</button>`)
    .join("")}</fieldset>`;
}

function ordersHtml() {
  return `<div class="rows">${build.orders
    .map((o) => {
      const v = buildContribution(o, def);
      const x = def.grain && o.items > 1 && v;
      return `<div class="row${v ? "" : " out"}${x ? " lit" : ""}">${v ? (x ? `<span class="st hit">×${o.items}</span>` : "") : '<span class="st">OUT</span>'}<div class="id">${o.id}</div><div class="amt">${money(o.amount)}</div><div class="note">${o.note || `${o.items} item${o.items > 1 ? "s" : ""}`}</div></div>`;
    })
    .join("")}</div>`;
}

function onClick(e) {
  const t = e.target.closest("[data-tab]");
  if (t) {
    tab = t.dataset.tab;
    return renderBuild();
  }
  if (e.target.closest("#copy-yaml")) return navigator.clipboard?.writeText(toMetricFlow(def));
  if (e.target.closest("#publish")) {
    published = true;
    publishBuild();
    return renderBuild();
  }
  if (published) return;
  const c = e.target.closest("[data-check]");
  const ch = e.target.closest("[data-key]");
  if (c) def[c.dataset.check] = !def[c.dataset.check];
  else if (ch) def[ch.dataset.key] = Number(ch.dataset.i);
  else return;
  renderBuild();
  const sel = c ? `[data-check="${c.dataset.check}"]` : `[data-key="${ch.dataset.key}"][data-i="${ch.dataset.i}"]`;
  $(`#view-build ${sel}`)?.focus();
}


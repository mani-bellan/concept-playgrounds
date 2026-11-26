// The Course tab: a path picker, the chapter list, and each chapter's lesson,
// example, linked missions and cases, and a short quiz.
import { chapters, PATHS } from "./chapters.js";
import { levels, missions } from "./data.js";
import { progress, save, award, onChange, toast, chapterSteps as steps, chapterComplete as complete } from "./progress.js";
import { show, setBack } from "./nav.js";
import { openCase } from "./detective.js";
import { showMissions } from "./sandbox.js";

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const CHECK = `<svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ARROW = `<svg viewBox="0 0 16 16" width="14" height="14"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;

const ISSUE_URL = "https://github.com/mani-bellan/concept-playgrounds/issues/new";

let current = null; // open chapter index, or null for the chapter list
const wrong = {}; // quiz key -> Set of wrong option indexes this session

const path = () => progress.path ?? "everyday";
const qkey = (c, q) => `${c}-${q}`;

function pathSwitch() {
  return `<div class="segmented path-switch" role="group" aria-label="Example style">${Object.entries(PATHS)
    .map(([id, p]) => `<button data-path="${id}" class="${path() === id ? "active" : ""}">${p.name}</button>`)
    .join("")}</div>`;
}

function renderHome() {
  const doneCount = chapters.filter((_, c) => complete(c)).length;
  const next = chapters.findIndex((_, c) => !complete(c));
  const minutes = chapters.reduce((n, c) => n + c.minutes, 0);
  $("#course").innerHTML = `
    <div class="course-head">
      <div>
        <span class="mono label">Course</span>
        <h2>Ontologies in six short chapters</h2>
        <p class="course-sub">About ${minutes} minutes in total. Each chapter: learn one idea, try it hands-on, then check yourself.</p>
      </div>
      <div class="progress"><div class="bar"><span style="width:${(doneCount / chapters.length) * 100}%"></span></div><span class="mono">${doneCount}/${chapters.length} chapters</span></div>
    </div>
    ${progress.path
      ? `<div class="path-row"><span class="muted">Examples</span>${pathSwitch()}</div>`
      : `<div class="picker">
          <div class="picker-q"><span class="mono label">Start here</span><h3>How would you like to learn?</h3><p class="muted">Same ideas either way; only the examples change. You can switch any time.</p></div>
          <div class="picker-options">${Object.entries(PATHS)
            .map(([id, p]) => `<button class="picker-card" data-path="${id}"><span class="picker-icon">${id === "everyday" ? "Aa" : "{ }"}</span><b>${p.name}</b><span>${p.blurb}</span></button>`)
            .join("")}</div>
        </div>`}
    <ol class="chapter-list">${chapters
      .map((ch, c) => {
        const s = steps(c);
        const state = complete(c) ? "done" : c === next ? "next" : s.done ? "started" : "";
        return `<li><button class="chapter-card ${state}" data-chapter="${c}">
          <span class="ch-num mono">${complete(c) ? CHECK : String(c + 1).padStart(2, "0")}</span>
          <span class="ch-body"><b>${esc(ch.title)}</b><span>${esc(ch.summary)}</span></span>
          <span class="ch-meta mono">${state === "next" ? `<span class="up-next">${s.done ? "Continue" : "Up next"}</span>` : ""}${ch.minutes} min · ${s.done}/${s.total}</span>
          ${ARROW}
        </button></li>`;
      })
      .join("")}</ol>
    <p class="course-note">This playground teaches a simplified subset of OWL: classes, subclasses, domain, range, transitive and inverse properties, and disjointness. Real reasoners support much more. Every chapter links its sources; <a href="${ISSUE_URL}" target="_blank" rel="noopener">report anything that looks wrong</a>.</p>
    <p class="course-note">Stuck on a word? See the <a href="#learn" data-goto="learn" data-anchor="jargon">jargon decoder</a>. Finished? Here's <a href="#learn" data-goto="learn" data-anchor="next">where to go next</a>.</p>`;
}

// Display order of quiz options, varied per question so the answer isn't always first.
const order = (c, q, n) => [...Array(n).keys()].map((i) => (i + c + q * 2) % n);

function renderQuiz(c) {
  return chapters[c].quiz
    .map((item, q) => {
      const k = qkey(c, q);
      const answered = k in progress.quiz;
      const tried = wrong[k] ?? new Set();
      return `<div class="quiz-q ${answered ? "answered" : ""}">
        <p><span class="mono">${q + 1}.</span> ${esc(item.q)}</p>
        <div class="quiz-options">${order(c, q, item.options.length)
          .map((o) => {
            const cls = answered && o === item.answer ? "right" : tried.has(o) ? "wrong" : "";
            return `<button class="opt ${cls}" data-quiz="${q}" data-opt="${o}" ${answered ? "disabled" : ""}>${esc(item.options[o])}</button>`;
          })
          .join("")}</div>
        ${answered ? `<div class="quiz-why">${CHECK}<span>${esc(item.why)}${progress.quiz[k] ? ` <span class="pts">+1 pt</span>` : ""}</span></div>` : tried.size ? `<div class="quiz-why bad">Not quite. Try another answer.</div>` : ""}
      </div>`;
    })
    .join("");
}

function renderChapter(c) {
  const ch = chapters[c];
  const ex = ch.example[path()];
  const s = steps(c);
  const missionNums = ch.missions.map((id) => missions.findIndex((m) => m.id === id) + 1);
  const missionsDone = ch.missions.filter((id) => progress.missions.includes(id)).length;
  const tryItems = [
    ...(ch.missions.length
      ? [`<button class="try-item ${missionsDone === ch.missions.length ? "done" : ""}" data-go-missions>
          <span class="try-check">${missionsDone === ch.missions.length ? CHECK : ""}</span>
          <span class="try-body"><b>Guided mission${ch.missions.length > 1 ? `s ${missionNums[0]}–${missionNums.at(-1)}` : ` ${missionNums[0]}`}</b><span>Build it yourself in Build a World · ${missionsDone}/${ch.missions.length}</span></span>${ARROW}
        </button>`]
      : []),
    ...ch.cases.map(
      (i) => `<button class="try-item ${i in progress.cases ? "done" : ""}" data-go-case="${i}">
        <span class="try-check">${i in progress.cases ? CHECK : ""}</span>
        <span class="try-body"><b>Case 0${i + 1}: ${esc(levels[i].title)}</b><span>Predict the reasoner in Detective</span></span>${ARROW}
      </button>`,
    ),
  ];
  $("#course").innerHTML = `
    <div class="chapter-top">
      <button class="btn btn-ghost btn-sm" data-home>← All chapters</button>
      ${pathSwitch()}
    </div>
    <header class="chapter-head">
      <span class="mono label">Chapter 0${c + 1} · ${ch.minutes} min · ${s.done}/${s.total} done</span>
      <h2>${esc(ch.title)}</h2>
    </header>
    <div class="chapter-grid">
      <article class="pane lesson">
        <div class="pane-title">The idea</div>
        ${ch.lesson[path()].map((p) => `<p>${esc(p)}</p>`).join("")}
        <div class="example ${path()}">
          <span class="mono label">Example</span>
          <ul>${ex.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
          <div class="conclusion"><span class="rule">Reasoner</span>${esc(ex.conclusion)}</div>
        </div>
        <div class="sources">
          <span class="mono label">Sources</span>
          ${ch.sources.map((src) => `<a href="${src.url}" target="_blank" rel="noopener">${esc(src.label)}</a>`).join("")}
          <a class="report" href="${ISSUE_URL}?title=${encodeURIComponent(`Content issue: Chapter 0${c + 1} · ${ch.title}`)}" target="_blank" rel="noopener">Spotted a mistake? Report it</a>
        </div>
      </article>
      <div class="chapter-side">
        ${tryItems.length ? `<section class="pane try"><div class="pane-title">Try it</div>${tryItems.join("")}</section>` : ""}
        <section class="pane quiz"><div class="pane-title">Check yourself <span class="muted">${ch.quiz.filter((_, q) => qkey(c, q) in progress.quiz).length}/${ch.quiz.length}</span></div>${renderQuiz(c)}</section>
      </div>
    </div>
    <div class="chapter-nav">
      ${c > 0 ? `<button class="btn btn-sm" data-chapter="${c - 1}">← ${esc(chapters[c - 1].title)}</button>` : "<span></span>"}
      ${c < chapters.length - 1 ? `<button class="btn ${complete(c) ? "btn-primary" : ""} btn-sm" data-chapter="${c + 1}">${esc(chapters[c + 1].title)} →</button>` : complete(c) ? `<button class="btn btn-primary btn-sm" data-goto="sandbox">Build your own world →</button>` : ""}
    </div>`;
}

function render() {
  if (current === null) renderHome();
  else renderChapter(current);
}

function openChapter(c) {
  current = c;
  render();
  window.scrollTo(0, 0);
}

function backTo(c) {
  setBack(`Back to Chapter 0${c + 1} · ${chapters[c].title}`, () => {
    show("course");
    openChapter(c);
  });
}

function answer(c, q, o) {
  const k = qkey(c, q);
  if (k in progress.quiz) return;
  wrong[k] ??= new Set();
  if (o !== chapters[c].quiz[q].answer) {
    wrong[k].add(o);
    return render();
  }
  progress.quiz[k] = wrong[k].size ? 0 : 1;
  save();
  if (complete(c)) toast("Chapter complete", `${chapters[c].title}`, { kind: "mission" });
}

export function initCourse() {
  $("#course").addEventListener("click", (e) => {
    const t = e.target.closest("[data-path], [data-chapter], [data-home], [data-quiz], [data-go-missions], [data-go-case]");
    if (!t) return;
    if (t.dataset.path) {
      progress.path = t.dataset.path;
      save();
    } else if (t.dataset.chapter) openChapter(+t.dataset.chapter);
    else if ("home" in t.dataset) openChapter(null);
    else if (t.dataset.quiz) answer(current, +t.dataset.quiz, +t.dataset.opt);
    else if ("goMissions" in t.dataset) {
      backTo(current);
      show("sandbox");
      showMissions();
    } else if (t.dataset.goCase) {
      backTo(current);
      openCase(+t.dataset.goCase);
      show("detective");
    }
  });
  onChange(() => {
    render();
    if (chapters.every((_, c) => complete(c))) award("graduate");
  });
  render();
}

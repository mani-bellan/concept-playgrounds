// The Course tab: chapter list and one chapter at a time.
import { chapters } from "./chapters.js";
import { cases } from "./data.js";
import { progress, answerQuiz, chapterDone, onChange } from "./progress.js";

const $ = (sel) => document.querySelector(sel);
const root = () => $("#view-course");

export function renderCourse(arg) {
  const n = Number(arg);
  if (n >= 1 && n <= chapters.length) return renderChapter(n - 1);
  root().innerHTML = `
    <div class="page-head">
      <p class="kicker">Course · about ${chapters.reduce((m, c) => m + c.minutes, 0)} minutes</p>
      <h1 class="h1-sm">Four questions every metric answers, <span class="hi">and one way to agree.</span></h1>
      <p class="lede">Each chapter is a short lesson with an everyday example and a data example, the cases that practise it, and a 2-question check.</p>
    </div>
    <ol class="chapter-list">${chapters
      .map((c, i) => `<li><a class="chapter-card${chapterDone(i) ? " done" : ""}" href="#course/${i + 1}">
        <span class="ch-no num">${i + 1}</span>
        <div><strong>${c.title}</strong><span>${c.minutes} min · ${c.cases.length} case${c.cases.length > 1 ? "s" : ""}${c.build ? " · Build a metric" : ""}</span></div>
        <span class="pill${chapterDone(i) ? " ok" : ""}">${chapterDone(i) ? "Done" : "Start"}</span>
      </a></li>`)
      .join("")}</ol>`;
}

function renderChapter(i) {
  const c = chapters[i];
  root().innerHTML = `
    <a class="back" href="#course">← All chapters</a>
    <article class="chapter">
      <p class="kicker">Chapter ${i + 1} of ${chapters.length} · ${c.minutes} min</p>
      <h1 class="h1-sm">${c.title}</h1>
      <p class="lede">${c.lesson}</p>
      <div class="examples">
        <div><span class="small-label">Everyday</span><p>${c.everyday}</p></div>
        <div><span class="small-label">In data</span><p>${c.data}</p></div>
      </div>
      <div class="takeaway"><strong>Takeaway</strong><p>${c.takeaway}</p></div>
      <h2 class="h2">Practise it</h2>
      <div class="practice">${c.cases
        .map((id) => {
          const k = cases.find((x) => x.id === id);
          const p = progress.cases[id];
          return `<a class="case-card mini${p ? " closed" : ""}" href="#cases/${id}"><span class="case-no num">${id}</span><strong>${k.title}</strong><span class="case-st">${p ? '<span class="pill ok">Closed</span>' : '<span class="pill">Open</span>'}</span></a>`;
        })
        .join("")}${c.build ? `<a class="case-card mini${progress.built ? " closed" : ""}" href="#build"><span class="case-no num">★</span><strong>Build a metric</strong><span class="case-st">${progress.built ? '<span class="pill ok">Published</span>' : '<span class="pill">Open</span>'}</span></a>` : ""}</div>
      <h2 class="h2">Check yourself</h2>
      <div class="quiz">${c.quiz.map((q, qi) => quizHtml(i, q, qi)).join("")}</div>
      ${c.sources.length ? `<p class="sources">Sources: ${c.sources.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join(" · ")}</p>` : ""}
      <div class="case-nav">
        ${i > 0 ? `<a class="btn ghost" href="#course/${i}">← Chapter ${i}</a>` : "<span></span>"}
        ${i < chapters.length - 1 ? `<a class="btn" href="#course/${i + 2}">Chapter ${i + 2} →</a>` : '<a class="btn" href="#build">Build a metric →</a>'}
      </div>
    </article>`;
  root().querySelector(".quiz").onclick = (e) => {
    const b = e.target.closest(".opt");
    if (!b || b.disabled) return;
    const qi = Number(b.dataset.q);
    const picked = Number(b.dataset.i);
    answerQuiz(i, qi, picked === c.quiz[qi].answer);
    b.closest(".quiz-q").outerHTML = quizHtml(i, c.quiz[qi], qi, picked);
  };
}

function quizHtml(ch, q, qi, picked = null) {
  const done = `${ch}-${qi}` in progress.quiz;
  const show = picked ?? (done ? q.answer : null);
  return `<div class="quiz-q"><p class="guess-q">${qi + 1}. ${q.q}</p><div class="options">${q.options
    .map((o, i) => `<button class="opt${show === null ? "" : i === q.answer ? " right" : i === show ? " wrong" : ""}" data-q="${qi}" data-i="${i}"${show === null ? "" : " disabled"}>${o}</button>`)
    .join("")}</div></div>`;
}

onChange(() => {
  if (location.hash === "#course") renderCourse();
});

// Progress shared by every view: cases, chapter checks, Build a metric, badges.
// Stored in localStorage only; nothing is sent anywhere.
import { cases } from "./data.js";
import { chapters, QUIZ_COUNT } from "./chapters.js";

const KEY = "metric-court-v1";
const fresh = () => ({ party: false, cases: {}, quiz: {}, built: false, badges: [] });

export const BUILD_POINTS = 3;
export const MAX_SCORE = cases.length * 3 + QUIZ_COUNT + BUILD_POINTS;

const icon = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

export const BADGES = [
  { id: "party", name: "Party Planner", desc: "Finish the party warm-up.", icon: icon('<path d="M4 20 9 7l8 8z"/><path d="M14 4v2M19 9h2M17.5 5.5 16 7"/>') },
  { id: "first", name: "First Verdict", desc: "Close your first case.", icon: icon('<path d="m14 4 6 6M4 20l8-8M11 7l6 6M9 9l6-6 6 6-6 6z"/>') },
  { id: "fanout", name: "Fan-out Finder", desc: "Close the join case (02).", icon: icon('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 12h7M8 11l8-4M8 13l8 4"/>') },
  { id: "diplomat", name: "Definition Diplomat", desc: "Match all three teams in the active users case (03).", icon: icon('<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 5-5s5 2 5 5M11 20c0-3 2.5-5 5-5s5 2 5 5"/>') },
  { id: "time", name: "Timekeeper", desc: "Close both time cases (04 and 07).", icon: icon('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>') },
  { id: "clean", name: "Clean Sheet", desc: "Close all eight cases with a right first call and no hints.", icon: icon('<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18"/>') },
  { id: "chief", name: "Chief Justice", desc: "Close all eight cases.", icon: icon('<path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8"/>') },
  { id: "architect", name: "Metric Architect", desc: "Publish Finance's revenue recipe in Build a metric.", icon: icon('<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>') },
  { id: "graduate", name: "Graduate", desc: "Complete all five chapters.", icon: icon('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/>') },
];

function load() {
  try {
    return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return fresh();
  }
}

export const progress = typeof localStorage === "undefined" ? fresh() : load();
const listeners = new Set();
export const onChange = (fn) => listeners.add(fn);

function save() {
  localStorage.setItem(KEY, JSON.stringify(progress));
  listeners.forEach((fn) => fn());
}

// Points for one case: 3 for a right first call, 1 for a wrong one, minus 1 per hint, at least 1.
export const casePoints = (rightFirst, hints) => Math.max(1, (rightFirst ? 3 : 1) - hints);

export const score = () =>
  Object.values(progress.cases).reduce((n, c) => n + c.points, 0) +
  Object.values(progress.quiz).reduce((a, b) => a + b, 0) +
  (progress.built ? BUILD_POINTS : 0);
export const casesClosed = () => Object.keys(progress.cases).length;

export function chapterDone(i) {
  const ch = chapters[i];
  return ch.cases.every((id) => id in progress.cases) && ch.quiz.every((_, q) => `${i}-${q}` in progress.quiz) && (!ch.build || progress.built);
}
export const chaptersDone = () => chapters.filter((_, i) => chapterDone(i)).length;

export function closeCase(id, rightFirst, hints) {
  if (id in progress.cases) return;
  progress.cases[id] = { points: casePoints(rightFirst, hints), clean: rightFirst && hints === 0 };
  save();
  award("first");
  if (id === "02") award("fanout");
  if (id === "03") award("diplomat");
  if ("04" in progress.cases && "07" in progress.cases) award("time");
  if (casesClosed() === cases.length) {
    award("chief");
    if (Object.values(progress.cases).every((c) => c.clean)) award("clean");
  }
  checkGraduate();
}

export function answerQuiz(chapter, q, right) {
  const k = `${chapter}-${q}`;
  if (k in progress.quiz) return;
  progress.quiz[k] = right ? 1 : 0;
  save();
  checkGraduate();
}

export function finishParty() {
  if (progress.party) return;
  progress.party = true;
  save();
  award("party");
}

export function publishBuild() {
  if (progress.built) return;
  progress.built = true;
  save();
  award("architect");
  checkGraduate();
}

function checkGraduate() {
  if (chaptersDone() === chapters.length) award("graduate");
}

export function award(id) {
  if (progress.badges.includes(id)) return;
  progress.badges.push(id);
  save();
  const b = BADGES.find((b) => b.id === id);
  toast("Badge unlocked", b.name, b.icon);
}

export function resetProgress() {
  Object.assign(progress, fresh());
  save();
}

export function toast(title, body, iconSvg = "") {
  let box = document.querySelector("#toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    box.setAttribute("aria-live", "polite");
    document.body.append(box);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `${iconSvg ? `<span class="toast-icon">${iconSvg}</span>` : ""}<div><div class="toast-title">${title}</div><div class="toast-body">${body}</div></div>`;
  box.append(el);
  while (box.children.length > 3) box.firstElementChild.remove();
  setTimeout(() => el.classList.add("out"), 3600);
  setTimeout(() => el.remove(), 4000);
}

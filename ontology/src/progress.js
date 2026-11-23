// Player progress shared by every view: Detective cases, sandbox missions,
// badges, and timing. Stored in localStorage; listeners re-render on change.

const KEY = "ontology-progress-v2";
const fresh = () => ({ cases: {}, missions: [], badges: [], startedAt: null, finishedAt: null });

export const CASE_COUNT = 6;
export const MISSION_POINTS = 2;
export const MAX_SCORE = CASE_COUNT * 3 + 6 * MISSION_POINTS;

const icon = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

export const BADGES = [
  { id: "spark", name: "First Spark", desc: "Run the reasoner for the first time.", icon: icon('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>') },
  { id: "cracker", name: "Case Cracker", desc: "Solve your first Detective case.", icon: icon('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>') },
  { id: "explorer", name: "Under the Hood", desc: "Open the OWL view of your world.", icon: icon('<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>') },
  { id: "hunter", name: "Contradiction Hunter", desc: "Make the reasoner find a contradiction.", icon: icon('<path d="M12 3 2.5 20h19z"/><path d="M12 10v4M12 17v.5"/>') },
  { id: "architect", name: "Architect", desc: "Complete all six guided missions.", icon: icon('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/>') },
  { id: "detective", name: "Chief Detective", desc: "Solve all six Detective cases.", icon: icon('<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>') },
  { id: "flawless", name: "Flawless", desc: "Solve every case first try, without hints.", icon: icon('<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 18 3-18"/>') },
  { id: "speed", name: "Speedrunner", desc: "Solve all six cases within 4 minutes.", icon: icon('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>') },
];

function load() {
  try {
    return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return fresh();
  }
}

export const progress = load();
const listeners = new Set();

export const onChange = (fn) => listeners.add(fn);

export function save() {
  localStorage.setItem(KEY, JSON.stringify(progress));
  listeners.forEach((fn) => fn());
}

export const casePoints = () => Object.values(progress.cases).reduce((a, b) => a + b, 0);
export const score = () => casePoints() + progress.missions.length * MISSION_POINTS;
export const solvedCount = () => Object.keys(progress.cases).length;

export function award(id) {
  if (progress.badges.includes(id)) return;
  progress.badges.push(id);
  save();
  const b = BADGES.find((b) => b.id === id);
  toast("Badge unlocked", b.name, { icon: b.icon, kind: "badge" });
}

export function resetProgress() {
  Object.assign(progress, fresh());
  save();
}

export function formatTime(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function toast(title, body, { icon = "", kind = "" } = {}) {
  let box = document.querySelector("#toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    document.body.append(box);
  }
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = `${icon ? `<span class="toast-icon">${icon}</span>` : ""}<div><div class="toast-title">${title}</div><div class="toast-body">${body}</div></div>`;
  box.append(el);
  while (box.children.length > 3) box.firstElementChild.remove();
  setTimeout(() => el.classList.add("out"), 3600);
  setTimeout(() => el.remove(), 4000);
}

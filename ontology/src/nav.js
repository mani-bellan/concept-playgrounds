// Switching views, plus the "Back to chapter" bar shown after a chapter sends
// the learner to Build a World or Detective.
const $ = (sel) => document.querySelector(sel);
let back = null; // { label, go }

export function show(tab) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${tab}`));
  history.replaceState(null, "", `#${tab}`);
  window.scrollTo(0, 0);
  const bar = $("#back-bar");
  bar.hidden = !back || !["sandbox", "detective"].includes(tab);
  if (back) bar.querySelector("span").textContent = back.label;
}

export function setBack(label, go) {
  back = { label, go };
}

export function initNav() {
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab], [data-goto]");
    if (!t) return;
    if (t.tagName === "A") e.preventDefault();
    show(t.dataset.tab ?? t.dataset.goto);
    if (t.dataset.anchor) document.getElementById(t.dataset.anchor)?.scrollIntoView();
  });
  $("#back-bar").addEventListener("click", () => back?.go());
}

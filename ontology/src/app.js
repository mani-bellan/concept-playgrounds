import { initSandbox } from "./sandbox.js";
import { initDetective } from "./detective.js";

function show(tab) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${tab}`));
  history.replaceState(null, "", `#${tab}`);
  window.scrollTo(0, 0);
}

document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
document.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => show(b.dataset.goto)));

initSandbox();
initDetective();
show(["learn", "sandbox", "detective"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "learn");

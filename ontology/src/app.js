import { initSandbox } from "./sandbox.js";
import { initDetective } from "./detective.js";
import { createGraph, graphModel } from "./graph.js";
import { reason } from "./ontology.js";
import { levels } from "./data.js";

function show(tab) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${tab}`));
  history.replaceState(null, "", `#${tab}`);
  window.scrollTo(0, 0);
}

document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
document.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => show(b.dataset.goto)));

// Hero demo: the first Detective case with its inferences drawn.
const demo = levels[0].world;
const demoPositions = { Animal: [470, 55], Mammal: [370, 200], Dog: [470, 345], Rex: [190, 345] };
const heroSvg = document.querySelector("#hero-graph");
const hero = createGraph(heroSvg, { onMove: (id, x, y) => (demoPositions[id] = [x, y]) });
heroSvg.setAttribute("viewBox", "80 15 576 360"); // zoom in on the demo
const heroResult = reason(demo);
const heroModel = graphModel(demo, demoPositions, heroResult);
document.querySelector("#hero-count").textContent = `${heroModel.edges.filter((e) => e.inferred).length} facts inferred`;
heroModel.edges.forEach((e) => (e.fresh = e.inferred));
hero.render(heroModel);

initSandbox();
initDetective();
show(["learn", "sandbox", "detective"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "learn");

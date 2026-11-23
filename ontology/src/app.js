import { initNav, show } from "./nav.js";
import { initSandbox } from "./sandbox.js";
import { initDetective } from "./detective.js";
import { initProfile } from "./profile.js";
import { initCourse } from "./course.js";
import { createGraph, graphModel } from "./graph.js";
import { reason } from "./ontology.js";
import { levels } from "./data.js";

document.querySelector("#theme-btn").addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
});

// Hero demo: the first Detective case with its inferences drawn.
const demo = levels[0].world;
const demoPositions = { Animal: [470, 55], Mammal: [370, 200], Dog: [470, 345], Rex: [190, 345] };
const heroSvg = document.querySelector("#hero-graph");
const hero = createGraph(heroSvg, { onMove: (id, x, y) => (demoPositions[id] = [x, y]) });
heroSvg.setAttribute("viewBox", "80 15 576 360"); // zoom in on the demo
const heroModel = graphModel(demo, demoPositions, reason(demo));
document.querySelector("#hero-count").textContent = `${heroModel.edges.filter((e) => e.inferred).length} facts inferred`;
heroModel.edges.forEach((e) => (e.fresh = e.inferred));
hero.render(heroModel);

initNav();
initProfile();
initSandbox();
initDetective();
initCourse();
show(["learn", "course", "sandbox", "detective"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "learn");

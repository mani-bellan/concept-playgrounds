// Entry point: theme toggle, the party warm-up, and routing between views.
import { party } from "./data.js";
import { countGuest, partyCount } from "./metrics.js";
import { finishParty } from "./progress.js";
import { renderCases, openCase } from "./cases.js";
import { renderCourse } from "./course.js";
import { renderBuild } from "./build.js";
import { initProfile } from "./profile.js";
import { guessBlock } from "./ui.js";

const $ = (sel) => document.querySelector(sel);

$("#theme-btn").addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("mc-theme", theme);
});

/* Party warm-up */
const who = ["caterer", "host", "photographer"];
const P = party.counters;
let lens = "caterer";

function renderParty() {
  const n = partyCount(party.guests, lens);
  $("#party-lenses").innerHTML = who.map((w) => `<button class="lens" role="tab" data-w="${w}" aria-selected="${w === lens}">${P[w].label}</button>`).join("");
  $("#party-note").innerHTML = `<b>${P[lens].label} counts ${n}.</b> ${P[lens].lesson}`;
  $("#party-guests").innerHTML = party.guests
    .map((g) => {
      const c = countGuest(g, lens);
      const why = !g.came ? "didn't come" : !g.rsvp ? "walk-in" : g.leftEarly ? "left early" : g.seconds ? "had seconds" : "";
      return `<div class="guest ${c ? "counted" : "skipped"}">${g.name}${c === 2 ? '<span class="x2">×2</span>' : ""}<span class="why">${why || "&nbsp;"}</span></div>`;
    })
    .join("");
  $("#party-legend").innerHTML = `<span class="on"><i></i>Counted by ${P[lens].label.replace(/^The /, "the ")}</span><span class="base"><i></i>Not counted</span>`;
}

function initParty() {
  $("#party-boards").innerHTML = who
    .map((w) => `<div class="board"><div class="lab">${P[w].label}</div><div class="val num">${party.claims[w]}</div><div class="sub">${P[w].says}</div></div>`)
    .join("");
  $("#four").innerHTML = [
    ["What do we count?", "Sam counted RSVPs, which are promises, not people who came."],
    ["What's left out?", "Sam's list left out the two walk-ins who never replied."],
    ["Counted at what level?", "The caterer counted plates, so second helpings count twice."],
    ["Over what period?", "The photographer counted only who was there at 9 PM."],
  ]
    .map(([q, a]) => `<li><strong>${q}</strong>${a}</li>`)
    .join("");
  $("#party-lenses").addEventListener("click", (e) => {
    const b = e.target.closest(".lens");
    if (!b) return;
    lens = b.dataset.w;
    renderParty();
    $(`.lens[data-w="${lens}"]`).focus();
  });
  guessBlock($("#party-guess"), "Who is right?", ["The caterer", "Sam", "The photographer", "All three"], 3, "Each of them counted something different. Pick a person below to see exactly who they counted.", () => {
    $("#party-reveal").hidden = false;
    renderParty();
    finishParty();
  });
}

/* Routing: #home, #warmup, #course, #course/2, #cases, #cases/03, #build */
function route() {
  const [view, arg] = (location.hash.slice(1) || "home").split("/");
  const name = view === "warmup" ? "home" : ["course", "cases", "build"].includes(view) ? view : "home";
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
  if (name === "course") renderCourse(arg);
  if (name === "cases") arg ? openCase(arg) : renderCases();
  if (name === "build") renderBuild();
  if (view === "warmup") $("#warmup").scrollIntoView();
  else window.scrollTo(0, 0);
}

initParty();
initProfile();
addEventListener("hashchange", route);
route();

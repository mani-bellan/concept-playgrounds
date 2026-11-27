// Small UI helpers shared by the views.

export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Animate a number in place so learners see it move.
export function tick(el, from, to, fmt) {
  if (!el) return;
  if (reduced || from === to) return void (el.textContent = fmt(to));
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / 450);
    el.textContent = fmt(from + (to - from) * (1 - (1 - p) ** 3));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// A "make your call" question. onAnswer(rightFirst) runs once.
export function guessBlock(root, prompt, options, answer, explain, onAnswer, done = null) {
  const paint = (picked) => {
    root.innerHTML = `<p class="guess-q">${prompt}</p><div class="options">${options
      .map((o, i) => `<button class="opt${picked === null ? "" : i === answer ? " right" : i === picked ? " wrong" : ""}" data-i="${i}"${picked === null ? "" : " disabled"}>${o}</button>`)
      .join("")}</div>${picked === null ? "" : `<div class="feedback">${picked === answer ? "<b>Right.</b> " : '<b class="no">Not quite.</b> '}${explain}</div>`}`;
  };
  paint(done);
  root.onclick = (e) => {
    const b = e.target.closest(".opt");
    if (!b || b.disabled) return;
    const i = Number(b.dataset.i);
    paint(i);
    onAnswer(i === answer);
  };
}

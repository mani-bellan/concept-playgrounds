// Score button, progress dialog, badges, and a scoreboard-style share card.
import { cases } from "./data.js";
import { chapters } from "./chapters.js";
import { progress, BADGES, MAX_SCORE, score, casesClosed, chaptersDone, onChange, resetProgress, toast } from "./progress.js";

const $ = (sel) => document.querySelector(sel);
const appUrl = () => location.origin + location.pathname;
const shareText = () =>
  `I scored ${score()}/${MAX_SCORE} on Metric Court: ${casesClosed()}/${cases.length} number disputes settled, ${progress.badges.length}/${BADGES.length} badges. Why do two dashboards show different numbers? Find out:`;

function renderButton() {
  $("#score-btn").innerHTML = `<span class="num">${score()}</span><span class="of">/${MAX_SCORE}</span><span class="sep"></span><span class="num">${progress.badges.length}</span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="9" r="5"/><path d="M8.5 13 7 21l5-3 5 3-1.5-8"/></svg>`;
}

function renderPanel() {
  $("#profile-body").innerHTML = `
    <div class="boards" style="--n:3">
      <div class="board you"><div class="lab">Score</div><div class="val num">${score()}<small>/${MAX_SCORE}</small></div></div>
      <div class="board"><div class="lab">Cases</div><div class="val num">${casesClosed()}<small>/${cases.length}</small></div></div>
      <div class="board"><div class="lab">Chapters</div><div class="val num">${chaptersDone()}<small>/${chapters.length}</small></div></div>
    </div>
    <p class="small-label pad">Badges · ${progress.badges.length} of ${BADGES.length}</p>
    <div class="badges">${BADGES.map((b) => `<div class="badge${progress.badges.includes(b.id) ? " got" : ""}"><span class="badge-icon">${b.icon}</span><div><b>${b.name}</b><span>${b.desc}</span></div></div>`).join("")}</div>
    <p class="small-label pad">Share your result</p>
    <canvas id="share-canvas" width="1200" height="630"></canvas>
    <div class="share-actions">
      <button class="btn small" data-share="native">Share</button>
      <button class="btn ghost small" data-share="copy">Copy text</button>
      <button class="btn ghost small" data-share="download">Download image</button>
      <a class="btn ghost small" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl())}">LinkedIn</a>
      <a class="btn ghost small" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${encodeURIComponent(appUrl())}">X</a>
    </div>
    <button class="link-btn" id="reset-progress">Reset all progress</button>`;
  drawCard($("#share-canvas"));
}

// Night game palette, so the card looks the same whatever theme the visitor uses.
const C = { bg: "#0F1A2B", panel: "#16243A", line: "#26385A", text: "#EEF2F7", mute: "#97A8BE", hi: "#FFC15E", ok: "#6FDDB9" };

async function drawCard(canvas) {
  await document.fonts.ready;
  const c = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  c.fillStyle = C.bg;
  c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(255,255,255,0.05)";
  for (let x = 12; x < W; x += 14) for (let y = 12; y < H; y += 14) c.fillRect(x, y, 2, 2);

  c.fillStyle = C.hi;
  c.beginPath();
  c.arc(86, 82, 9, 0, 7);
  c.fill();
  c.fillStyle = C.text;
  c.font = "700 30px 'Barlow Condensed', sans-serif";
  c.letterSpacing = "5px";
  c.fillText("METRIC COURT", 108, 93);

  const panel = (x, y, w, h, stroke) => {
    c.fillStyle = C.panel;
    c.beginPath();
    c.roundRect(x, y, w, h, 18);
    c.fill();
    c.lineWidth = stroke ? 4 : 2;
    c.strokeStyle = stroke || C.line;
    c.stroke();
  };
  const stat = (x, label, value, of, color) => {
    c.font = "600 22px 'Barlow Condensed', sans-serif";
    c.letterSpacing = "4px";
    c.fillStyle = C.mute;
    c.fillText(label, x + 28, 196);
    c.letterSpacing = "0px";
    c.font = "500 96px 'JetBrains Mono', monospace";
    c.fillStyle = color;
    c.fillText(value, x + 24, 300);
    const w = c.measureText(value).width;
    c.font = "500 40px 'JetBrains Mono', monospace";
    c.fillStyle = C.mute;
    c.fillText(of, x + 30 + w, 300);
  };
  panel(70, 150, 420, 190, C.hi);
  stat(70, "SCORE", String(score()), `/${MAX_SCORE}`, C.hi);
  panel(510, 150, 300, 190);
  stat(510, "CASES", String(casesClosed()), `/${cases.length}`, C.text);
  panel(830, 150, 300, 190);
  stat(830, "BADGES", String(progress.badges.length), `/${BADGES.length}`, C.text);

  const icons = await Promise.all(
    BADGES.map((b) => {
      const got = progress.badges.includes(b.id);
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(b.icon.replace("currentColor", got ? C.hi : "#3A4D6E").replace('width="20" height="20"', 'width="52" height="52" xmlns="http://www.w3.org/2000/svg"'));
      return img.decode().then(() => img, () => null);
    }),
  );
  BADGES.forEach((b, i) => {
    const x = 70 + i * 72;
    const got = progress.badges.includes(b.id);
    c.beginPath();
    c.arc(x + 28, 420, 28, 0, 7);
    c.fillStyle = got ? "rgba(255,193,94,0.14)" : C.panel;
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = got ? C.hi : C.line;
    c.stroke();
    if (icons[i]) c.drawImage(icons[i], x + 15, 407, 26, 26);
  });

  c.font = "600 34px Barlow, sans-serif";
  c.fillStyle = C.text;
  c.letterSpacing = "0px";
  c.fillText("Two dashboards. Two numbers. Who is right?", 70, 520);
  c.font = "500 22px 'JetBrains Mono', monospace";
  c.fillStyle = C.mute;
  c.fillText(appUrl().replace(/^https?:\/\//, "").replace(/\/$/, ""), 70, 575);
}

const cardBlob = () => new Promise((res) => $("#share-canvas").toBlob(res, "image/png"));

async function share(kind) {
  const text = `${shareText()} ${appUrl()}`;
  if (kind === "copy") {
    await navigator.clipboard.writeText(text);
    toast("Copied", "Paste it into LinkedIn, Slack, or Teams.");
  } else if (kind === "download") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await cardBlob());
    a.download = "metric-court-result.png";
    a.click();
  } else {
    const file = new File([await cardBlob()], "metric-court-result.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text });
    else if (navigator.share) await navigator.share({ text, url: appUrl() });
    else share("copy");
  }
}

export function initProfile() {
  renderButton();
  onChange(() => {
    renderButton();
    if ($("#profile").open) renderPanel();
  });
  $("#score-btn").addEventListener("click", () => {
    renderPanel();
    $("#profile").showModal();
  });
  $("#profile").addEventListener("click", (e) => {
    if (e.target === $("#profile") || e.target.closest("[data-close]")) $("#profile").close();
    const s = e.target.closest("[data-share]");
    if (s) share(s.dataset.share).catch(() => {});
    if (e.target.closest("#reset-progress") && confirm("Reset your score, badges, and answers?")) {
      resetProgress();
      location.reload();
    }
  });
}

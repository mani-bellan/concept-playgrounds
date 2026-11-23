// Profile panel: score, badges, and a shareable result card.
import { progress, BADGES, MAX_SCORE, CASE_COUNT, score, solvedCount, onChange, resetProgress, formatTime, toast } from "./progress.js";
import { missions } from "./data.js";

const $ = (sel) => document.querySelector(sel);
const appUrl = () => location.origin + location.pathname;

function shareText() {
  return `I scored ${score()}/${MAX_SCORE} on Ontology Playground: ${solvedCount()}/${CASE_COUNT} detective cases, ${progress.missions.length}/${missions.length} missions, ${progress.badges.length}/${BADGES.length} badges. Learn what an ontology is by building one:`;
}

function renderHeader() {
  $("#profile-btn").innerHTML = `<span class="mono">${score()} pts</span><span class="sep"></span><span class="mono">${progress.badges.length}/${BADGES.length}</span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="9" r="5"/><path d="M8.5 13 7 21l5-3 5 3-1.5-8"/></svg>`;
}

function renderPanel() {
  const time = progress.finishedAt && progress.startedAt ? formatTime(progress.finishedAt - progress.startedAt) : "—";
  $("#profile-body").innerHTML = `
    <div class="stat-grid">
      <div><span class="mono label">Score</span><b>${score()}<small>/${MAX_SCORE}</small></b></div>
      <div><span class="mono label">Cases</span><b>${solvedCount()}<small>/${CASE_COUNT}</small></b></div>
      <div><span class="mono label">Missions</span><b>${progress.missions.length}<small>/${missions.length}</small></b></div>
      <div><span class="mono label">Case time</span><b>${time}</b></div>
    </div>
    <div class="pane-title">Badges <span class="muted">${progress.badges.length} of ${BADGES.length}</span></div>
    <div class="badge-grid">${BADGES.map((b) => {
      const got = progress.badges.includes(b.id);
      return `<div class="badge-item ${got ? "got" : ""}"><span class="badge-icon">${b.icon}</span><div><b>${b.name}</b><span>${b.desc}</span></div></div>`;
    }).join("")}</div>
    <div class="pane-title">Share</div>
    <canvas id="share-canvas" width="1200" height="630"></canvas>
    <div class="share-actions">
      <button class="btn btn-primary btn-sm" data-share="native">Share</button>
      <button class="btn btn-sm" data-share="copy">Copy text</button>
      <button class="btn btn-sm" data-share="download">Download image</button>
      <a class="btn btn-sm" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl())}">LinkedIn</a>
      <a class="btn btn-sm" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${encodeURIComponent(appUrl())}">X</a>
    </div>
    <button class="link-btn" id="reset-progress">Reset all progress</button>`;
  drawCard($("#share-canvas"));
}

async function drawCard(canvas) {
  await document.fonts.ready;
  const c = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  c.fillStyle = "#09090b";
  c.fillRect(0, 0, W, H);
  const glow = c.createRadialGradient(W * 0.8, 0, 0, W * 0.8, 0, 700);
  glow.addColorStop(0, "rgba(124,156,255,0.28)");
  glow.addColorStop(1, "rgba(124,156,255,0)");
  c.fillStyle = glow;
  c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(255,255,255,0.06)";
  for (let x = 20; x < W; x += 30) for (let y = 20; y < H; y += 30) c.fillRect(x, y, 2, 2);

  c.fillStyle = "#34d399";
  c.beginPath(); c.arc(84, 92, 10, 0, 7); c.fill();
  c.fillStyle = "#7c9cff";
  c.beginPath(); c.arc(112, 68, 10, 0, 7); c.fill();
  c.fillStyle = "#ededef";
  c.font = "600 30px Inter, sans-serif";
  c.fillText("Ontology Playground", 140, 92);

  c.font = "500 22px 'JetBrains Mono', monospace";
  c.fillStyle = "#84848e";
  c.fillText("SCORE", 80, 200);
  c.font = "700 150px Inter, sans-serif";
  c.fillStyle = "#ededef";
  c.fillText(String(score()), 72, 340);
  const w = c.measureText(String(score())).width;
  c.font = "600 54px Inter, sans-serif";
  c.fillStyle = "#55555e";
  c.fillText(`/ ${MAX_SCORE}`, 92 + w, 340);

  const time = progress.finishedAt && progress.startedAt ? ` in ${formatTime(progress.finishedAt - progress.startedAt)}` : "";
  c.font = "500 28px Inter, sans-serif";
  c.fillStyle = "#b4b4bc";
  c.fillText(`${solvedCount()}/${CASE_COUNT} detective cases${time}  ·  ${progress.missions.length}/${missions.length} missions`, 80, 410);

  // Badge row: earned badges in colour with their icons, locked ones dimmed.
  const icons = await Promise.all(
    BADGES.map((b) => {
      const got = progress.badges.includes(b.id);
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(b.icon.replace("currentColor", got ? "#fbbf24" : "#3f3f46").replace('width="20" height="20"', 'width="52" height="52" xmlns="http://www.w3.org/2000/svg"'));
      return img.decode().then(() => img, () => null);
    }),
  );
  BADGES.forEach((b, i) => {
    const x = 80 + i * 76;
    const got = progress.badges.includes(b.id);
    c.beginPath();
    c.arc(x + 26, 494, 28, 0, 7);
    c.fillStyle = got ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)";
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = got ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.10)";
    c.stroke();
    if (icons[i]) c.drawImage(icons[i], x + 13, 481, 26, 26);
  });
  c.font = "500 20px Inter, sans-serif";
  c.fillStyle = "#84848e";
  c.fillText(`${progress.badges.length} of ${BADGES.length} badges`, 80 + BADGES.length * 76 + 8, 501);

  c.font = "500 22px 'JetBrains Mono', monospace";
  c.fillStyle = "#55555e";
  c.fillText(appUrl().replace(/^https?:\/\//, "").replace(/\/$/, ""), 80, 585);
  c.textAlign = "right";
  c.fillStyle = "#84848e";
  c.fillText("Learn ontologies by building one", W - 80, 585);
  c.textAlign = "left";
}

const cardBlob = () => new Promise((res) => $("#share-canvas").toBlob(res, "image/png"));

async function share(kind) {
  const text = `${shareText()} ${appUrl()}`;
  if (kind === "copy") {
    await navigator.clipboard.writeText(text);
    toast("Copied", "Paste it into Slack, Teams, or LinkedIn.");
  } else if (kind === "download") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await cardBlob());
    a.download = "ontology-playground-result.png";
    a.click();
  } else {
    const file = new File([await cardBlob()], "ontology-playground-result.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text });
    else if (navigator.share) await navigator.share({ text, url: appUrl() });
    else share("copy");
  }
}

export function openProfile() {
  renderPanel();
  $("#profile").showModal();
}

export function initProfile() {
  renderHeader();
  onChange(() => {
    renderHeader();
    if ($("#profile").open) renderPanel();
  });
  $("#profile-btn").addEventListener("click", openProfile);
  $("#profile").addEventListener("click", (e) => {
    if (e.target === $("#profile") || e.target.closest("[data-close]")) $("#profile").close();
    const s = e.target.closest("[data-share]");
    if (s) share(s.dataset.share).catch(() => {});
    if (e.target.closest("#reset-progress") && confirm("Reset your score, badges, and missions?")) resetProgress();
  });
}

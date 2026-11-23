// SVG graph of classes, individuals, and the facts between them.
import { relationLabel } from "./ontology.js";

const W = 800;
const H = 500;
const NODE_H = 38;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const width = (n) => Math.max(70, 26 + n.id.length * 8.6);

// Point where the line from the node centre towards (tx, ty) leaves its box.
function edgePoint(n, tx, ty) {
  const dx = tx - n.x;
  const dy = ty - n.y;
  const hw = width(n) / 2 + 4;
  const hh = NODE_H / 2 + 4;
  const t = Math.min(hw / Math.abs(dx || 1e-9), hh / Math.abs(dy || 1e-9));
  return [n.x + dx * t, n.y + dy * t];
}

export function createGraph(svg, { onMove, onSelect } = {}) {
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const marker = `arrow-${svg.id}`;
  let model = { nodes: [], edges: [] };
  let drag = null;

  const toLocal = (e) => {
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const m = p.matrixTransform(svg.getScreenCTM().inverse());
    return [m.x, m.y];
  };

  svg.addEventListener("pointerdown", (e) => {
    const g = e.target.closest("[data-node]");
    if (!g) return onSelect?.(null);
    const n = model.nodes.find((n) => n.id === g.dataset.node);
    const [x, y] = toLocal(e);
    drag = { n, dx: n.x - x, dy: n.y - y, moved: false };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag || !onMove) return;
    const [x, y] = toLocal(e);
    drag.n.x = Math.max(40, Math.min(W - 40, x + drag.dx));
    drag.n.y = Math.max(24, Math.min(H - 24, y + drag.dy));
    drag.moved = true;
    onMove(drag.n.id, drag.n.x, drag.n.y);
    render(model);
  });
  svg.addEventListener("pointerup", () => {
    if (drag && !drag.moved) onSelect?.(drag.n.id);
    drag = null;
  });

  function render(next) {
    model = next;
    const byId = new Map(model.nodes.map((n) => [n.id, n]));
    const pairCount = new Map();
    const parts = [
      `<defs>
        <marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker>
      </defs>`,
    ];

    const edges = [...model.edges].sort((a, b) => Number(a.inferred) - Number(b.inferred));
    for (const e of edges) {
      const a = byId.get(e.s);
      const b = byId.get(e.o);
      if (!a || !b || a === b) continue;
      const pair = [e.s, e.o].sort().join("|");
      const i = pairCount.get(pair) ?? 0;
      pairCount.set(pair, i + 1);
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      // Spread parallel edges into alternating curves.
      // Inferred edges always curve, so they don't hide the stated ones.
      const bend = (i === 0 ? 0 : Math.ceil(i / 2) * 46 * (i % 2 ? 1 : -1) * (e.s < e.o ? 1 : -1)) + (e.inferred ? 60 + len * 0.22 : 0);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const cx = mx - ((b.y - a.y) / len) * bend;
      const cy = my + ((b.x - a.x) / len) * bend;
      const [x1, y1] = edgePoint(a, cx, cy);
      const [x2, y2] = edgePoint(b, cx, cy);
      // Inferred labels sit off-centre: an inferred shortcut usually skips a node at its midpoint.
      const t = e.inferred ? 0.32 : 0.5;
      const lx = (1 - t) ** 2 * x1 + 2 * t * (1 - t) * cx + t ** 2 * x2;
      const ly = (1 - t) ** 2 * y1 + 2 * t * (1 - t) * cy + t ** 2 * y2;
      const cls = [
        "edge",
        `edge-${["type", "subClassOf", "disjointWith"].includes(e.p) ? e.p : "prop"}`,
        e.inferred ? "inferred" : "",
        model.highlight?.has(e.key) ? "hl" : "",
        e.fresh ? "fresh" : "",
      ].join(" ");
      const arrow = e.p === "disjointWith" ? "" : `marker-end="url(#${marker})"`;
      parts.push(`<g class="${cls}">
        <path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}" ${arrow}/>
        <text x="${lx}" y="${ly}" dy="-5">${esc(relationLabel(e.p))}</text>
      </g>`);
    }

    for (const n of model.nodes) {
      const w = width(n);
      const cls = ["node", `node-${n.kind}`, model.selected === n.id ? "selected" : "", model.bad?.has(n.id) ? "bad" : ""].join(" ");
      parts.push(`<g class="${cls}" data-node="${esc(n.id)}" transform="translate(${n.x},${n.y})">
        <rect x="${-w / 2}" y="${-NODE_H / 2}" width="${w}" height="${NODE_H}" rx="${n.kind === "class" ? 8 : NODE_H / 2}"/>
        <text dy="5">${esc(n.id)}</text>
      </g>`);
    }
    svg.innerHTML = parts.join("");
  }

  return { render };
}

// Graph model for a world plus the reasoner's result.
export function graphModel(world, positions, result, { showInferred = true, highlight, selected } = {}) {
  const nodes = [
    ...world.classes.map((id) => ({ id, kind: "class" })),
    ...world.individuals.map((id) => ({ id, kind: "individual" })),
  ].map((n) => {
    positions[n.id] ??= [80 + Math.random() * 640, 60 + Math.random() * 380];
    return { ...n, x: positions[n.id][0], y: positions[n.id][1] };
  });
  const ids = new Set(nodes.map((n) => n.id));
  const edges = [...result.facts.entries()]
    .filter(([, f]) => (showInferred || !f.inferred) && ids.has(f.s) && ids.has(f.o))
    .map(([key, f]) => ({ ...f, key }));
  const bad = new Set(result.contradictions.map((c) => c.individual));
  return { nodes, edges, highlight, selected, bad: showInferred ? bad : new Set() };
}

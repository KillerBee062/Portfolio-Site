/* Minimal SVG chart engine for project pages — no dependencies.
   All charts draw into a container div and scale responsively via viewBox. */

const PALETTE = {
  blue: "#3b82f6", indigo: "#6366f1", indigoD: "#4f46e5", violet: "#8b5cf6",
  pink: "#ec4899", green: "#10b981", amber: "#f59e0b", cyan: "#06b6d4",
  ink900: "#0b1020", ink500: "#4b5269", ink400: "#6b7390", ink300: "#9aa2bd",
  ink200: "#c9cee0", ink100: "#e7eaf3",
};

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs, parent) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

function niceTicks(min, max, count) {
  const span = max - min || 1;
  const step = Math.pow(10, Math.floor(Math.log10(span / count)));
  const err = span / count / step;
  const mult = err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
  const s = mult * step;
  const ticks = [];
  for (let v = Math.ceil(min / s) * s; v <= max + 1e-9; v += s) ticks.push(v);
  return ticks;
}

function fmtDefault(v) {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1) + "k";
  return String(Math.round(v * 100) / 100);
}

function makeFrame(container, opts) {
  const W = 720, H = opts.height || 340;
  const m = Object.assign({ top: 18, right: 18, bottom: 42, left: 56 }, opts.margin);
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" });
  if (opts.label) svg.setAttribute("aria-label", opts.label);
  container.appendChild(svg);
  return { svg, W, H, m, iw: W - m.left - m.right, ih: H - m.top - m.bottom };
}

function drawYAxis(f, yMin, yMax, yFmt) {
  const ticks = niceTicks(yMin, yMax, 5);
  const fmt = yFmt || fmtDefault;
  for (const t of ticks) {
    const y = f.m.top + f.ih - ((t - yMin) / (yMax - yMin)) * f.ih;
    svgEl("line", { x1: f.m.left, x2: f.m.left + f.iw, y1: y, y2: y, stroke: PALETTE.ink100, "stroke-width": 1 }, f.svg);
    svgEl("text", { x: f.m.left - 8, y: y + 4, "text-anchor": "end", "font-size": 11, fill: PALETTE.ink400, "font-family": "JetBrains Mono, monospace" }, f.svg).textContent = fmt(t);
  }
  return ticks;
}

/* Line chart.
   cfg: { series: [{label, color, x: [], y: [], width?, dash?, area?}],
          xFmt?, yFmt?, xTicks?, bands?: [{x0, x1, color, label}],
          marks?: [{x, label, color}], legend? (default true), yMin? } */
function lineChart(container, cfg) {
  const f = makeFrame(container, cfg);
  const xs = cfg.series.flatMap(s => s.x);
  const ys = cfg.series.flatMap(s => s.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  let yMin = cfg.yMin !== undefined ? cfg.yMin : Math.min(...ys);
  let yMax = Math.max(...ys);
  const pad = (yMax - yMin) * 0.08 || 1;
  if (cfg.yMin === undefined) yMin -= pad;
  yMax += pad;

  const X = v => f.m.left + ((v - xMin) / (xMax - xMin)) * f.iw;
  const Y = v => f.m.top + f.ih - ((v - yMin) / (yMax - yMin)) * f.ih;

  for (const b of cfg.bands || []) {
    svgEl("rect", { x: X(b.x0), y: f.m.top, width: X(b.x1) - X(b.x0), height: f.ih, fill: b.color, opacity: 0.1, rx: 4 }, f.svg);
    if (b.label) svgEl("text", { x: X(b.x0) + 8, y: f.m.top + 16, "font-size": 11, fill: b.color, "font-weight": 600, "font-family": "JetBrains Mono, monospace" }, f.svg).textContent = b.label;
  }

  drawYAxis(f, yMin, yMax, cfg.yFmt);
  const xTicks = cfg.xTicks || niceTicks(xMin, xMax, 6);
  const xFmt = cfg.xFmt || fmtDefault;
  for (const t of xTicks) {
    svgEl("text", { x: X(t), y: f.H - 14, "text-anchor": "middle", "font-size": 11, fill: PALETTE.ink400, "font-family": "JetBrains Mono, monospace" }, f.svg).textContent = xFmt(t);
  }

  let gradId = 0;
  for (const s of cfg.series) {
    const pts = s.x.map((xv, i) => `${X(xv).toFixed(1)},${Y(s.y[i]).toFixed(1)}`);
    if (s.area) {
      const id = `lc-grad-${Date.now()}-${gradId++}`;
      const grad = svgEl("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 }, f.svg);
      svgEl("stop", { offset: "0%", "stop-color": s.color, "stop-opacity": 0.22 }, grad);
      svgEl("stop", { offset: "100%", "stop-color": s.color, "stop-opacity": 0 }, grad);
      svgEl("polygon", {
        points: `${X(s.x[0]).toFixed(1)},${Y(yMin)} ${pts.join(" ")} ${X(s.x[s.x.length - 1]).toFixed(1)},${Y(yMin)}`,
        fill: `url(#${id})`,
      }, f.svg);
    }
    svgEl("polyline", {
      points: pts.join(" "), fill: "none", stroke: s.color,
      "stroke-width": s.width || 2.4, "stroke-linejoin": "round", "stroke-linecap": "round",
      ...(s.dash ? { "stroke-dasharray": s.dash } : {}),
    }, f.svg);
    if (s.dots) for (let i = 0; i < s.x.length; i++)
      svgEl("circle", { cx: X(s.x[i]), cy: Y(s.y[i]), r: 3.4, fill: s.color }, f.svg);
  }

  for (const mk of cfg.marks || []) {
    svgEl("line", { x1: X(mk.x), x2: X(mk.x), y1: f.m.top, y2: f.m.top + f.ih, stroke: mk.color, "stroke-width": 1.6, "stroke-dasharray": "5 4" }, f.svg);
    if (mk.label) {
      const t = svgEl("text", { x: X(mk.x) + 5, y: f.m.top + f.ih - 8 - (mk.dy || 0), "font-size": 10.5, fill: mk.color, "font-weight": 700, "font-family": "JetBrains Mono, monospace" }, f.svg);
      t.textContent = mk.label;
    }
  }

  if (cfg.legend !== false) legend(container, cfg.series);
}

/* Vertical or horizontal bar chart.
   cfg: { labels, values, colors?, fmt?, horizontal?, suffix? } */
function barChart(container, cfg) {
  const horizontal = !!cfg.horizontal;
  const f = makeFrame(container, Object.assign({}, cfg, {
    margin: horizontal ? { top: 12, right: 60, bottom: 12, left: 130 } : undefined,
    height: cfg.height || (horizontal ? Math.max(46 * cfg.labels.length + 24, 160) : 340),
  }));
  const fmt = cfg.fmt || fmtDefault;
  const vMax = Math.max(...cfg.values) * 1.12;
  const colors = cfg.colors || cfg.labels.map((_, i) => [PALETTE.indigo, PALETTE.violet, PALETTE.blue, PALETTE.pink, PALETTE.cyan][i % 5]);

  if (horizontal) {
    const bh = Math.min(26, f.ih / cfg.labels.length - 12);
    cfg.labels.forEach((lbl, i) => {
      const y = f.m.top + (i + 0.5) * (f.ih / cfg.labels.length) - bh / 2;
      const w = (cfg.values[i] / vMax) * f.iw;
      svgEl("rect", { x: f.m.left, y, width: f.iw, height: bh, rx: bh / 2, fill: PALETTE.ink100, opacity: 0.6 }, f.svg);
      svgEl("rect", { x: f.m.left, y, width: Math.max(w, 2), height: bh, rx: bh / 2, fill: colors[i] }, f.svg);
      svgEl("text", { x: f.m.left - 10, y: y + bh / 2 + 4, "text-anchor": "end", "font-size": 12, fill: PALETTE.ink500, "font-family": "JetBrains Mono, monospace" }, f.svg).textContent = lbl;
      svgEl("text", { x: f.m.left + w + 8, y: y + bh / 2 + 4, "font-size": 12, "font-weight": 700, fill: PALETTE.ink900, "font-family": "JetBrains Mono, monospace" }, f.svg).textContent = fmt(cfg.values[i]);
    });
  } else {
    drawYAxis(f, 0, vMax, cfg.yFmt);
    const bw = Math.min(72, f.iw / cfg.labels.length * 0.55);
    cfg.labels.forEach((lbl, i) => {
      const cx = f.m.left + (i + 0.5) * (f.iw / cfg.labels.length);
      const h = (cfg.values[i] / vMax) * f.ih;
      svgEl("rect", { x: cx - bw / 2, y: f.m.top + f.ih - h, width: bw, height: h, rx: 8, fill: colors[i] }, f.svg);
      svgEl("text", { x: cx, y: f.m.top + f.ih - h - 8, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: PALETTE.ink900, "font-family": "JetBrains Mono, monospace" }, f.svg).textContent = fmt(cfg.values[i]);
      svgEl("text", { x: cx, y: f.H - 14, "text-anchor": "middle", "font-size": 11.5, fill: PALETTE.ink500, "font-family": "JetBrains Mono, monospace" }, f.svg).textContent = lbl;
    });
  }
}

/* Grouped bar chart: cfg { groups: [...], series: [{label, color, values}], fmt? } */
function groupedBarChart(container, cfg) {
  const f = makeFrame(container, cfg);
  const fmt = cfg.fmt || fmtDefault;
  const vMax = Math.max(...cfg.series.flatMap(s => s.values)) * 1.15;
  drawYAxis(f, 0, vMax, cfg.yFmt);
  const gw = f.iw / cfg.groups.length;
  const bw = Math.min(34, gw / cfg.series.length * 0.6);
  cfg.groups.forEach((g, gi) => {
    const gx = f.m.left + gi * gw + gw / 2;
    const total = bw * cfg.series.length + 8 * (cfg.series.length - 1);
    cfg.series.forEach((s, si) => {
      const x = gx - total / 2 + si * (bw + 8);
      const h = (s.values[gi] / vMax) * f.ih;
      svgEl("rect", { x, y: f.m.top + f.ih - h, width: bw, height: h, rx: 6, fill: s.color }, f.svg);
      svgEl("text", { x: x + bw / 2, y: f.m.top + f.ih - h - 7, "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: PALETTE.ink900, "font-family": "JetBrains Mono, monospace" }, f.svg).textContent = fmt(s.values[gi]);
    });
    svgEl("text", { x: gx, y: f.H - 14, "text-anchor": "middle", "font-size": 11.5, fill: PALETTE.ink500, "font-family": "JetBrains Mono, monospace" }, f.svg).textContent = g;
  });
  legend(container, cfg.series);
}

function legend(container, series) {
  const div = document.createElement("div");
  div.className = "viz-legend";
  for (const s of series) {
    if (!s.label) continue;
    const item = document.createElement("span");
    item.className = "viz-legend-item";
    const dot = document.createElement("span");
    dot.className = "viz-legend-dot";
    dot.style.background = s.color;
    item.appendChild(dot);
    item.appendChild(document.createTextNode(s.label));
    div.appendChild(item);
  }
  container.appendChild(div);
}

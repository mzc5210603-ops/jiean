/* ============ 高斯仪表台 — 逻辑 ============ */
"use strict";

const CHANNELS = [
  { id:"trig",  name:"三角函数",   no:"CH-1" },
  { id:"ang",   name:"角度 ⇄ 弧度", no:"CH-2" },
  { id:"sci",   name:"科学计数法", no:"CH-3" },
  { id:"unit",  name:"长度单位",   no:"CH-4" },
  { id:"pct",   name:"百分比台",   no:"CH-5" },
];

/* ---------- 通道切换 ---------- */
const rack = document.getElementById("channelRack");
const screen = document.getElementById("screen");

CHANNELS.forEach(c => {
  const b = document.createElement("button");
  b.className = "ch-btn";
  b.textContent = c.name;
  b.addEventListener("click", () => select(c, b));
  rack.appendChild(b);
  c._btn = b;
});

function select(c, btn) {
  document.querySelectorAll(".ch-btn").forEach(x => x.classList.remove("active"));
  btn.classList.add("active");
  screen.innerHTML = "";
  RENDER[c.id](screen, c);
}

/* ---------- 屏内控件工厂 ---------- */
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
function head(box, c) {
  const h = el("div", "sc-head");
  h.append(el("h2", "", c.name), el("span", "ch-no", c.no + " · READY"));
  box.appendChild(h);
}
function field(box, labelText, input) {
  const f = el("div", "sc-field");
  const l = el("label", "", labelText);
  f.append(l, input);
  box.appendChild(f);
  return input;
}
function numberInput(val) {
  const i = el("input", "sc-input");
  i.type = "text"; i.value = val;
  return i;
}
function selectBox(options, selIdx) {
  const s = el("select", "sc-select");
  options.forEach((o, i) => {
    const opt = el("option", "", o.label);
    opt.value = o.value;
    if (i === selIdx) opt.selected = true;
    s.appendChild(opt);
  });
  return s;
}
function runBtn(text) { return el("button", "sc-btn", text); }
function outBox(box) { return el("div", "sc-out", "—"); }
function appendOut(box, out) { box.appendChild(out); return out; }

/* ---------- CH-1 三角函数 ---------- */
const RENDER = {};
RENDER.trig = (box, c) => {
  head(box, c);
  const row = el("div", "sc-row");
  const deg = numberInput("30");
  const fn = selectBox([
    { label:"sin 正弦", value:"sin" },
    { label:"cos 余弦", value:"cos" },
    { label:"tan 正切", value:"tan" },
  ], 0);
  const mode = selectBox([
    { label:"角度 deg", value:"deg" },
    { label:"弧度 rad", value:"rad" },
  ], 0);
  field(row, "输入数值", deg);
  field(row, "函数", fn);
  field(row, "单位", mode);
  box.appendChild(row);
  const go = runBtn("CALC ▷ 执行测量");
  box.appendChild(go);
  const out = outBox(box);
  appendOut(box, out);
  function calc() {
    let v = parseFloat(deg.value);
    if (isNaN(v)) { out.textContent = "ERR · 非法输入"; return; }
    const r = mode.value === "deg" ? v * Math.PI / 180 : v;
    let res;
    if (fn.value === "sin") res = Math.sin(r);
    else if (fn.value === "cos") res = Math.cos(r);
    else res = Math.tan(r);
    if (Math.abs(res) > 1e12) { out.textContent = "ERR · tan 在该角度无定义"; return; }
    out.innerHTML =
      `输入 ${v} ${mode.value === "deg" ? "°" : "rad"}<br>` +
      `<span class="big">${fn.value} = ${res.toFixed(8)}</span><br>` +
      `sin=${Math.sin(r).toFixed(6)} · cos=${Math.cos(r).toFixed(6)}`;
  }
  go.addEventListener("click", calc);
  deg.addEventListener("keydown", e => { if (e.key === "Enter") calc(); });
  calc();
};

/* ---------- CH-2 角度弧度 ---------- */
RENDER.ang = (box, c) => {
  head(box, c);
  const row = el("div", "sc-row");
  const deg = numberInput("57.2958");
  const rad = numberInput("1");
  field(row, "角度 deg", deg);
  field(row, "弧度 rad", rad);
  box.appendChild(row);
  const out = outBox(box);
  appendOut(box, out);
  function show(d, r) {
    out.innerHTML =
      `<span class="big">${d.toFixed(6)}° = ${r.toFixed(8)} rad</span><br>` +
      `圈数 ${d / 360}<br>梯度 grad：${d * 400 / 360}`;
  }
  deg.addEventListener("input", () => {
    const v = parseFloat(deg.value);
    if (!isNaN(v)) { rad.value = ""; show(v, v * Math.PI / 180); }
  });
  rad.addEventListener("input", () => {
    const v = parseFloat(rad.value);
    if (!isNaN(v)) { deg.value = ""; show(v * 180 / Math.PI, v); }
  });
  show(57.2958, 1);
};

/* ---------- CH-3 科学计数法 ---------- */
RENDER.sci = (box, c) => {
  head(box, c);
  const row = el("div", "sc-row");
  const num = numberInput("299792458");
  field(row, "输入数字（支持小数与负数）", num);
  box.appendChild(row);
  const go = runBtn("CALC ▷ 执行测量");
  box.appendChild(go);
  const out = outBox(box);
  appendOut(box, out);
  const SI = [
    [1e12, "T"], [1e9, "G"], [1e6, "M"], [1e3, "k"],
    [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"],
  ];
  function calc() {
    const v = parseFloat(num.value);
    if (isNaN(v)) { out.textContent = "ERR · 非法输入"; return; }
    const abs = Math.abs(v);
    const exp = v === 0 ? 0 : Math.floor(Math.log10(abs));
    const mant = v / Math.pow(10, exp);
    let si = "—";
    for (const [f, s] of SI) {
      if (abs >= f && (s === "p" || abs < f * 1000)) {
        si = (v / f).toPrecision(4) + " " + s; break;
      }
    }
    out.innerHTML =
      `<span class="big">${mant.toFixed(6)} × 10^${exp}</span><br>` +
      `工程计数 ${si}<br>有效位数字符串长度 ${Math.abs(v).toString().replace(".", "").length}`;
  }
  go.addEventListener("click", calc);
  num.addEventListener("keydown", e => { if (e.key === "Enter") calc(); });
  calc();
};

/* ---------- CH-4 长度单位 ---------- */
RENDER.unit = (box, c) => {
  head(box, c);
  const U = { mm:1, cm:10, m:1000, km:1e6, in:25.4, ft:304.8, mi:1.609344e6 };
  const row = el("div", "sc-row");
  const val = numberInput("100");
  const from = selectBox(Object.keys(U).map(k => ({ label:k, value:k })), 2);
  const to = selectBox(Object.keys(U).map(k => ({ label:k, value:k })), 0);
  field(row, "数值", val);
  field(row, "从", from);
  field(row, "到", to);
  box.appendChild(row);
  const out = outBox(box);
  appendOut(box, out);
  function conv() {
    const v = parseFloat(val.value);
    if (isNaN(v)) { out.textContent = "ERR · 非法输入"; return; }
    const r = v * U[from.value] / U[to.value];
    out.innerHTML =
      `<span class="big">${v} ${from.value} = ${+r.toPrecision(10)} ${to.value}</span><br>` +
      Object.keys(U).map(k => `${(+ (v * U[from.value] / U[k]).toPrecision(6))} ${k}`).join(" · ");
  }
  [val, from, to].forEach(x => x.addEventListener("input", conv));
  conv();
};

/* ---------- CH-5 百分比台 ---------- */
RENDER.pct = (box, c) => {
  head(box, c);
  const mk = () => numberInput("100");
  const rows = [];
  const defs = [
    ["A 的 B%", ["基数 A", "百分比 B%"]],
    ["A 是 B 的百分之几", ["数值 A", "基准 B"]],
    ["A → B 增长了", ["原值 A", "现值 B"]],
  ];
  defs.forEach((d, i) => {
    const row = el("div", "sc-row");
    const a = mk(), b = mk();
    if (i === 1) b.value = "800";
    if (i === 2) { a.value = "80"; b.value = "100"; }
    field(row, d[1][0], a);
    field(row, d[1][1], b);
    box.appendChild(row);
    rows.push([a, b]);
  });
  const go = runBtn("CALC ▷ 执行测量");
  box.appendChild(go);
  const out = outBox(box);
  appendOut(box, out);
  function calc() {
    const num = x => parseFloat(x.value);
    const [a1, b1] = rows[0], [a2, b2] = rows[1], [a3, b3] = rows[2];
    out.innerHTML =
      `① ${num(a1)} 的 ${num(b1)}% = <span class="big">${(num(a1) * num(b1) / 100).toPrecision(10)}</span><br>` +
      `② ${num(a2)} ÷ ${num(b2)} = <span class="big">${(num(a2) / num(b2) * 100).toFixed(2)}%</span><br>` +
      `③ ${num(a3)} → ${num(b3)}：变化 <span class="big">${((num(b3) - num(a3)) / num(a3) * 100).toFixed(2)}%</span>`;
  }
  go.addEventListener("click", calc);
  rows.flat().forEach(i => i.addEventListener("input", calc));
  calc();
};

/* 初始通道 */
select(CHANNELS[0], CHANNELS[0]._btn);

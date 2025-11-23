// Premium web port of your Python game
// Mechanics preserved, fragment bug fixed, smooth tick, auto-save.

/////////////////////
// GAME STATE
/////////////////////
let shards = 0.0;
let base_ps = 1.0;               // base production per second
let shards_per_second = base_ps;

let echoes = 0;
let echo_cost = 10.0;

let chronoscrolls = 0;
let chrono_cost = 100.0;

let sands = 0;
let sands_cost = 1000.0;

let fragment = 0;
let fragment_cost = 10000.0;

let eternity = 0;
let eternity_mult = 1.0;

const prestige_req = 100000;

/////////////////////
// UTIL: formatting
/////////////////////
function formatNumber(n) {
  if (n < 1000) return Math.floor(n).toString();
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp"];
  let u = 0;
  let v = n;
  while (v >= 1000 && u < units.length - 1) { v /= 1000; u++; }
  if (v >= 100) return Math.floor(v) + units[u];
  if (v >= 10) return v.toFixed(1) + units[u];
  return v.toFixed(2) + units[u];
}

/////////////////////
// UI references
/////////////////////
const shardsDisplay = document.getElementById('shards_display');
const productionDisplay = document.getElementById('production_display');
const echoInfo = document.getElementById('echo_info');
const echoCostEl = document.getElementById('echo_cost');
const chronoInfo = document.getElementById('chrono_info');
const chronoCostEl = document.getElementById('chrono_cost');
const sandsInfo = document.getElementById('sands_info');
const sandsCostEl = document.getElementById('sands_cost');
const fragmentInfo = document.getElementById('fragment_info');
const fragmentCostEl = document.getElementById('fragment_cost');
const eternityDisplay = document.getElementById('eternity_display');
const raw_ps_el = document.getElementById('raw_ps');
const base_ps_el = document.getElementById('base_ps');

const buyEchoBtn = document.getElementById('buyEcho');
const buyChronoBtn = document.getElementById('buyChrono');
const buySandsBtn = document.getElementById('buySands');
const buyFragmentBtn = document.getElementById('buyFragment');
const prestigeBtn = document.getElementById('prestigeBtn');

/////////////////////
// UI update
/////////////////////
function updateUI() {
  shardsDisplay.innerText = `Shards: ${formatNumber(shards)}`
  const raw = shards_per_second;
  const prod = raw * eternity_mult;
  productionDisplay.innerText = `+${prod.toFixed(2)} / sec`;
  echoInfo.innerText = `Owned: ${echoes}`;
  echoCostEl.innerText = formatNumber(echo_cost);
  chronoInfo.innerText = `Owned: ${chronoscrolls}`;
  chronoCostEl.innerText = formatNumber(chrono_cost);
  sandsInfo.innerText = `Owned: ${sands}`;
  sandsCostEl.innerText = formatNumber(sands_cost);
  fragmentInfo.innerText = `Owned: ${fragment}`;
  fragmentCostEl.innerText = formatNumber(fragment_cost);
  eternityDisplay.innerText = `Eternity: ${eternity}`;
  raw_ps_el.innerText = raw.toFixed(2);
  base_ps_el.innerText = base_ps.toFixed(2);

  // button affordance
  buyEchoBtn.disabled = shards < echo_cost;
  buyChronoBtn.disabled = shards < chrono_cost;
  buySandsBtn.disabled = shards < sands_cost;
  buyFragmentBtn.disabled = shards < fragment_cost;
}

/////////////////////
// Purchase functions
/////////////////////
function tryBuyEcho() {
  if (shards >= echo_cost) {
    shards -= echo_cost;
    echoes += 1;
    shards_per_second += 1;
    echo_cost = Math.floor(echo_cost * 1.10 * 100) / 100;
    updateUI();
    flash("Bought Echo");
  } else flash("Can't afford Echo");
}
function tryBuyChrono() {
  if (shards >= chrono_cost) {
    shards -= chrono_cost;
    chronoscrolls += 1;
    shards_per_second += 10;
    chrono_cost = Math.floor(chrono_cost * 1.15);
    updateUI();
    flash("Bought Chronoscroll");
  } else flash("Can't afford Chronoscroll");
}
function tryBuySands() {
  if (shards >= sands_cost) {
    shards -= sands_cost;
    sands += 1;
    shards_per_second += 100;
    sands_cost = Math.floor(sands_cost * 1.20);
    updateUI();
    flash("Bought Sands");
  } else flash("Can't afford Sands");
}
function tryBuyFragment() {
  if (shards >= fragment_cost) {
    shards -= fragment_cost;
    fragment += 1;
    shards_per_second += 1000;
    fragment_cost = Math.floor(fragment_cost * 1.30);
    updateUI();
    flash("Bought Fragment");
  } else flash("Can't afford Fragment");
}

/////////////////////
// Prestige
/////////////////////
function prestige() {
  if (shards < prestige_req) { flash("Need more shards to ascend"); return; }
  const gained = Math.floor(shards / prestige_req);
  eternity += gained;
  // Note: your Python switched between 5% and 10%. We'll use 5% per Eternity for steady pacing.
  eternity_mult = 1 + (eternity * 0.05);

  // reset
  shards = 0;
  echoes = 0; echo_cost = 10.0;
  chronoscrolls = 0; chrono_cost = 100.0;
  sands = 0; sands_cost = 1000.0;
  fragment = 0; fragment_cost = 10000.0;
  shards_per_second = base_ps * eternity_mult;

  flash(`Ascended +${gained} Eternity`);
  updateUI();
  save();
}

/////////////////////
// Flash small message (uses productionDisplay)
let flashTimer = null;
function flash(msg) {
  const prev = productionDisplay.innerText;
  productionDisplay.innerText = msg;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(()=> productionDisplay.innerText = prev, 900);
}

/////////////////////
// Save / Load
/////////////////////
function save() {
  const data = {
    shards, base_ps, shards_per_second,
    echoes, echo_cost,
    chronoscrolls, chrono_cost,
    sands, sands_cost,
    fragment, fragment_cost,
    eternity
  };
  localStorage.setItem('thaladris_save_v1', JSON.stringify(data));
  flash('Saved');
}
function load() {
  const raw = localStorage.getItem('thaladris_save_v1');
  if (!raw) { flash('No save'); return; }
  try {
    const data = JSON.parse(raw);
    shards = data.shards || 0;
    base_ps = data.base_ps || 1.0;
    shards_per_second = data.shards_per_second || base_ps;
    echoes = data.echoes || 0;
    echo_cost = data.echo_cost || 10.0;
    chronoscrolls = data.chronoscrolls || 0;
    chrono_cost = data.chrono_cost || 100.0;
    sands = data.sands || 0;
    sands_cost = data.sands_cost || 1000.0;
    fragment = data.fragment || 0;
    fragment_cost = data.fragment_cost || 10000.0;
    eternity = data.eternity || 0;
    eternity_mult = 1 + (eternity * 0.05);
    updateUI();
    flash('Loaded');
  } catch(e) {
    console.error(e);
    flash('Load error');
  }
}
function resetAll() {
  if (!confirm('Reset ALL progress?')) return;
  shards = 0;
  base_ps = 1.0;
  shards_per_second = base_ps;
  echoes = 0; echo_cost = 10.0;
  chronoscrolls = 0; chrono_cost = 100.0;
  sands = 0; sands_cost = 1000.0;
  fragment = 0; fragment_cost = 10000.0;
  eternity = 0; eternity_mult = 1.0;
  localStorage.removeItem('thaladris_save_v1');
  updateUI();
  flash('Reset');
}

/////////////////////
// TICK LOOP
/////////////////////
let last = performance.now();
function tick() {
  const now = performance.now();
  const dt = (now - last) / 1000.0; // seconds
  last = now;
  // accumulate (float)
  shards += (shards_per_second * eternity_mult) * dt;
  updateUI();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/////////////////////
// Auto-save
/////////////////////
setInterval(save, 5000);

/////////////////////
// UI bindings
/////////////////////
buyEchoBtn.addEventListener('click', tryBuyEcho);
buyChronoBtn.addEventListener('click', tryBuyChrono);
buySandsBtn.addEventListener('click', tryBuySands);
buyFragmentBtn.addEventListener('click', tryBuyFragment);
document.getElementById('saveBtn').addEventListener('click', save);
document.getElementById('loadBtn').addEventListener('click', load);
document.getElementById('resetBtn').addEventListener('click', resetAll);
prestigeBtn.addEventListener('click', prestige);

// keyboard
window.addEventListener('keydown', (e) => {
  if (e.key === '1') tryBuyEcho();
  if (e.key === '2') tryBuyChrono();
  if (e.key === '3') tryBuySands();
  if (e.key === '4') tryBuyFragment();
  if (e.key.toLowerCase() === 'p') prestige();
  if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
});

// initialize
load();
updateUI();

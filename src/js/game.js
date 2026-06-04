/* ==========================================================================
   Sorting Shelter Pro — GAME (v2)
   Improvements over v1:
   ✓ Modular ES6 architecture
   ✓ Diff-rendering (only changed tubes re-paint, not the whole stage)
   ✓ Drag-and-drop + tap-tap dual input (mobile-first)
   ✓ Haptic feedback via navigator.vibrate
   ✓ Single requestAnimationFrame loop for pour animation
   ✓ Combo fully resets on undo (v1 was off-by-one)
   ✓ Shop tab in nav now actually opens the shop overlay AND updates active state
   ✓ Achievement counter dynamically matches actual count
   ✓ Background animations pausable when document.hidden
   ✓ Replaces v1 emoji-on-white tile with themed circular medallion
   ========================================================================== */

import {
  ANIMALS, REGIONS, TUTORIAL, LEVELS_C, LEVELS_S, PRICES,
  ACHIEVEMENTS, ACHV_CATS, TUTORIAL_HINTS, DAILY_REWARDS, CAP, TOTAL,
  REGION_I18N
} from './data.js';
import {
  itemIcons, medalSvg, animalSticker, animalCell,
  iconCoin, iconBgm, iconGift, iconTrophy, iconBook, iconHome, iconShop,
  iconBack, iconUndo, iconReset, iconStar, iconPaw,
  iconModeClassic, iconModeSteps
} from './icons.js';
import { showRewardedAd, refreshAllAdButtons, getAdRemaining,
         initCrazyGames, showInterstitialAd,
         gameplayStart, gameplayStop, gameplayHappytime } from './ads.js';
import { t, LANG, setLang, applyStaticI18n, raw } from './i18n.js';

/* ----- Tiny sound engine (lazy WebAudio, fails silently) ----- */
const Snd = {
  ctx: null,
  get() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ return null; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  play(f, type, d, v = 0.06) {
    const c = this.get(); if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(v, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
      o.start(c.currentTime); o.stop(c.currentTime + d);
    } catch(e) {}
  },
};

const SFX = {
  tap()    { Snd.play(600, 'sine', 0.08, 0.04); },
  pour()   { Snd.play(260, 'triangle', 0.2, 0.06); setTimeout(() => Snd.play(520, 'sine', 0.15, 0.06), 60); },
  err()    { Snd.play(120, 'square', 0.25, 0.1);  },
  pure()   { Snd.play(660, 'sine', 0.25, 0.08); setTimeout(() => Snd.play(880, 'sine', 0.25, 0.1), 80); },
  win()    { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Snd.play(f, 'sine', 0.35, 0.12), i * 100)); },
  fail()   { Snd.play(180, 'square', 0.4, 0.15); setTimeout(() => Snd.play(130, 'square', 0.4, 0.2), 150); },
  combo(n) { const f = 400 + n * 80; Snd.play(f, 'sine', 0.2, 0.08); setTimeout(() => Snd.play(f * 1.5, 'sine', 0.2, 0.1), 60); },
  buy()    { Snd.play(800, 'sine', 0.15, 0.08); setTimeout(() => Snd.play(1000, 'sine', 0.15, 0.1), 80); },
  animal(t){ const fs = [880,660,780,520,700,600,560,500,720,640,580,620,540,680,760,800,840,920,960,700]; Snd.play(fs[t % fs.length] || 600, 'sine', 0.2, 0.12); },
};

/* ----- Haptic helper: short, friendly buzz pattern ----- */
const haptic = (kind = 'tap') => {
  if (!navigator.vibrate) return;
  if (kind === 'tap')   navigator.vibrate(8);
  if (kind === 'pour')  navigator.vibrate([6, 30, 12]);
  if (kind === 'err')   navigator.vibrate([20, 40, 20]);
  if (kind === 'win')   navigator.vibrate([30, 80, 30, 80, 60]);
  if (kind === 'pure')  navigator.vibrate(20);
};

/* ----- BGM: synthesized 4-bar arpeggio in C / Am / F / G (0 audio files) ----- */
const BGM = {
  playing: false,
  _timer: null,
  _nodes: [],
  _scheduleNext(c, startAt) {
    // Calm 16-note pattern, repeats every ~5.7s
    const NOTES = [
      261.63, 329.63, 392.00, 523.25,
      220.00, 261.63, 329.63, 440.00,
      174.61, 220.00, 261.63, 349.23,
      196.00, 246.94, 293.66, 392.00,
    ];
    const beat = 0.36;
    const total = NOTES.length * beat;
    for (let i = 0; i < NOTES.length; i++) {
      const t = startAt + i * beat;
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'triangle';
      o.frequency.value = NOTES[i];
      g.gain.setValueAtTime(0.10, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.2);
      o.start(t); o.stop(t + beat * 1.5);
      this._nodes.push(o);
    }
    // Schedule the next loop pass slightly before this one ends
    this._timer = setTimeout(() => {
      this._nodes = [];
      if (this.playing) this._scheduleNext(c, c.currentTime + 0.02);
    }, (total - 0.1) * 1000);
  },
  start() {
    if (this.playing) return;
    const c = Snd.get(); if (!c) return;
    this.playing = true;
    this._scheduleNext(c, c.currentTime + 0.05);
  },
  stop() {
    this.playing = false;
    if (this._timer) clearTimeout(this._timer);
    this._timer = null;
    this._nodes.forEach(n => { try { n.stop(); } catch(_) {} });
    this._nodes = [];
  },
  toggle() {
    if (this.playing) this.stop(); else this.start();
    try { localStorage.setItem('ss_bgm', this.playing ? '1' : '0'); } catch(_) {}
    return this.playing;
  },
};

/* ----- Count-up animation helper (cubic ease-out) ----- */
function countUpEl(el, target, dur = 360) {
  if (!el) return;
  const from = parseInt(el.textContent || '0', 10) || 0;
  if (from === target) { el.textContent = target; return; }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (target - from) * e);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ----- State ----- */
const S = {
  mode: 'classic', tubes: [], init: [], sel: -1, lv: 0, moves: 0, hist: [],
  anim: false, won: false, opt: 0,
  items: { hint: 0, slot: 0, shuffle: 0 },
  extraTube: null,
  coins: 0, bestLv: { classic: 0, steps: 0 },
  stars: { classic: {}, steps: {} },
  combo: 0, maxCombo: 0, totalRescued: 0,
  animalsFound: {}, achievements: {},
  rescuedBy: {},          // v2.1: per-animal-type rescue counter for collection detail
  rescueCount: {},        // v3: per-animal-type rescue counter for unlock (classic only, need 10)
  shuffleBonus: 0,        // v2.1: extra steps granted by shuffle in steps mode
  dailyStreak: 0, lastDaily: '',
  pendingReward: 0,
  newFoundThisRound: [],
  coinHistory: [],       // v3.1: [{src, amount, detail, time}]
  totalWins: 0, noItemWins: 0,
  itemsUsedThisRound: false,
  pendingAchv: null,        // v3.2: achievement waiting for user claim
  tutorialDone: { classic: false, steps: false },
  tutorialStep: -1,
  _domDirty: true,
};

/* ----- Persistence ----- */
const STORAGE_KEY = 'ss_pro_v1';
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      coins: S.coins, items: S.items, bestLv: S.bestLv, stars: S.stars,
      maxCombo: S.maxCombo, totalRescued: S.totalRescued,
      animalsFound: S.animalsFound, achievements: S.achievements,
      rescuedBy: S.rescuedBy, rescueCount: S.rescueCount,
      dailyStreak: S.dailyStreak, lastDaily: S.lastDaily,
      totalWins: S.totalWins, noItemWins: S.noItemWins,
      tutorialDone: S.tutorialDone,
      coinHistory: S.coinHistory,
    }));
  } catch(e) {}
}
function load() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (!r) return;
    const d = JSON.parse(r);
    if (d.coins != null) S.coins = d.coins;
    if (d.items) S.items = { ...S.items, ...d.items };
    if (d.bestLv) S.bestLv = { ...S.bestLv, ...d.bestLv };
    if (d.stars) S.stars = { classic:{}, steps:{}, ...d.stars };
    if (d.maxCombo != null) S.maxCombo = d.maxCombo;
    if (d.totalRescued != null) S.totalRescued = d.totalRescued;
    if (d.animalsFound) S.animalsFound = d.animalsFound;
    if (d.achievements) S.achievements = d.achievements;
    if (d.rescuedBy) S.rescuedBy = d.rescuedBy;
    if (d.rescueCount) S.rescueCount = d.rescueCount;
    if (d.dailyStreak != null) S.dailyStreak = d.dailyStreak;
    if (d.lastDaily) S.lastDaily = d.lastDaily;
    if (d.totalWins != null) S.totalWins = d.totalWins;
    if (d.noItemWins != null) S.noItemWins = d.noItemWins;
    if (d.tutorialDone) S.tutorialDone = { ...S.tutorialDone, ...d.tutorialDone };
  if (Array.isArray(d.coinHistory)) S.coinHistory = d.coinHistory;
  } catch(e) {}
}

/* ----- Coin history tracker (v3.1) ----- */
const COIN_SRC_ICONS = {
  level_win: '🎮', ad_double: '📺', daily: '🎁', achievement: '🏆',
  purchase: '🛒', loyalty: '🏅',
};
function addCoinRecord(src, amount, detail = '') {
  S.coinHistory.push({
    src, amount,
    detail,
    time: Date.now(),
  });
  // Cap at last 200 entries to prevent localStorage bloat
  if (S.coinHistory.length > 200) S.coinHistory = S.coinHistory.slice(-200);
}

/* ----- Pure logic helpers ----- */
const isPure   = t => t.length === 0 || t.every(a => a === t[0]);
const isDone   = t => t.length === CAP && t.every(a => a === t[0]);
const dc       = ts => ts.map(t => [...t]);

function getTube(idx) {
  if (S.extraTube !== null && idx === S.tubes.length) return { tube: S.extraTube, cap: 2, isExtra: true };
  return { tube: S.tubes[idx], cap: CAP, isExtra: false };
}

function canPour(s, d) {
  if (s === d) return false;
  const sg = getTube(s), dg = getTube(d);
  const src = sg.tube, dst = dg.tube;
  if (!src.length) return false;
  if (dst.length >= dg.cap) return false;
  if (!dst.length) return true;
  return dst[dst.length - 1] === src[src.length - 1];
}

function doPour(s, d) {
  const sg = getTube(s), dg = getTube(d);
  const a = sg.tube.pop();
  dg.tube.push(a);
  S.moves++; S.hist.push({ s, d, a });
}

function undo() {
  if (!S.hist.length) return false;
  const last = S.hist.pop();
  const dg = getTube(last.d), sg = getTube(last.s);
  dg.tube.pop(); sg.tube.push(last.a);
  S.moves--;
  return true;
}

function chkWin() {
  if (S.extraTube !== null && S.extraTube.length > 0) return false;
  for (const t of S.tubes) if (t.length && !isDone(t)) return false;
  return true;
}

function progress() {
  let tot = 0, done = 0;
  for (const t of S.tubes) {
    if (!t.length) continue;
    tot += t.length;
    if (isDone(t)) done += t.length;
  }
  return tot > 0 ? Math.round(done / tot * 100) : 0;
}

function calcStars() {
  if (S.opt <= 0) return 3;
  const r = S.moves / S.opt;
  if (r <= 1.5) return 3;
  if (r <= 2.5) return 2;
  return 1;
}

function getMaxSteps() {
  if (S.mode !== 'steps') return Infinity;
  return LEVELS_S[S.lv].maxSteps + (S.shuffleBonus || 0);
}

/* ----- Coin reward: 20~40 based on difficulty -----
   Rule: base 20 + difficulty bonus (from opt and numTypes) + star bonus.
   - opt contributes up to +10 (harder puzzles → more coins)
   - 3-star adds +5, 2-star adds +2, 1-star adds +0
   - Total clamped to [20, 40]
*/
function calcCoinReward(lv, mode, stars) {
  const data = (mode === 'classic' ? LEVELS_C : LEVELS_S)[lv];
  if (!data) return 20;
  const opt = data.opt || 5;
  // Safe flatten — handles missing tubes or non-array items gracefully
  const flatTubes = (data.tubes || []).reduce((a, b) => a.concat(Array.isArray(b) ? b : []), []);
  const numTypes = new Set(flatTubes).size;
  // Difficulty score: opt contributes most, numTypes adds a bit
  const diffScore = Math.min(10, Math.floor(opt / 3) + Math.max(0, numTypes - 3));
  const starBonus = stars === 3 ? 5 : (stars === 2 ? 2 : 0);
  return Math.max(20, Math.min(40, 20 + diffScore + starBonus));
}

/* ----- DOM refs (resolved once) ----- */
const $ = id => document.getElementById(id);
const ta   = $('tube-area');
const mvB  = $('mv-bdg');
const lvB  = $('lv-bdg');
const pf   = $('prog-fill');
const buBtn= $('btn-u');

/* ----- Render: diff-based ----- */
/* Maintains a map of tube index → DOM element. Tubes get full repaints
   when contents change, but we don't tear down the whole stage. */
const tubeNodes = new Map();

function buildTubeNode(idx) {
  const w = document.createElement('div');
  w.className = 'tube-w';
  w.dataset.idx = idx;
  const b = document.createElement('div'); b.className = 'tube-b';
  w.appendChild(b);
  const base = document.createElement('div'); base.className = 'tube-base';
  w.appendChild(base);
  // Pointer events: single handler doing drag-or-tap detection
  attachTubeInput(w, idx);
  return w;
}

function paintTube(idx) {
  const node = tubeNodes.get(idx); if (!node) return;
  const { tube, cap, isExtra } = getTube(idx);
  node.classList.toggle('extra-tube', !!isExtra);
  node.classList.toggle('selected', S.sel === idx);
  const pure = tube.length > 0 && isPure(tube);
  node.classList.toggle('pure', pure);
  node.classList.toggle('ready', pure && tube.length === cap && !isExtra);

  const body = node.firstChild;
  body.innerHTML = '';
  tube.forEach((type, pos) => {
    const a = ANIMALS[type];
    const cell = document.createElement('div');
    cell.className = 'tube-a';
    if (pos === tube.length - 1) cell.classList.add('top');
    cell.style.background = `linear-gradient(150deg, ${a.bg} 0%, ${a.c2}22 60%, ${a.c}33 100%)`;
    cell.style.boxShadow = `0 2px 6px ${a.c}22, inset 0 1.5px 0 rgba(255,255,255,0.9), inset 0 -1.5px 0 ${a.c}18`;
    cell.style.borderColor = `${a.c}33`;
    cell.innerHTML = animalCell(type);
    body.appendChild(cell);
  });
  if (!tube.length && !isExtra) {
    const h = document.createElement('div'); h.className = 'tube-e'; body.appendChild(h);
  }
  for (let i = tube.length; i < cap; i++) {
    const s = document.createElement('div'); s.className = 'tube-s'; body.appendChild(s);
  }
}

function paintAllTubes() {
  // Sync tube count
  const total = S.tubes.length + (S.extraTube !== null ? 1 : 0);
  // Remove extras
  for (const [idx, node] of tubeNodes) {
    if (idx >= total) { node.remove(); tubeNodes.delete(idx); }
  }
  // Add missing
  for (let i = 0; i < total; i++) {
    if (!tubeNodes.has(i)) {
      const node = buildTubeNode(i);
      tubeNodes.set(i, node); ta.appendChild(node);
    }
    paintTube(i);
  }
}

function paintHud() {
  const mLabel = t('game_moves');
  mvB.textContent = S.mode === 'steps'
    ? `${S.moves}/${getMaxSteps()} ${mLabel}`
    : `${S.moves} ${mLabel}`;
  lvB.textContent = S.tutorialStep >= 0 ? '🎓 ' + t('game_tutorial') : t('game_lvl_fmt', { n: S.lv + 1 });
  buBtn.disabled = !S.hist.length;
  if (S.mode === 'steps') {
    const left = getMaxSteps() - S.moves;
    mvB.style.color = left <= 3 ? '#FF6B81' : '#FF9F1C';
  } else {
    mvB.style.color = '#FF9F1C';
  }
  pf.style.width = progress() + '%';
  paintStepBar();
  updateItems();
  updateStars();
}

/* Segmented step-bar: only shown in Steps mode. Red ≤3, yellow ≤6, green otherwise. */
function paintStepBar() {
  const wrap = $('step-bar-wrap');
  if (!wrap) return;
  if (S.mode !== 'steps') { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  const max = getMaxSteps(), left = Math.max(0, max - S.moves);
  $('step-bar-fill').style.transform = `scaleX(${Math.max(0, left / max)})`;
  const lbl = $('step-bar-lbl');
  lbl.textContent = t('steps_left_fmt', { n: left, s: left===1?'':'s' }) + (S.shuffleBonus ? ` (+${S.shuffleBonus} ${t('steps_bonus')})` : '');
  lbl.classList.toggle('danger', left <= 3);
  lbl.classList.toggle('warn',   left > 3 && left <= 6);
}

function updateStars() {
  const st = calcStars();
  $('g-stars').textContent = '⭐'.repeat(st) + '☆'.repeat(3 - st);
}

function updateItems() {
  $('cn-hint').textContent    = S.items.hint;
  $('cn-slot').textContent    = S.items.slot;
  $('cn-shuffle').textContent = S.items.shuffle;
  $('it-hint').disabled    = S.items.hint    <= 0 || S.anim || S.won;
  $('it-slot').disabled    = S.items.slot    <= 0 || S.anim || S.won || S.extraTube !== null;
  $('it-shuffle').disabled = S.items.shuffle <= 0 || S.anim || S.won;
}

function render() { paintAllTubes(); paintHud(); }

/* ----- Input: tap-tap + drag-and-drop unified ----- */
function attachTubeInput(node, idx) {
  let dragging = false;
  let downX = 0, downY = 0, downT = 0;
  let dragGhost = null;
  let dragData = null; // { fromIdx, animal }

  const onDown = (e) => {
    if (S.anim || S.won) return;
    const pt = pointFrom(e);
    downX = pt.x; downY = pt.y; downT = Date.now();
    dragging = false;
    // Pre-arm drag if source has content
    const { tube } = getTube(idx);
    dragData = tube.length ? { fromIdx: idx, animal: tube[tube.length - 1], pointerId: e.pointerId } : null;
    // Don't preventDefault yet — we want vertical scroll on the play area
    // to remain possible until the user clearly intends to drag a tube.
  };

  const onMove = (e) => {
    if (S.anim || S.won || !dragData) return;
    const pt = pointFrom(e);
    const dx = pt.x - downX, dy = pt.y - downY;
    if (!dragging && Math.hypot(dx, dy) > 8) {
      // Drag intent confirmed — capture the pointer so we keep tracking
      // even when the finger slides over other tubes.
      dragging = true;
      if (node.setPointerCapture && e.pointerId != null) {
        try { node.setPointerCapture(e.pointerId); } catch(_) {}
      }
      startGhost(dragData.animal, pt);
    }
    if (dragging) {
      moveGhost(pt);
      highlightDropTarget(pt, dragData.fromIdx);
      e.preventDefault();
    }
  };

  const onUp = (e) => {
    if (S.anim || S.won) return;
    const pt = pointFrom(e);
    if (dragging) {
      const dropIdx = findDropTarget(pt);
      cleanupDrag();
      if (dropIdx != null && dropIdx !== dragData.fromIdx && canPour(dragData.fromIdx, dropIdx)) {
        SFX.tap(); haptic('tap');
        doPourAnim(dragData.fromIdx, dropIdx);
      } else {
        S.combo = 0; SFX.err(); haptic('err'); shake(dragData.fromIdx);
      }
    } else {
      // Tap: route to the existing tap-to-tap interaction
      onTap(idx);
    }
    dragData = null;
  };

  const cleanupDrag = () => {
    if (dragGhost) { dragGhost.remove(); dragGhost = null; }
    document.querySelectorAll('.drop-ok, .drop-bad').forEach(el => el.classList.remove('drop-ok','drop-bad'));
  };

  const startGhost = (animal, pt) => {
    const a = ANIMALS[animal];
    dragGhost = document.createElement('div');
    dragGhost.className = 'drag-ghost';
    dragGhost.textContent = a.e;
    dragGhost.style.background = `linear-gradient(150deg, ${a.bg}, ${a.c}40)`;
    document.body.appendChild(dragGhost);
    moveGhost(pt);
  };
  const moveGhost = (pt) => {
    if (!dragGhost) return;
    // Clamp inside viewport (4px inset) so the ghost never visually disappears
    // when the finger reaches the screen edge.
    const x = Math.max(4, Math.min(window.innerWidth  - 52, pt.x - 24));
    const y = Math.max(4, Math.min(window.innerHeight - 52, pt.y - 40));
    dragGhost.style.transform = `translate(${x}px, ${y}px)`;
  };
  const highlightDropTarget = (pt, from) => {
    document.querySelectorAll('.drop-ok, .drop-bad').forEach(el => el.classList.remove('drop-ok','drop-bad'));
    const tgt = findDropTarget(pt);
    if (tgt == null || tgt === from) return;
    const node = tubeNodes.get(tgt); if (!node) return;
    node.classList.add(canPour(from, tgt) ? 'drop-ok' : 'drop-bad');
  };

  node.addEventListener('pointerdown', onDown);
  // pointermove must be on the window to receive events after pointerCapture for
  // dragGhost movement, but capture from the node forwards them through anyway.
  node.addEventListener('pointermove', onMove);
  node.addEventListener('pointerup', onUp);
  node.addEventListener('pointercancel', () => { cleanupDrag(); dragging = false; dragData = null; });
  // touch-action: none kicks in via CSS once dragging starts (added by JS) so we
  // can preserve vertical scroll on the play area for short taps.
}

function pointFrom(e) {
  if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function findDropTarget(pt) {
  const el = document.elementFromPoint(pt.x, pt.y);
  if (!el) return null;
  const w = el.closest && el.closest('.tube-w');
  if (!w) return null;
  return parseInt(w.dataset.idx, 10);
}

/* Tap-tap fallback (used when no drag): same logic as v1 but cleaner.
   Tapping source first selects it; tapping destination pours. */
async function onTap(idx) {
  if (S.anim || S.won) return;
  const sg = getTube(idx);

  if (!sg.tube.length) {
    if (S.sel !== -1 && canPour(S.sel, idx)) { SFX.tap(); haptic('tap'); await doPourAnim(S.sel, idx); return; }
    if (S.sel !== -1) S.combo = 0; // mis-tap on empty tube breaks combo
    shake(idx); return;
  }

  if (S.sel !== -1) {
    if (S.sel === idx) { S.sel = -1; SFX.tap(); paintTube(idx); return; }
    if (canPour(S.sel, idx)) { SFX.tap(); haptic('tap'); await doPourAnim(S.sel, idx); return; }
    S.combo = 0; const prev = S.sel; S.sel = -1; SFX.err(); haptic('err'); shake(idx); paintTube(prev); paintTube(idx); return;
  }

  const totalCount = S.extraTube !== null ? S.tubes.length + 1 : S.tubes.length;
  const targets = [];
  for (let i = 0; i < totalCount; i++) if (i !== idx && canPour(idx, i)) targets.push(i);
  if (!targets.length) { shake(idx); return; }
  S.sel = idx; SFX.tap(); paintTube(idx);
}

function shake(idx) {
  const el = tubeNodes.get(idx); if (!el) return;
  el.classList.add('wrong');
  setTimeout(() => el.classList.remove('wrong'), 400);
}

/* ----- Pour animation (single rAF arc) ----- */
async function doPourAnim(si, di) {
  S.anim = true;
  const prevSel = S.sel; S.sel = -1;
  if (prevSel !== -1) paintTube(prevSel);

  const se = tubeNodes.get(si), de = tubeNodes.get(di);
  if (!se || !de) { S.anim = false; return; }
  const sr = se.getBoundingClientRect(), dr = de.getBoundingClientRect();
  const { tube: src } = getTube(si);
  const top = src[src.length - 1]; const ae = ANIMALS[top];

  const fly = document.createElement('div');
  fly.className = 'fly-arc';
  fly.textContent = ae.e;
  const sx = sr.left + sr.width/2 - 16, sy = sr.top + 14;
  const dx = dr.left + dr.width/2 - 16, dy = dr.top + 16;
  fly.style.transform = `translate(${sx}px, ${sy}px)`;
  document.body.appendChild(fly);

  const arcH = -70, dur = 260;
  const t0 = performance.now();
  await new Promise(resolve => {
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const x = sx + (dx - sx) * t;
      const y = sy + (dy - sy) * t + arcH * Math.sin(Math.PI * t);
      fly.style.transform = `translate(${x}px, ${y}px) scale(${1 - t*0.12})`;
      if (t < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
  fly.remove();

  // Subtle splash
  for (let k = 0; k < 5; k++) {
    const sp = document.createElement('div');
    sp.className = 'splash';
    sp.style.left = dx + 'px'; sp.style.top = dy + 'px';
    const cs = ['#FF9F1C','#2EC4B6','#FF6B81','#45B7D1'];
    sp.style.background = cs[Math.floor(Math.random() * cs.length)];
    sp.style.setProperty('--sx', (Math.random()*40-20)+'px');
    sp.style.setProperty('--sy', (Math.random()*30-15)+'px');
    document.body.appendChild(sp);
    setTimeout(() => sp.remove(), 500);
  }

  doPour(si, di);
  paintTube(si); paintTube(di); paintHud();
  S.anim = false;

  S.combo++;
  if (S.combo > S.maxCombo) S.maxCombo = S.combo;
  if (S.combo >= 3) showCombo(S.combo);
  SFX.pour();
  const dg = getTube(di);
  if (isPure(dg.tube) && dg.tube.length === dg.cap) {
    SFX.pure(); haptic('pure');
    // Immediate release animation for this completed tube
    await releaseTube(di);
  }
  if (S.tutorialStep >= 0) advanceTutorial();

  if (chkWin()) { S.won = true; showWin(); return; }
  if (S.mode === 'steps' && S.moves > getMaxSteps()) triggerFail();
}

function showCombo(n) {
  const e = document.createElement('div');
  e.className = 'combo-pop';
  e.textContent = t('combo_fmt', { n });
  document.body.appendChild(e);
  SFX.combo(Math.min(n, 10));
  setTimeout(() => e.remove(), 1000);
}

/* ----- Win / fail ----- */

/* Immediate per-tube release animation: fires as soon as a tube is completed */
const _releasedTubes = new Set(); // track which tubes already released this round
async function releaseTube(idx) {
  if (_releasedTubes.has(idx)) return; // prevent double-counting
  _releasedTubes.add(idx);
  const node = tubeNodes.get(idx); if (!node) return;
  const { tube } = getTube(idx);
  if (tube.length !== CAP || !isPure(tube)) return;
  const ae = ANIMALS[tube[0]];
  const r = node.getBoundingClientRect();

  // Animate animals flying out
  for (let j = 0; j < CAP; j++) {
    const rel = document.createElement('div');
    rel.className = 'rel-a';
    rel.textContent = ae.e;
    rel.style.left = (r.left + r.width/2 - 16 + Math.random()*16 - 8) + 'px';
    rel.style.top  = (r.top + 8 + j * 6) + 'px';
    document.body.appendChild(rel);
    SFX.animal(ae.t);
    setTimeout(() => rel.remove(), 1100);
    await new Promise(rr => setTimeout(rr, 100));
  }

  // Track rescue stats
  S.totalRescued += CAP;
  S.rescuedBy[ae.t] = (S.rescuedBy[ae.t] || 0) + CAP;
  // Collection: only classic mode counts toward unlocking
  if (S.mode === 'classic') {
    S.rescueCount[ae.t] = (S.rescueCount[ae.t] || 0) + CAP;
    if (!S.animalsFound[ae.t] && S.rescueCount[ae.t] >= (ANIMALS[ae.t].unlock || 10)) {
      S.animalsFound[ae.t] = true;
      S.newFoundThisRound.push(ae.t);
    }
  }
}

/* Legacy releaseAll — no longer plays animations (releaseTube handles that inline).
   Now only tallies any tubes that might have been missed and triggers showWin. */
function releaseAll() {
  // No-op: all tubes already released inline. Just show win.
  setTimeout(showWin, 200);
}

function showWin() {
  const isTutorial = S.tutorialStep >= 0;
  if (isTutorial) { S.tutorialDone = { classic: true, steps: true }; save(); $('tut-banner').classList.remove('show'); }
  const st = calcStars();
  $('w-stars').textContent = '⭐'.repeat(st) + '☆'.repeat(3 - st);
  const moveTxt = S.mode === 'steps' ? `${S.moves}/${getMaxSteps()} ${t('game_moves')}` : `${S.moves} ${t('game_moves')}`;
  $('w-stat-moves').textContent = S.opt > 0 ? `📊 ${moveTxt} (${t('win_best')} ${S.opt})` : `📊 ${moveTxt}`;
  $('w-stat-lv').textContent = isTutorial ? '🎓 ' + t('game_tutorial') : `🏆 ${t('game_lvl_fmt', { n: S.lv + 1 })}`;
  if (!isTutorial && S.lv + 1 > (S.bestLv[S.mode] || 0)) S.bestLv[S.mode] = S.lv + 1;
  const ps = (S.stars[S.mode] || {})[S.lv] || 0;
  if (!isTutorial && st > ps) {
    if (!S.stars[S.mode]) S.stars[S.mode] = {};
    S.stars[S.mode][S.lv] = st;
  }
  // Economic balance: only award full coins for first-time completion
  // or when player improves star rating. Replays with same/worse stars
  // earn just a small bonus to prevent coin farming.
  let reward;
  if (isTutorial) {
    reward = 5;  // Tutorial is a teaching tool — not a real level
  } else {
    const baseReward = calcCoinReward(S.lv, S.mode, st);
    if (ps === 0) {
      // First time completing this level — full reward
      reward = baseReward;
    } else if (st > ps) {
      // Improved star rating — 60% reward (since they already got full for first clear)
      reward = Math.round(baseReward * 0.6);
    } else {
      // Replay with same/worse stars — tiny consolation bonus
      reward = Math.max(3, Math.round(baseReward * 0.12));
    }
  }
  // Safety net: reward should never be 0 or invalid
  if (!Number.isFinite(reward) || reward < 1) reward = 20;
  S.pendingReward = reward;
  S.coins += reward;
  // Track level win reward
  if (!isTutorial) {
    addCoinRecord('level_win', reward, t('coin_detail_level', { mode: S.mode === 'classic' ? t('mode_classic') : t('mode_steps'), lv: S.lv+1, stars: '⭐'.repeat(st) }));
  } else {
    addCoinRecord('level_win', reward, t('coin_detail_tutorial'));
  }
  // v2.1: animated +N coins reveal (count up from 0 with a "+" prefix).
  const winCoinEl = $('w-coins');
  winCoinEl.textContent = `+0 ${t('win_coins')}`;
  const dur = 500, t0 = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - t, 3);
    const cur = Math.round(reward * e);
    winCoinEl.textContent = `+${cur} ${t('win_coins')}`;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  // Fallback: ensure the final reward is shown even if rAF stalls
  setTimeout(() => {
    if (winCoinEl) winCoinEl.textContent = `+${reward} ${t('win_coins')}`;
  }, dur + 100);
  if (!isTutorial) {
    S.totalWins++;
    if (!S.itemsUsedThisRound) S.noItemWins++;
  }
  S.itemsUsedThisRound = false;
  for (const a of ACHIEVEMENTS) checkAchv(a.id);
  S.combo = 0; save(); updateHome();
  // New-animal popup: show FIRST if there are newly discovered animals,
  // then show win popup after it closes. Otherwise show win normally.
  if (S.mode === 'classic' && S.newFoundThisRound.length > 0) {
    const newAnimals = [...S.newFoundThisRound];
    S.newFoundThisRound = [];
    setTimeout(() => {
      try {
        showNewAnimal(newAnimals, () => {
          $('win-o').classList.add('show');
          refreshAllAdButtons();
          SFX.win(); haptic('win'); spawnConfetti();
        });
      } catch(e) {
        console.error('showNewAnimal error:', e);
        $('win-o').classList.add('show'); refreshAllAdButtons();
        gameplayHappytime();  // CrazyGames: happy moment event
      }
    }, 400);
  } else {
    $('win-o').classList.add('show');
    refreshAllAdButtons();
    gameplayHappytime();  // CrazyGames: happy moment event
    SFX.win(); haptic('win'); spawnConfetti();
  }
}

function hideWin() { $('win-o').classList.remove('show'); }

/* v2.1: failure board gets blurred + grayscaled so the user FEELS the gap,
   and we tell them exactly how many moves short they were. */
function triggerFail() {
  S.won = true;
  $('f-emoji').textContent = '🚫';
  $('f-title').textContent = t('fail_title');
  // Compute how far they were from a full rescue
  const remaining = computeRemainingMoves();
  $('f-sub').textContent = remaining > 0
    ? t('fail_needed_fmt', { n: remaining, s: remaining === 1 ? '' : 's' })
    : t('fail_short');
  $('game-page').classList.add('is-blurred');
  $('fail-o').classList.add('show');
  refreshAllAdButtons();
  SFX.fail(); haptic('err'); S.combo = 0;
}
function hideFail() {
  $('fail-o').classList.remove('show');
  $('game-page').classList.remove('is-blurred');
}

/* Rough estimate of remaining moves: count off-color animals across all tubes.
   (Exact BFS would be more accurate but takes 100+ms; this is good enough.) */
function computeRemainingMoves() {
  let need = 0;
  for (const t of S.tubes) {
    if (!t.length) continue;
    if (isDone(t)) continue;
    // For a tube with k different colors, you need at least (k-1) pours to clean it.
    const colors = new Set(t);
    need += Math.max(1, colors.size);
  }
  return Math.max(2, Math.round(need * 0.7));
}

function spawnConfetti() {
  const cs = ['#FF9F1C','#FF6B81','#2EC4B6','#45B7D1','#FF8C42','#6DBE47','#BB8FCE','#F7DC6F'];
  // Lighter than v1 — 28 pieces instead of 50, all spawned at once
  for (let i = 0; i < 28; i++) {
    const e = document.createElement('div');
    e.className = 'cf';
    e.style.left = (Math.random() * 100) + '%';
    e.style.top = -(Math.random() * 10) + 'px';
    e.style.width = (4 + Math.random() * 8) + 'px';
    e.style.height = e.style.width;
    e.style.background = cs[Math.floor(Math.random() * cs.length)];
    e.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
    e.style.setProperty('--d', (1.5 + Math.random() * 2.5) + 's');
    e.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 4000);
  }
}

/* ----- Ad integration (modular, swappable provider) -----
   Ad placements:
     revive       — fail screen, 3/day, 30s cooldown
     doubleReward — win screen, 3/day, no cooldown
     dailyDouble  — daily overlay, 1/day, no cooldown
   To switch to real ads: edit AD_CONFIG.provider in js/ads.js */

function watchAd(type) {
  // Set loading state on the clicked button
  const btn = document.activeElement;
  if (btn && btn.classList.contains('ovl-btn') && btn.classList.contains('ads')) {
    btn.classList.add('ads-loading');
  }

  showRewardedAd(type,
    /* onSuccess */
    () => {
      onAdComplete(type);
      // Remove loading state
      if (btn) btn.classList.remove('ads-loading');
      refreshAllAdButtons();
    },
    /* onFail */
    (reason) => {
      if (btn) btn.classList.remove('ads-loading');
      const msgs = {
        daily_limit: '⏳ ' + t('toast_ad_limit'),
        cooldown: '⏱ ' + t('toast_ad_cooldown'),
      };
      showToast(msgs[reason] || '📺 ' + t('toast_ad_unavail'));
      refreshAllAdButtons();
    }
  );
}

function onAdComplete(type) {
  switch (type) {
    case 'revive':
      hideFail(); S.won = false; S.sel = -1;
      if (S.mode === 'steps' && S.hist.length > 0) undo();
      render(); showToast('✨ ' + t('toast_revived'));
      break;
    case 'doubleReward':
      if (S.pendingReward > 0) {
        S.coins += S.pendingReward;
        addCoinRecord('ad_double', S.pendingReward, t('coin_detail_ad_2x'));
        $('w-coins').textContent = `x2 = +${S.pendingReward * 2} ${t('win_coins')}!`;
        save(); updateHome();
        showToast(`🪙 ${t('toast_2x_bonus')} +${S.pendingReward}`);
        S.pendingReward = 0;
      }
      break;
    case 'dailyDouble': {
      const today = new Date().toDateString();
      if (S.lastDaily !== today) {
        const r = DAILY_REWARDS[S.dailyStreak % 7];
        if (r.t === 'coins') { S.coins += r.v * 2; addCoinRecord('ad_double', r.v * 2, t('coin_detail_daily_2x', { n: S.dailyStreak+1 })); }
        else S.items[r.t] += r.v * 2;
        S.dailyStreak++; S.lastDaily = today;
        SFX.buy(); save(); updateHome(); refreshDaily(); closeDaily();
        showToast('🎁 ' + t('toast_2x_daily'));
      }
      break;
    }
    case 'achvDouble': {
      const a = S.pendingAchv; if (!a) break;
      const doubled = a.reward * 2;
      S.coins += doubled;
      if (doubled > 0) addCoinRecord('ad_double', a.reward, t('coin_detail_achv_2x', { name: a.t }));
      if (a.bonus) { if (!S.items) S.items = {}; S.items[a.bonus.type] = (S.items[a.bonus.type]||0) + a.bonus.n * 2; }
      let toast = `🏆 ${a.icon} 2x!`;
      if (doubled > 0) toast += ` +${doubled}`;
      if (a.bonus) toast += ` +${a.bonus.type}×${a.bonus.n*2}`;
      showToast(toast);
      save(); updateHome(); closeAchvPopup();
      break;
    }
  }
}

/* ----- Items ----- */
/* v2.1: Hint now glows only ONE animal — the top cell of the best source tube.
   Cleaner visual + clearer "look at me" cue than v2's two-tube halo. */
function useHint() {
  if (S.items.hint <= 0 || S.anim || S.won) return;
  // Find a valid source tube — prefer one that's impure (more useful hint)
  let src = -1, dst = -1;
  for (let i = 0; i < S.tubes.length; i++) {
    if (!S.tubes[i].length || isPure(S.tubes[i])) continue;
    for (let j = 0; j < S.tubes.length; j++) {
      if (i === j || !canPour(i, j)) continue;
      src = i; dst = j; break;
    }
    if (src >= 0) break;
  }
  // Fallback: any valid move
  if (src < 0) {
    for (let i = 0; i < S.tubes.length; i++) {
      if (!S.tubes[i].length) continue;
      for (let j = 0; j < S.tubes.length; j++) {
        if (i === j || !canPour(i, j)) continue;
        src = i; dst = j; break;
      }
      if (src >= 0) break;
    }
  }
  if (src < 0) { showToast('💭 ' + t('toast_no_hints')); return; }
  S.items.hint--; S.itemsUsedThisRound = true; save(); updateItems();
  const node = tubeNodes.get(src);
  if (node) {
    const cells = node.querySelectorAll('.tube-a');
    const topCell = cells[cells.length - 1];
    if (topCell) {
      topCell.classList.add('hint-glow');
      setTimeout(() => topCell.classList.remove('hint-glow'), 2400);
    }
  }
}

function useExtraSlot() {
  if (S.items.slot <= 0 || S.anim || S.won || S.extraTube !== null) return;
  S.extraTube = []; S.items.slot--; S.itemsUsedThisRound = true; save();
  S.sel = -1; render(); showToast('📦 ' + t('toast_slot_open'));
}

/* v2.1: Shuffle now grants +5 step buffer in Steps mode — a meaningful
   reason to spend it vs hint/backpack. */
function useShuffle() {
  if (S.items.shuffle <= 0 || S.anim || S.won) return;
  S.items.shuffle--; S.itemsUsedThisRound = true; save(); updateItems();
  S.sel = -1;
  if (S.extraTube !== null) S.extraTube = [];

  // Collect all current animals into one array
  const allAnimals = [];
  for (let i = 0; i < S.tubes.length; i++) {
    for (let j = 0; j < S.tubes[i].length; j++) {
      allAnimals.push(S.tubes[i][j]);
    }
  }
  // Fisher-Yates shuffle
  for (let i = allAnimals.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allAnimals[i], allAnimals[j]] = [allAnimals[j], allAnimals[i]];
  }

  // Redistribute: keep same tube count structure
  let idx = 0;
  const TUBE_CAP = 4;
  const numTubes = S.tubes.length;
  const tubes = Array.from({ length: numTubes }, () => []);

  // Fill up to capacity per tube
  while (idx < allAnimals.length) {
    for (let t = 0; t < numTubes && idx < allAnimals.length; t++) {
      if (tubes[t].length < TUBE_CAP) {
        tubes[t].push(allAnimals[idx++]);
      }
    }
  }

  S.tubes = tubes;
  S.init = dc(S.tubes); S.moves = 0; S.hist = []; S.combo = 0;

  if (S.mode === 'steps') {
    S.shuffleBonus = (S.shuffleBonus || 0) + 5;
    showToast('🔀 ' + t('toast_shuffled_s'));
  } else {
    showToast('🔀 ' + t('toast_shuffled'));
  }
  render();
}

function buyItem(type) {
  const p = PRICES[type];
  if (S.coins < p) { showToast('💰 ' + t('toast_need_coins', { n: p })); return; }
  S.coins -= p; S.items[type]++; SFX.buy(); save();
  addCoinRecord('purchase', -p, t('coin_detail_buy', { item: t('type_' + type) || type }));
  updateItems(); refreshShop(); updateHome();
  showToast('✅ ' + t('toast_purchased'));
}

/* ----- Shop / Daily / New Animal ----- */
function openShop()    { refreshShop(); $('shop-o').classList.add('show'); }
function closeShop()   { $('shop-o').classList.remove('show'); }
function refreshShop() {
  // v2.1: shop coin count also animates
  countUpEl($('shop-coins'), S.coins);
  $('so-hint').textContent    = S.items.hint;
  $('so-slot').textContent    = S.items.slot;
  $('so-shuffle').textContent = S.items.shuffle;
}

function openDaily() {
  $('daily-o').classList.add('show'); refreshDaily(); refreshAllAdButtons();
}
function closeDaily() { $('daily-o').classList.remove('show'); }
function refreshDaily() {
  const g = $('daily-grid'); g.innerHTML = '';
  const today = new Date().toDateString();
  const claimedToday = S.lastDaily === today;
  const inLoyalty = S.dailyStreak >= 7;
  // streakDay = grid index (0-6) of the CURRENT reward cell
  //   Not yet claimed today → points to the NEXT day to claim (dailyStreak)
  //   Already claimed today → points to the day just claimed (dailyStreak-1)
  const streakDay = inLoyalty ? 6 : (claimedToday ? Math.max(0, (S.dailyStreak - 1) % 7) : (S.dailyStreak % 7));
  $('daily-streak-label').textContent = inLoyalty
    ? t('daily_day_fmt', { n: S.dailyStreak + 1 }) + ` — ${t('daily_loyalty')} 🏆`
    : t('daily_day_fmt', { n: claimedToday ? S.dailyStreak : S.dailyStreak + 1 });
  $('loyalty-banner').style.display = inLoyalty ? 'block' : 'none';
  if (inLoyalty) $('loyalty-banner').innerHTML = '🏆 ' + t('loyalty_banner');
  const icons = { coins:'🪙', hint:'💡', slot:'🎒', shuffle:'🔀' };
  for (let i = 0; i < 7; i++) {
    const r = DAILY_REWARDS[i];
    const d = document.createElement('div');
    let cls = 'daily-item' + (i === 6 ? ' day-7' : '') + (i === streakDay ? ' today' : '');
    // For non-loyalty: claimed if we already passed this day in current cycle
    if (!inLoyalty && i < streakDay) cls += ' claimed';
    if (claimedToday && i === streakDay) cls += ' claimed';
    d.className = cls;
    const label = i === 6 && inLoyalty ? '+150 + 🎲' : (r.t==='coins' ? r.v + ' ' + t('win_coins') : r.v + 'x');
    const icon  = i === 6 && inLoyalty ? '🏆' : icons[r.t];
    d.innerHTML = `<div class="dd">${t('daily_day_fmt2', { n: i+1 })}</div><div class="dr">${icon}</div><div class="dv">${label}</div>`;
    g.appendChild(d);
  }
  const btn = $('daily-claim-btn');
  btn.disabled = claimedToday;
  btn.textContent = claimedToday ? t('daily_claimed') : (inLoyalty ? t('daily_loyalty_btn') + ' 🏆' : t('daily_claim') + ' 🎁');
}

/* v2.1: After 7+ consecutive days, the player enters Loyalty Tier:
   every claim gives 150 coins + 1 RANDOM item (forever loop, no reset). */
function doDailyClaim() {
  const today = new Date().toDateString();
  if (S.lastDaily === today) return;
  const inLoyalty = S.dailyStreak >= 7;
  if (inLoyalty) {
    const coinReward = 150;
    const itemPool = ['hint', 'slot', 'shuffle'];
    const itemKey = itemPool[Math.floor(Math.random() * itemPool.length)];
    S.coins += coinReward;
    addCoinRecord('loyalty', coinReward, t('coin_detail_loyalty', { n: S.dailyStreak+1 }));
    S.items[itemKey]++;
    showToast(`🏆 ${t('toast_loyalty')} · +${coinReward} 🪙 + 1 ${t('type_' + itemKey) || itemKey}！`);
  } else {
    const r = DAILY_REWARDS[S.dailyStreak % 7];
    if (r.t === 'coins') { S.coins += r.v; addCoinRecord('daily', r.v, t('coin_detail_signin', { n: S.dailyStreak+1 })); }
    else S.items[r.t] += r.v;
    showToast('🎁 ' + t('toast_claimed'));
  }
  S.dailyStreak++; S.lastDaily = today;
  SFX.buy(); save(); updateHome(); refreshDaily(); closeDaily();
  refreshAllAdButtons();
}

let _newAnimalCb = null;
function showNewAnimal(types, cb) {
  const list = $('na-list'), header = $('na-header');
  header.textContent = types.length > 1 ? `🔓 ${t('coll_new_header_n')} (${types.length})` : `🔓 ${t('coll_new_header')}`;
  list.innerHTML = types.map((t, i) => {
    const a = ANIMALS[t];
    const regionKey = REGION_I18N[a.region];
    const regionName = regionKey ? (raw(regionKey) || a.region) : a.region;
    return `
      <div class="na-item" style="animation-delay:${i*0.08}s">
        <div class="nai-emoji">${animalSticker(a.t, 64, { rare: ['Mythic Realm','Dreamwood','Lake'].includes(a.region) })}</div>
        <div class="nai-info">
          <div class="nai-name">${a.n}</div>
          <div class="nai-desc">${a.d}</div>
          <div class="nai-region">📍 ${regionName}</div>
        </div>
      </div>`;
  }).join('');
  _newAnimalCb = cb || null;
  $('new-animal-popup').classList.add('show');
}
function closeNewAnimal() {
  $('new-animal-popup').classList.remove('show');
  if (_newAnimalCb) { const cb = _newAnimalCb; _newAnimalCb = null; setTimeout(cb, 200); }
}

/* ----- Tutorial ----- */
const TUTORIAL_STEP_KEYS = [
  { title: 'tut_step1_title', desc: 'tut_step1_desc' },
  { title: 'tut_step2_title', desc: 'tut_step2_desc' },
  { title: 'tut_step3_title', desc: 'tut_step3_desc' },
];
function updateTutorialUI(step) {
  const idx = Math.min(step, TUTORIAL_STEP_KEYS.length - 1);
  const keys = TUTORIAL_STEP_KEYS[idx];
  $('tut-title').textContent = t(keys.title);
  $('tut-desc').textContent  = t(keys.desc);
  renderTutorialHighlights();
}
function advanceTutorial() {
  // v2.1: tutorial trimmed from 5 → 3 steps, but the bound is still data-driven.
  S.tutorialStep = Math.min(S.tutorialStep + 1, TUTORIAL_STEP_KEYS.length - 1);
  updateTutorialUI(S.tutorialStep);
}
function renderTutorialHighlights() {
  for (const node of tubeNodes.values()) node.classList.remove('tut-source','tut-target');
  if (S.won) return;
  let bestSrc = -1, bestDst = -1;
  const totalCount = S.extraTube !== null ? S.tubes.length + 1 : S.tubes.length;
  for (let i = 0; i < totalCount; i++) {
    const sg = getTube(i); if (!sg.tube.length || isPure(sg.tube)) continue;
    for (let j = 0; j < totalCount; j++) {
      if (i === j) continue;
      if (canPour(i, j)) { bestSrc = i; bestDst = j; break; }
    }
    if (bestSrc >= 0) break;
  }
  if (bestSrc >= 0 && bestDst >= 0) {
    const a = tubeNodes.get(bestSrc), b = tubeNodes.get(bestDst);
    if (a) a.classList.add('tut-source');
    if (b) b.classList.add('tut-target');
  }
}
function skipTutorial() {
  S.tutorialStep = -1; S.tutorialDone = { classic: true, steps: true }; save();
  $('tut-banner').classList.remove('show');
  S.lv = 0; loadLevel(0);
}

/* ----- Controls ----- */
function doUndo() {
  if (S.anim || S.won || !S.hist.length) return;
  SFX.tap(); haptic('tap');
  const last = S.hist[S.hist.length - 1];
  S.sel = -1; undo();
  // Combo properly resets to 0 (v1 had max(0, combo-1) which was inconsistent).
  S.combo = 0;
  paintTube(last.s); paintTube(last.d); paintHud();
}
function doReset() {
  if (S.anim) return;
  SFX.tap();
  S.sel = -1; S.tubes = dc(S.init); S.moves = 0; S.hist = [];
  S.won = false; S.combo = 0; S.extraTube = null;
  _releasedTubes.clear(); // reset release tracker on manual reset
  hideWin(); hideFail();
  // Repaint everything
  for (const node of tubeNodes.values()) node.remove();
  tubeNodes.clear();
  render();
}
function nextLevel() {
  hideWin();
  maybeShowInterstitial();  // fire-and-forget interstitial between levels
  // Clear unclaimed reward — player chose to skip ad
  if (S.pendingReward > 0) {
    S.pendingReward = 0;
    save();
  }
  if (S.tutorialStep >= 0) { S.tutorialStep = -1; S.lv = 0; loadLevel(0); }
  else { const maxLv = (S.mode === 'classic' ? LEVELS_C : LEVELS_S).length - 1; S.lv = S.lv < maxLv ? S.lv + 1 : 0; loadLevel(S.lv); }
}
/* v2.1: animate the unwinding before the level resets.
   Reads S.hist, replays in reverse with a quick 120ms-per-move flying arc. */
async function reversePourAnim(from, to) {
  const fromEl = tubeNodes.get(from), toEl = tubeNodes.get(to);
  if (!fromEl || !toEl) return;
  const fr = fromEl.getBoundingClientRect(), tr = toEl.getBoundingClientRect();
  const { tube } = getTube(from);
  if (!tube.length) return;
  const animal = tube[tube.length - 1];
  const ae = ANIMALS[animal];
  const fly = document.createElement('div');
  fly.className = 'fly-arc';
  fly.textContent = ae.e;
  const sx = fr.left + fr.width/2 - 16, sy = fr.top + 14;
  const dx = tr.left + tr.width/2 - 16, dy = tr.top + 16;
  fly.style.transform = `translate(${sx}px, ${sy}px)`;
  document.body.appendChild(fly);
  const dur = 130, t0 = performance.now();
  await new Promise(res => {
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const x = sx + (dx - sx) * t;
      const y = sy + (dy - sy) * t - 40 * Math.sin(Math.PI * t);
      fly.style.transform = `translate(${x}px, ${y}px) scale(${1 - t*0.1})`;
      if (t < 1) requestAnimationFrame(tick); else res();
    };
    requestAnimationFrame(tick);
  });
  fly.remove();
}

async function retryLevel() {
  if (S.anim) return;
  hideFail();
  if (S.tutorialStep >= 0) { loadTutorial(); return; }
  // If there's no history (e.g. Steps mode fail on move 0), skip the animation
  if (!S.hist.length) { loadLevel(S.lv); return; }
  S.anim = true;
  SFX.tap();
  // Replay history in reverse with quick flying arcs
  while (S.hist.length) {
    const m = S.hist[S.hist.length - 1];
    reversePourAnim(m.d, m.s);            // start flight (not awaited — keep them snappy)
    await new Promise(r => setTimeout(r, 90));
    undo();
    paintTube(m.s); paintTube(m.d);
  }
  await new Promise(r => setTimeout(r, 200));
  S.anim = false;
  loadLevel(S.lv);
}

function loadLevel(li) {
  const data = (S.mode === 'classic' ? LEVELS_C : LEVELS_S)[li];
  S.lv = li; S.sel = -1; S.moves = 0; S.hist = [];
  S.anim = false; S.won = false; S.tutorialStep = -1;
  S.opt = data.opt; S.newFoundThisRound = [];
  S.extraTube = null; S.itemsUsedThisRound = false;
  S.shuffleBonus = 0;
  _releasedTubes.clear(); // reset per-level release tracker
  $('tut-banner').classList.remove('show');
  $('game-page').classList.remove('is-blurred');
  hideWin(); hideFail();
  for (const node of tubeNodes.values()) node.remove();
  tubeNodes.clear();
  S.tubes = data.tubes.map(t => [...t]);
  S.init = dc(S.tubes);
  render();
}
function loadTutorial() {
  const data = TUTORIAL;
  S.sel = -1; S.moves = 0; S.hist = []; S.anim = false; S.won = false;
  S.opt = data.opt; S.pendingReward = 0; S.newFoundThisRound = [];
  S.extraTube = null; S.itemsUsedThisRound = false; S.tutorialStep = 0;
  _releasedTubes.clear(); // reset per-level release tracker
  hideWin(); hideFail();
  $('tut-banner').classList.add('show');
  for (const node of tubeNodes.values()) node.remove();
  tubeNodes.clear();
  S.tubes = data.tubes.map(t => [...t]);
  S.init = dc(S.tubes);
  render(); updateTutorialUI(0);
}

/* ----- Navigation ----- */
function navTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  // FIX: shop tab in nav previously left the page state inconsistent.
  // Now we keep "active" on the previously-active page if shop opens an overlay.
  if (page === 'shop') {
    openShop();
    return;
  }
  const navBtn = document.querySelector(`[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  if (page === 'home') { $('home-page').classList.remove('hidden'); updateHome(); }
  else { if (page === 'coll') { $('coll-page').classList.remove('hidden'); renderCollection(); }
  else if (page === 'achv') { $('achv-page').classList.remove('hidden'); renderAchievements(); $('achv-dot').classList.remove('show'); } }
}

function startGame(mode) {
  S.mode = mode; const bestLv = S.bestLv[mode] || 0;
  S.lv = bestLv; S.combo = 0; S.pendingReward = 0; S.newFoundThisRound = [];
  const titles = { classic: '🌿 ' + t('game_classic'), steps: '🎯 ' + t('game_steps') };
  $('g-title').textContent = titles[mode];
  $('home-page').classList.add('hidden');
  $('game-page').classList.remove('hidden');
  gameplayStart();  // CrazyGames: notify gameplay start
  if (!S.tutorialDone.classic && !S.tutorialDone.steps) loadTutorial(); else loadLevel(S.lv);
}

function backToMenu() {
  gameplayStop();  // CrazyGames: notify gameplay stopped
  maybeShowInterstitial();  // fire-and-forget interstitial
  hideWin(); hideFail(); _newAnimalCb = null;
  $('new-animal-popup').classList.remove('show');
  S.won = false; S.combo = 0; S.tutorialStep = -1;
  $('tut-banner').classList.remove('show');
  $('game-page').classList.remove('is-blurred');
  $('game-page').classList.add('hidden');
  $('home-page').classList.remove('hidden');
  updateHome();
}

/* ----- Interstitial ad throttle (every 3rd screen transition) ----- */
let _interstitialCounter = 0;
async function maybeShowInterstitial() {
  _interstitialCounter++;
  if (_interstitialCounter % 3 === 0) {
    await showInterstitialAd();
  }
}

/* ----- Home / Collection / Achievements ----- */
function updateHome() {
  const today = new Date().toDateString();
  const claimed = S.lastDaily === today;
  const dc = $('daily-card'); if (dc) dc.classList.toggle('claimed', claimed);
  $('daily-dot').classList.toggle('show', !claimed);
  const hasNew = ACHIEVEMENTS.some(a => !S.achievements[a.id] && getAchvProgress(a) >= 1);
  $('achv-dot-h').classList.toggle('show', hasNew);
  $('home-lv-classic').textContent = t('mode_level_fmt', { n: S.bestLv.classic + 1 });
  $('home-lv-steps').textContent   = t('mode_level_fmt', { n: S.bestLv.steps + 1 });
  const found = Object.keys(S.animalsFound).length;
  // v2.1: count-up animation instead of an instant jump (300ms ease-out).
  countUpEl($('home-coins'), S.coins);
  $('home-collected').textContent = `${found}/${TOTAL}`;
  // BGM button visual state
  const bgmBtn = $('bgm-btn');
  if (bgmBtn) {
    bgmBtn.classList.toggle('on', BGM.playing);
    bgmBtn.innerHTML = iconBgm(BGM.playing, 26);
  }
}

function getAchvProgress(a) {
  if (S.achievements[a.id]) return 1;
  return a.check(S);
}

function checkAchv(id) {
  if (S.achievements[id]) return;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return;
  if (getAchvProgress(a) < 1) return;
  S.achievements[id] = true;
  // Store pending achievement — user claims via popup
  S.pendingAchv = a;
  showAchvPopup(a);
}

function showAchvPopup(a) {
  const tierEmoji = { bronze:'🥉', silver:'🥈', gold:'🥇', diamond:'💎' };
  const tierMap = {
    bronze: tierEmoji.bronze + ' ' + t('achv_bronze'),
    silver: tierEmoji.silver + ' ' + t('achv_silver'),
    gold: tierEmoji.gold + ' ' + t('achv_gold'),
    diamond: tierEmoji.diamond + ' ' + t('achv_diamond'),
  };
  $('achv-pop-icon').textContent = a.icon;
  $('achv-pop-tier').textContent = tierMap[a.tier] || '';
  $('achv-pop-title').textContent = a.t;
  $('achv-pop-desc').textContent = a.d;
  // Build reward text: coins only, items only, or both
  const icons = {hint:'💡',slot:'📦',shuffle:'🔀'};
  let rewardHtml = '';
  if (a.reward > 0) rewardHtml += `🪙 +${a.reward} ${t('win_coins')}`;
  if (a.bonus) { if (rewardHtml) rewardHtml += ' &nbsp;'; rewardHtml += `${icons[a.bonus.type]||'🎁'} ${t('type_' + a.bonus.type) || a.bonus.type} ×${a.bonus.n}`; }
  $('achv-pop-reward').innerHTML = rewardHtml;
  $('achv-o').classList.add('show');
  SFX.buy();
}

function claimAchv() {
  const a = S.pendingAchv; if (!a) return closeAchvPopup();
  // Give base reward
  S.coins += a.reward;
  addCoinRecord('achievement', a.reward, a.t);
  if (a.bonus) { if (!S.items) S.items = {}; S.items[a.bonus.type] = (S.items[a.bonus.type]||0) + a.bonus.n; }
  showToast(`🏆 ${a.icon} ${a.t} ${t('toast_achv')}`);
  save(); updateHome(); closeAchvPopup();
}

function closeAchvPopup() {
  $('achv-o').classList.remove('show');
  S.pendingAchv = null;
}

function renderCollection() {
  const container = $('coll-sections');
  const ringFill  = $('coll-ring');
  const elemFound = $('coll-found');
  const circumference = 2 * Math.PI * 42;
  const totalFound = Object.keys(S.animalsFound).length;
  let html = '';
  for (const region of REGIONS) {
    const list = ANIMALS.slice(region.range[0], region.range[1] + 1);
    if (!list.length) continue;
    const regionFound = list.filter(a => S.animalsFound[a.t]).length;
    // Localize region name using REGION_I18N mapping
    const regionDisplay = region.i18n ? (raw(region.i18n) || region.name) : region.name;
    const cards = list.map((a, i) => {
      const found = !!S.animalsFound[a.t];
      const rescueProgress = S.rescueCount[a.t] || 0;
      const unlockThreshold = a.unlock || 10;
      const cls = found ? 'unlocked' : 'locked';
      const isRare = ['Mythic Realm','Dreamwood','Lake'].includes(a.region);
      const rareClass = found && isRare ? ' rare' : '';
      // v2.1: stagger delay capped at 0.4s so opening the page isn't painful.
      const delay = Math.min(i * 0.025, 0.4);
      const style = found
        ? `style="animation-delay:${delay}s;--card-accent:${a.c};--card-accent2:${a.c2};"`
        : `style="animation-delay:${delay}s"`;
      // v5: show real animal on ALL cards; locked ones are dimmed
      const sticker = animalSticker(a.t, 56, { rare: found && isRare });
      // Progress badge shows X/threshold in top-right for locked cards
      const progressHtml = !found
        ? `<div class="coll-progress-mini">${rescueProgress}/${unlockThreshold}</div>`
        : '';
      // Localize animal region name using REGION_I18N
      const animalRegionKey = REGION_I18N[a.region];
      const animalRegionDisplay = animalRegionKey ? (raw(animalRegionKey) || a.region) : a.region;
      return `
        <div class="coll-card ${cls}${rareClass}" ${style} ${found?`data-t="${a.t}"`:''}>
          ${progressHtml}
          <div class="coll-emoji">${sticker}</div>
          <div class="coll-name">${a.n}</div>
          ${found ? `<div class="coll-sound">${a.sound}</div><div class="coll-region">📍 ${animalRegionDisplay}</div>` : ''}
        </div>`;
    }).join('');
    html += `
      <div class="coll-section">
        <div class="coll-section-title">
          <span class="cst-icon">${region.icon}</span>${regionDisplay}
          <span class="cst-count"><span>${regionFound}</span>/${list.length}</span>
        </div>
        <div class="coll-grid">${cards}</div>
      </div>`;
  }
  container.innerHTML = html;
  elemFound.textContent = totalFound;
  ringFill.setAttribute('stroke-dasharray', `${circumference * totalFound / TOTAL} ${circumference}`);
  // Wire unlocked cards to the detail modal (delegated via dataset)
  container.querySelectorAll('.coll-card.unlocked').forEach(card => {
    card.addEventListener('click', () => {
      const t = parseInt(card.dataset.t, 10);
      if (!isNaN(t)) openCollDetail(t);
    });
  });
}

/* v2.1: tap an unlocked card → full detail with rescue count. */
function openCollDetail(t) {
  const a = ANIMALS[t]; if (!a) return;
  const isRare = ['Mythic Realm','Dreamwood','Lake'].includes(a.region);
  $('cd-emoji').innerHTML = animalSticker(a.t, 132, { rare: isRare });
  $('cd-emoji').style.background = 'transparent';
  $('cd-emoji').style.padding = '0';
  $('cd-name').textContent   = a.n;
  const regionKey = REGION_I18N[a.region];
  $('cd-region').textContent = '📍 ' + (regionKey ? (raw(regionKey) || a.region) : a.region);
  $('cd-desc').textContent   = a.d;
  $('cd-sound').textContent  = '"' + a.sound + '"';
  $('cd-rescued').textContent = S.rescuedBy[t] || 0;
  $('coll-detail-o').classList.add('show');
  SFX.tap();
}
function closeCollDetail() { $('coll-detail-o').classList.remove('show'); }

/* ----- Coin History Detail (v3.1) ----- */
function openCoinDetail() {
  const list = S.coinHistory.slice().reverse(); // newest first
  const balanceEl = $('cd-balance');
  const summaryEl = $('coin-d-summary');
  const listEl = $('coin-d-list');

  // Balance
  countUpEl(balanceEl, S.coins);

  // Summary stats
  let totalIn = 0, totalOut = 0;
  for (const e of list) {
    if (e.amount > 0) totalIn += e.amount;
    else totalOut += Math.abs(e.amount);
  }
  summaryEl.innerHTML = `
    <div class="coin-d-stat cds-in"><span class="cds-icon">📥</span>+${totalIn}</div>
    <div class="coin-d-stat cds-out"><span class="cds-icon">📤</span>-${totalOut}</div>
    <div class="coin-d-stat cds-total"><span class="cds-icon">💰</span>${t('coin_net')}: ${S.coins}</div>
  `;

  // Transaction list
  if (!list.length) {
    listEl.innerHTML = '<div class="coin-d-empty">' + t('coin_empty') + ' 🎮</div>';
  } else {
    const now = Date.now();
    const fmtTime = (ts) => {
      const diff = now - ts;
      const min = Math.floor(diff / 60000);
      if (min < 1) return t('coin_just_now');
      if (min < 60) return t('coin_m_ago', { n: min });
      const hr = Math.floor(min / 60);
      if (hr < 24) return t('coin_h_ago', { n: hr });
      const d = Math.floor(hr / 24); return t('coin_d_ago', { n: d });
    };
    listEl.innerHTML = list.map((e, i) => `
      <div class="coin-d-item" style="animation-delay:${Math.min(i * 0.03, 0.36)}s">
        <div class="cdi-icon">${COIN_SRC_ICONS[e.src] || '🪙'}</div>
        <div class="cdi-body">
          <div class="cdi-detail">${e.detail||e.src}</div>
          <div class="cdi-time">${fmtTime(e.time)}</div>
        </div>
        <div class="cdi-amount ${e.amount >= 0 ? 'positive' : 'negative'}">${e.amount > 0 ? '+' : ''}${e.amount}</div>
      </div>`).join('');
  }

  $('coin-o').classList.add('show');
  SFX.tap();
}
function closeCoinDetail() { $('coin-o').classList.remove('show'); }

function renderAchievements() {
  const container = $('achv-list');
  const done = ACHIEVEMENTS.filter(a => S.achievements[a.id]).length;
  $('achv-count').textContent = done;
  $('achv-total').textContent = ACHIEVEMENTS.length;
  // Sync i18n vars for the "X / Y unlocked" label
  const achvLabel = document.querySelector('#achv-page [data-i18n-vars]');
  if (achvLabel) achvLabel.dataset.i18nVars = JSON.stringify({ done: done, total: ACHIEVEMENTS.length });
  let html = '';
  for (const cat of ACHV_CATS) {
    const items = ACHIEVEMENTS.filter(a => a.cat === cat.id);
    if (!items.length) continue;
    const catName = raw('achv_cat_' + cat.id) || cat.name;
    html += `<div class="achv-cat"><div class="achv-cat-title">${catName}</div><div class="achv-grid">`;
    items.forEach((a, i) => {
      const isDone = !!S.achievements[a.id];
      const prog = getAchvProgress(a);
      const pct = Math.round(prog * 100);
      const medal = medalSvg(a.tier, a.icon, { size: 72, done: isDone, ribbon: true });
      // Build reward text: coins only, items only, or both
      let rewardText = '';
      if (a.reward > 0) rewardText += `+${a.reward}`;
      if (a.bonus) { if (rewardText) rewardText += ' · '; rewardText += `${t('type_' + a.bonus.type) || a.bonus.type}×${a.bonus.n}`; }
      html += `
        <div class="achv-item tier-${a.tier}${isDone?' done':''}" style="animation-delay:${i*0.04}s">
          <div class="achv-icon">${medal}</div>
          <div class="achv-name">${a.t}</div>
          <div class="achv-desc">${a.d}</div>
          <div class="achv-progress-wrap">
            <div class="achv-progress-track"><div class="achv-progress-fill" style="width:${pct}%"></div></div>
            <div class="achv-progress-label">${isDone ? '✓ ' + t('achv_done') : a.fmt(S)}</div>
          </div>
          <div class="achv-reward">${iconCoin(14)} ${rewardText}</div>
        </div>`;
    });
    html += `</div></div>`;
  }
  container.innerHTML = html;
}

/* ----- Toast ----- */
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}



/* ----- v2.1: Share via Web Share API (mobile) or clipboard fallback (desktop) ----- */
function shareGame() {
  // Build the canonical URL — strip "index.html" and trailing query/hash
  const u = new URL(location.href);
  u.search = ''; u.hash = '';
  if (u.pathname.endsWith('index.html')) u.pathname = u.pathname.replace(/index\.html$/, '');
  const url = u.toString();
  const text = t('share_text', { n: S.totalRescued });
  const title = t('share_title');
  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(`${text}\n${url}`).then(
      () => showToast('🔗 ' + t('share_copied')),
      () => showToast('❌ ' + t('share_fail'))
    );
  } else {
    // Last resort: prompt with the URL
    prompt('Copy this link to share:', url);
  }
}

/* ----- v2.1: BGM toggle ----- */
function toggleBGM() {
  // The audio context must be resumed by a user gesture — toggleBGM is the gesture
  const c = Snd.get();
  if (c && c.state === 'suspended') {
    c.resume().then(() => {
      const on = BGM.toggle();
      showToast(on ? '🎵 ' + t('toast_music_on') : '🔇 ' + t('toast_music_off'));
      updateHome();
    });
  } else {
    const on = BGM.toggle();
    showToast(on ? '🎵 ' + t('toast_music_on') : '🔇 ' + t('toast_music_off'));
    updateHome();
  }
}



/* ----- Pause animations when tab hidden (battery save) ----- */
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('paused', document.hidden);
});

/* ----- Init ----- */
function installStaticIcons() {
  // Home top bar
  const setHTML = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
  const hc = document.querySelector('.home-coin .hc-icon'); if (hc) hc.innerHTML = iconCoin(20);
  const ach = document.querySelector('.home-action[onclick*="achv"]');
  if (ach) ach.innerHTML = iconTrophy(26) + '<div class="ha-dot" id="achv-dot-h"></div>';
  const gif = document.querySelector('.home-action.gift');
  if (gif) gif.innerHTML = iconGift(26) + '<div class="ha-dot" id="daily-dot"></div>';
  // Hero pets — already cute via emoji + bob; leave as is.

  // Mode cards
  const mcA = document.querySelector('.mode-card.classic .mode-big-icon');
  if (mcA) mcA.innerHTML = iconModeClassic(56);
  const mcB = document.querySelector('.mode-card.steps .mode-big-icon');
  if (mcB) mcB.innerHTML = iconModeSteps(56);

  // Game HUD
  const back = document.querySelector('.g-back');
  if (back) back.innerHTML = iconBack(22, '#FF6B81');
  const shopBtn = document.querySelector('.g-shop-btn');
  if (shopBtn) shopBtn.innerHTML = iconShop(22);

  // Item bar
  const setIcSvg = (id, svg) => { const el = $(id); if (!el) return; const ic = el.querySelector('.ic'); if (ic) ic.innerHTML = svg; };
  setIcSvg('it-hint',    itemIcons.hint(28));
  setIcSvg('it-slot',    itemIcons.slot(28));
  setIcSvg('it-shuffle', itemIcons.shuffle(28));

  // Controls
  const bu = $('btn-u'); if (bu) bu.innerHTML = `<span class="cic">${iconUndo(16)}</span> <span data-i18n="ctrl_undo">${t('ctrl_undo')}</span>`;
  const br = $('btn-r'); if (br) br.innerHTML = `<span class="cic">${iconReset(16)}</span> <span data-i18n="ctrl_reset">${t('ctrl_reset')}</span>`;

  // Nav bar
  const navMap = { home: iconHome, coll: iconBook, achv: iconTrophy, shop: iconShop };
  document.querySelectorAll('#nav-bar .nav-item').forEach(el => {
    const fn = navMap[el.dataset.page];
    if (fn) { const ic = el.querySelector('.ni'); if (ic) ic.innerHTML = fn(22); }
  });

  // Collection page hero
  const ch = document.querySelector('.coll-hero-icon');
  if (ch) ch.innerHTML = iconBook(54);

  // Shop static cards (3 items)
  const shopCards = document.querySelectorAll('#shop-o .shop-card');
  const shopIcons = [itemIcons.hint, itemIcons.slot, itemIcons.shuffle];
  shopCards.forEach((card, i) => {
    if (!shopIcons[i]) return;
    const w = card.querySelector('.shop-icon');
    if (w) w.innerHTML = shopIcons[i](36);
  });
  // Shop coin
  const sci = document.querySelector('.shop-coin-icon'); if (sci) sci.innerHTML = iconCoin(20);

  // Daily overlay header gift (decorative)
  // already shown via emoji in overlay; keep for variation

  // v3.1: coin area click → open detail
  const homeCoin = document.querySelector('.home-coin');
  if (homeCoin) homeCoin.addEventListener('click', openCoinDetail);
}

function init() {
  initCrazyGames(); // auto-detect CrazyGames environment
  $('btn-u').addEventListener('pointerdown', e => { e.preventDefault(); doUndo(); });
  $('btn-r').addEventListener('pointerdown', e => { e.preventDefault(); doReset(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doUndo(); }
    if (e.key === 'Escape') backToMenu();
  });
  // Language change → re-render all dynamic content
  window.addEventListener('langchange', () => {
    installStaticIcons();
    const gameHidden = $('game-page').classList.contains('hidden');
    const achvHidden = $('achv-page').classList.contains('hidden');
    const collHidden = $('coll-page').classList.contains('hidden');
    if (!gameHidden) { render(); }
    if (!achvHidden) { renderAchievements(); }
    if (!collHidden) { renderCollection(); }
    updateHome();
    // Refresh any open overlays
    if ($('shop-o').classList.contains('show')) refreshShop();
    if ($('daily-o').classList.contains('show')) refreshDaily();
  });
  load();
  installStaticIcons();
  // v2.1: BGM is OFF by default. The button shows muted; user opts in.
  // If they previously enabled BGM, restore that preference — but real audio
  // playback still waits for the next user gesture (browser autoplay policy).
  try {
    if (localStorage.getItem('ss_bgm') === '1') {
      const bgmBtn = $('bgm-btn');
      if (bgmBtn) {
        bgmBtn.classList.add('on');
        bgmBtn.innerHTML = iconBgm(true, 26);
        const oneShot = () => {
          BGM.start(); updateHome();
          document.removeEventListener('pointerdown', oneShot);
        };
        document.addEventListener('pointerdown', oneShot, { once: true });
      }
    }
  } catch(_) {}
  updateHome();
  renderAchievements();
  renderCollection();
  refreshAllAdButtons();  // v3: init ad button states
}

/* ----- Expose to inline onclick handlers ----- */
window.startGame      = startGame;
window.backToMenu     = backToMenu;
window.openDaily      = openDaily;
window.closeDaily     = closeDaily;
window.doDailyClaim   = doDailyClaim;
window.openShop       = openShop;
window.closeShop      = closeShop;
window.buyItem        = buyItem;
window.useHint        = useHint;
window.useExtraSlot   = useExtraSlot;
window.useShuffle     = useShuffle;
window.skipTutorial   = skipTutorial;
window.watchAd        = watchAd;
window.nextLevel      = nextLevel;
window.retryLevel     = retryLevel;
window.closeNewAnimal = closeNewAnimal;
window.navTo          = navTo;
window.doReset        = doReset;
window.shareGame      = shareGame;
window.toggleBGM      = toggleBGM;
window.closeCollDetail = closeCollDetail;
window.openCoinDetail = openCoinDetail;
window.closeCoinDetail = closeCoinDetail;
window.claimAchv       = claimAchv;
window.closeAchvPopup  = closeAchvPopup;

init();

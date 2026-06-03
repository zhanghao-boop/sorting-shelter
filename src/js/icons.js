/* ==========================================================================
   Sorting Shelter Pro — ICONS
   Hand-tuned inline SVG icon library so the game stops looking like
   "default emoji on a colored square" and starts looking like a real product.

   Three families:
     1. Items     — fully bespoke illustrations (lightbulb, backpack, shuffle)
     2. Medals    — tier-based achievement rosettes (bronze/silver/gold/diamond)
     3. Animals   — sticker frames: gradient halo + glossy highlight + colored
                    drop shadow around the existing emoji "face". 50 hand-drawn
                    animals would be lovely but unrealistic; this gets us 90%
                    of the visual upgrade with 5% of the asset budget.

   All icons are scalable inline SVG — no PNG, no network requests.
   Each function returns an HTML string that can be set via innerHTML.
   ========================================================================== */

import { ANIMALS } from './data.js';

/* ---------- color helpers ---------- */

function darken(hex, amt = 0.18) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) * (1 - amt))) | 0;
  const g = Math.max(0, Math.min(255, ((n >> 8)  & 0xff) * (1 - amt))) | 0;
  const b = Math.max(0, Math.min(255, ((n)       & 0xff) * (1 - amt))) | 0;
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/* ============================================================
   ITEMS — 3 bespoke SVG illustrations
   ============================================================ */

/* Lightbulb with filament, glass shine, and radiating sparkles. */
export function iconHint(size = 48) {
  return `
<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <radialGradient id="hintGlow" cx="50%" cy="40%" r="55%">
      <stop offset="0%"  stop-color="#FFE899" stop-opacity=".9"/>
      <stop offset="60%" stop-color="#FFD24A" stop-opacity=".35"/>
      <stop offset="100%" stop-color="#FFD24A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hintBulb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#FFF2A8"/>
      <stop offset="55%" stop-color="#FFD24A"/>
      <stop offset="100%" stop-color="#F2A91A"/>
    </linearGradient>
    <linearGradient id="hintBase" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#A88248"/>
      <stop offset="100%" stop-color="#6E5126"/>
    </linearGradient>
  </defs>
  <!-- outer glow -->
  <circle cx="32" cy="26" r="22" fill="url(#hintGlow)"/>
  <!-- sparkles -->
  <g fill="#FFE48E" stroke="#FFB400" stroke-width=".6">
    <path d="M9 16 L11 18 L9 20 L7 18 Z"/>
    <path d="M53 12 L55.5 14.5 L53 17 L50.5 14.5 Z"/>
    <path d="M55 30 L57 32 L55 34 L53 32 Z"/>
    <path d="M9 34 L10.5 35.5 L9 37 L7.5 35.5 Z"/>
  </g>
  <!-- bulb -->
  <path d="M22 28 a10 10 0 0 1 20 0 c0 4-2 7-4.5 10 -1.5 1.5-2 3-2 5 v1 h-7 v-1 c0-2-.5-3.5-2-5 -2.5-3-4.5-6-4.5-10 z"
        fill="url(#hintBulb)" stroke="#B47A12" stroke-width="1.4" stroke-linejoin="round"/>
  <!-- glass shine -->
  <path d="M25 22 q-2 4-1 8" stroke="#FFFCE6" stroke-width="2" stroke-linecap="round" fill="none" opacity=".7"/>
  <!-- filament -->
  <path d="M28 30 q4 -5 8 0 q-4 5 -8 0 z" fill="none" stroke="#B25E10" stroke-width="1.2" stroke-linejoin="round"/>
  <!-- screw base -->
  <rect x="26" y="44" width="12" height="3.5" rx="1.4" fill="url(#hintBase)"/>
  <rect x="27" y="48.5" width="10" height="2.5" rx="1.2" fill="url(#hintBase)"/>
  <rect x="28" y="52.5" width="8" height="2" rx="1" fill="url(#hintBase)"/>
</svg>`;
}

/* Extra-slot icon — a mini glass tube with two animals stacked inside and a
   "+2" badge. Speaks the game's native visual language (tubes!) so players
   immediately read it as "an additional tube you can pour into".
   This replaced the original backpack illustration, which was easily mistaken
   for an "undo / put-back" action. */
export function iconExtraSlot(size = 48) {
  const id = 'es-' + Math.random().toString(36).slice(2, 6);
  return `
<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-tube" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#FFFFFF" stop-opacity=".95"/>
      <stop offset="100%" stop-color="#D1E8F1" stop-opacity=".95"/>
    </linearGradient>
    <radialGradient id="${id}-ballA" cx="35%" cy="28%" r="75%">
      <stop offset="0%"  stop-color="#FFFFFF"/>
      <stop offset="55%" stop-color="#FFB57A"/>
      <stop offset="100%" stop-color="#E5722F"/>
    </radialGradient>
    <radialGradient id="${id}-ballB" cx="35%" cy="28%" r="75%">
      <stop offset="0%"  stop-color="#FFFFFF"/>
      <stop offset="55%" stop-color="#7EE3D5"/>
      <stop offset="100%" stop-color="#2EC4B6"/>
    </radialGradient>
    <radialGradient id="${id}-badge" cx="40%" cy="32%" r="70%">
      <stop offset="0%"  stop-color="#FFF8B0"/>
      <stop offset="55%" stop-color="#FFD24A"/>
      <stop offset="100%" stop-color="#C58A16"/>
    </radialGradient>
  </defs>
  <!-- ground shadow -->
  <ellipse cx="29" cy="58" rx="16" ry="2.6" fill="rgba(0,0,0,.18)"/>
  <!-- glass tube body (rounded bottom, open top) -->
  <path d="M14 12 Q14 10 16 10 H42 Q44 10 44 12 V47 Q44 56 36 56 H22 Q14 56 14 47 Z"
        fill="url(#${id}-tube)" stroke="#5A9FB7" stroke-width="2" stroke-linejoin="round"/>
  <!-- top rim ellipse -->
  <ellipse cx="29" cy="11" rx="13" ry="2.8" fill="none" stroke="#5A9FB7" stroke-width="1.8"/>
  <!-- inner glass shine -->
  <path d="M19 18 q-2 12 -2 28" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".75"/>
  <!-- 2 stacked balls inside (the "2 slots" capacity) -->
  <circle cx="29" cy="46" r="7.5" fill="url(#${id}-ballA)" stroke="#B85A1E" stroke-width="1.1"/>
  <circle cx="29" cy="33" r="7.5" fill="url(#${id}-ballB)" stroke="#1B9D90" stroke-width="1.1"/>
  <!-- subtle highlight on top ball -->
  <ellipse cx="26" cy="30" rx="2.6" ry="1.4" fill="#FFFFFF" opacity=".6"/>
  <!-- +2 badge floating to upper right -->
  <circle cx="50" cy="14" r="11" fill="url(#${id}-badge)" stroke="#B58A26" stroke-width="1.5"/>
  <text x="50" y="18.5" font-size="13" font-weight="900" text-anchor="middle" fill="#7A4500"
        font-family="-apple-system, 'Lilita One', system-ui, sans-serif">+2</text>
</svg>`;
}

/* Legacy backpack — kept exported for backwards-compat but no longer wired
   into the game by default. Use iconExtraSlot for the spare-tube power-up. */
export function iconBackpack(size = 48) {
  return `
<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <linearGradient id="bpBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5BC0BE"/>
      <stop offset="100%" stop-color="#2EA5A0"/>
    </linearGradient>
    <linearGradient id="bpPocket" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#A9E5E0"/>
      <stop offset="100%" stop-color="#6FCDC7"/>
    </linearGradient>
    <linearGradient id="bpStrap" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3A8480"/>
      <stop offset="100%" stop-color="#266561"/>
    </linearGradient>
  </defs>
  <!-- shadow -->
  <ellipse cx="32" cy="57" rx="20" ry="2.5" fill="rgba(0,0,0,.12)"/>
  <!-- straps on top of pack -->
  <path d="M19 22 q0-9 6-9" fill="none" stroke="url(#bpStrap)" stroke-width="3" stroke-linecap="round"/>
  <path d="M45 22 q0-9-6-9"  fill="none" stroke="url(#bpStrap)" stroke-width="3" stroke-linecap="round"/>
  <!-- main body -->
  <rect x="12" y="20" width="40" height="35" rx="9" fill="url(#bpBody)" stroke="#1F8278" stroke-width="1.4"/>
  <!-- top flap -->
  <path d="M14 20 q0-6 6-7 h24 q6 1 6 7 v3 q-22-3-36 0 z" fill="#2EA5A0" stroke="#1F8278" stroke-width="1.3"/>
  <!-- buckle -->
  <rect x="29" y="22" width="6" height="3" rx="1" fill="#FFD66E" stroke="#B58A26" stroke-width=".8"/>
  <!-- front pocket -->
  <rect x="20" y="33" width="24" height="17" rx="5" fill="url(#bpPocket)" stroke="#1F8278" stroke-width="1.2"/>
  <!-- pawprint -->
  <g fill="#FFFFFF" opacity=".96">
    <circle cx="32" cy="44" r="3.4"/>
    <ellipse cx="26.5" cy="40" rx="1.6" ry="2.1"/>
    <ellipse cx="37.5" cy="40" rx="1.6" ry="2.1"/>
    <ellipse cx="23"   cy="44" rx="1.4" ry="1.8"/>
    <ellipse cx="41"   cy="44" rx="1.4" ry="1.8"/>
  </g>
  <!-- glossy highlight -->
  <path d="M15 23 q4 -2 10 -1" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".55"/>
</svg>`;
}

/* Shuffle — two interlocking arrows with vapor trails. */
export function iconShuffle(size = 48) {
  return `
<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <linearGradient id="shufA" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#FF8C42"/>
      <stop offset="100%" stop-color="#FF4F84"/>
    </linearGradient>
    <linearGradient id="shufB" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#5DD0F2"/>
      <stop offset="100%" stop-color="#2EA8C7"/>
    </linearGradient>
    <radialGradient id="shufGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFE8B7" stop-opacity=".4"/>
      <stop offset="100%" stop-color="#FFE8B7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="32" cy="32" r="26" fill="url(#shufGlow)"/>
  <!-- arrow A: top-left to bottom-right curve -->
  <g stroke="url(#shufA)" stroke-width="5" stroke-linecap="round" fill="none">
    <path d="M14 22 q14 -8 26 6"/>
  </g>
  <path d="M44 30 l-2 -10 -10 4 z" fill="url(#shufA)" stroke="#D43A6B" stroke-width=".8" stroke-linejoin="round"/>
  <!-- arrow B: bottom-right to top-left curve -->
  <g stroke="url(#shufB)" stroke-width="5" stroke-linecap="round" fill="none">
    <path d="M50 42 q-14 8 -26 -6"/>
  </g>
  <path d="M20 34 l2 10 10 -4 z" fill="url(#shufB)" stroke="#1E8EAC" stroke-width=".8" stroke-linejoin="round"/>
  <!-- small spark accents -->
  <g fill="#FFE48E" stroke="#FFB400" stroke-width=".6">
    <path d="M9 30 L11 32 L9 34 L7 32 Z"/>
    <path d="M55 36 L57 38 L55 40 L53 38 Z"/>
  </g>
</svg>`;
}

export const itemIcons = {
  hint: iconHint,
  slot: iconExtraSlot,
  backpack: iconExtraSlot, // kept for backwards-compat — points to new icon
  shuffle: iconShuffle,
};

/* ============================================================
   MEDALS — tier-based achievement rosettes
   ============================================================ */

const TIER_PAL = {
  bronze:  { ringA:'#E0A56C', ringB:'#A86E36', gem:'#FFD9A0', text:'#7A4A1F' },
  silver:  { ringA:'#E1E6EC', ringB:'#9BA4AD', gem:'#FAFCFE', text:'#52606E' },
  gold:    { ringA:'#FFE89C', ringB:'#E5A91A', gem:'#FFF6BF', text:'#7A5500' },
  diamond: { ringA:'#BFEFFB', ringB:'#48A3C6', gem:'#E6FBFF', text:'#1F6F8B' },
};

/**
 * @param tier   bronze|silver|gold|diamond
 * @param glyph  emoji or short text shown at center
 * @param opts   { size, ribbon, done }
 */
export function medalSvg(tier, glyph, opts = {}) {
  const p = TIER_PAL[tier] || TIER_PAL.bronze;
  const size = opts.size || 64;
  const showRibbon = opts.ribbon !== false;
  const done = !!opts.done;

  // 12-point rosette path (procedural)
  const cx = 32, cy = 32, rOut = 28, rIn = 24;
  const points = 12;
  let petals = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    petals += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
  }
  petals += 'Z';

  const id = 'med-' + Math.random().toString(36).slice(2, 8);

  const ribbon = showRibbon ? `
    <path d="M20 54 L14 64 L24 60 L32 64 L40 60 L50 64 L44 54 Z"
          fill="${p.ringB}" stroke="${darken(p.ringB, .25)}" stroke-width="1" stroke-linejoin="round" opacity=".95"/>
  ` : '';

  const sparkle = done ? `
    <g fill="#FFFFFF" opacity=".85">
      <circle cx="48" cy="14" r="2.2"/>
      <circle cx="14" cy="42" r="1.4"/>
      <circle cx="50" cy="40" r="1.6"/>
    </g>` : '';

  return `
<svg viewBox="0 0 64 70" width="${size}" height="${size}" aria-hidden="true" class="medal-svg ${done?'is-done':''}">
  <defs>
    <linearGradient id="${id}-ring" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="${p.ringA}"/>
      <stop offset="100%" stop-color="${p.ringB}"/>
    </linearGradient>
    <radialGradient id="${id}-gem" cx="40%" cy="35%" r="65%">
      <stop offset="0%"  stop-color="#FFFFFF" stop-opacity=".95"/>
      <stop offset="55%" stop-color="${p.gem}" stop-opacity=".9"/>
      <stop offset="100%" stop-color="${p.ringA}" stop-opacity=".7"/>
    </radialGradient>
  </defs>
  ${ribbon}
  <!-- rosette -->
  <path d="${petals}" fill="url(#${id}-ring)" stroke="${darken(p.ringB, .35)}" stroke-width="1.2" stroke-linejoin="round"/>
  <!-- inner disc -->
  <circle cx="32" cy="32" r="19" fill="url(#${id}-gem)" stroke="${darken(p.ringB, .25)}" stroke-width=".9"/>
  <!-- shine arc -->
  <path d="M19 27 q4 -7 14 -8" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".65"/>
  ${sparkle}
  <!-- glyph -->
  <text x="32" y="40" font-size="22" text-anchor="middle"
        font-family="-apple-system, system-ui, sans-serif"
        style="paint-order: stroke; stroke: rgba(255,255,255,.6); stroke-width:.4">${glyph}</text>
</svg>`;
}

/* ============================================================
   ANIMALS — premium "sticker" frame around the emoji face
   ============================================================ */

/**
 * Returns an SVG sticker (gradient halo + glossy highlight + colored shadow + emoji glyph).
 * @param t    animal type id (0..49)
 * @param size pixel size
 * @param opts { plain:true to skip sparkles, rare:true to add starburst }
 */
export function animalSticker(t, size = 56, opts = {}) {
  const a = ANIMALS[t]; if (!a) return '';
  const id = 'ani-' + t + '-' + Math.random().toString(36).slice(2, 6);
  const rare = !!opts.rare;
  const plain = !!opts.plain;

  const sparkle = rare ? `
    <g fill="#FFE48E" stroke="#E29A0E" stroke-width=".5" opacity=".9">
      <path d="M10 14 L11 16 L10 18 L9 16 Z"/>
      <path d="M54 12 L55.5 14 L54 16 L52.5 14 Z"/>
      <path d="M50 50 L52 52 L50 54 L48 52 Z"/>
    </g>` : '';

  return `
<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="ani-svg ${rare?'is-rare':''}" aria-label="${a.n}">
  <defs>
    <radialGradient id="${id}-halo" cx="50%" cy="40%" r="60%">
      <stop offset="0%"  stop-color="${a.c2}" stop-opacity=".70"/>
      <stop offset="60%" stop-color="${a.c}"  stop-opacity=".25"/>
      <stop offset="100%" stop-color="${a.c}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-disc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="${a.bg}"/>
      <stop offset="55%" stop-color="${a.bg}"/>
      <stop offset="100%" stop-color="${a.c2}"/>
    </linearGradient>
    <linearGradient id="${id}-ring" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="${a.c2}"/>
      <stop offset="100%" stop-color="${a.c}"/>
    </linearGradient>
  </defs>
  <!-- soft outer halo -->
  ${plain ? '' : `<circle cx="32" cy="30" r="30" fill="url(#${id}-halo)"/>`}
  <!-- ground shadow -->
  <ellipse cx="32" cy="56" rx="18" ry="2.4" fill="${darken(a.c, .35)}" opacity=".25"/>
  <!-- disc -->
  <circle cx="32" cy="30" r="22" fill="url(#${id}-disc)" stroke="url(#${id}-ring)" stroke-width="2"/>
  <!-- glossy highlight -->
  <path d="M16 22 q4 -8 15 -8" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".55"/>
  ${sparkle}
  <!-- emoji face -->
  <text x="32" y="38" font-size="26" text-anchor="middle"
        font-family="-apple-system, 'Segoe UI Emoji', 'Apple Color Emoji', system-ui, sans-serif">${a.e}</text>
</svg>`;
}

/* Compact version for tube cells (54×34 area) — silhouette is wider than tall. */
export function animalCell(t) {
  const a = ANIMALS[t]; if (!a) return '';
  const id = 'cl-' + t + '-' + Math.random().toString(36).slice(2, 6);
  return `
<svg viewBox="0 0 64 40" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" class="cell-svg" aria-label="${a.n}">
  <defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="${a.bg}"/>
      <stop offset="100%" stop-color="${a.c2}"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="62" height="38" rx="10" fill="url(#${id}-bg)" stroke="${a.c}" stroke-opacity=".35" stroke-width="1.2"/>
  <path d="M5 6 q4 -4 14 -4" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none" opacity=".55"/>
  <text x="32" y="29" font-size="22" text-anchor="middle"
        font-family="-apple-system, 'Segoe UI Emoji', 'Apple Color Emoji', system-ui, sans-serif"
        style="paint-order:stroke;stroke:rgba(255,255,255,.45);stroke-width:.6">${a.e}</text>
</svg>`;
}

/* ============================================================
   UI accent icons (home top bar, nav, etc.)
   ============================================================ */

export function iconCoin(size = 22) {
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <radialGradient id="cnG" cx="35%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#FFF8B0"/>
      <stop offset="60%" stop-color="#FFD24A"/>
      <stop offset="100%" stop-color="#C58A16"/>
    </radialGradient>
  </defs>
  <circle cx="16" cy="16" r="13" fill="url(#cnG)" stroke="#8C5F0F" stroke-width="1.2"/>
  <circle cx="16" cy="16" r="9" fill="none" stroke="#8C5F0F" stroke-width=".8" opacity=".6"/>
  <path d="M11 11 q5 -4 10 0" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".75"/>
  <text x="16" y="20" font-size="11" text-anchor="middle" font-weight="900" fill="#8C5F0F"
        font-family="-apple-system, system-ui, sans-serif">¥</text>
</svg>`;
}

export function iconBgm(on, size = 22) {
  const col = on ? '#2EA5A0' : '#A09486';
  const wave = on ? `
    <path d="M22 11 q3 5 0 10" stroke="${col}" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M25 8 q5 8 0 16"  stroke="${col}" stroke-width="2" stroke-linecap="round" fill="none" opacity=".7"/>
  ` : `
    <path d="M22 11 l6 10 M28 11 l-6 10" stroke="${col}" stroke-width="2" stroke-linecap="round" fill="none"/>
  `;
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <path d="M8 12 h4 l6 -5 v18 l-6 -5 h-4 z" fill="${col}" stroke="${col}" stroke-width="1" stroke-linejoin="round"/>
  ${wave}
</svg>`;
}

export function iconGift(size = 22) {
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <linearGradient id="gftBox" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFB1C1"/>
      <stop offset="100%" stop-color="#E54B7B"/>
    </linearGradient>
    <linearGradient id="gftRib" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE89C"/>
      <stop offset="100%" stop-color="#E5A91A"/>
    </linearGradient>
  </defs>
  <rect x="5" y="13" width="22" height="14" rx="2.5" fill="url(#gftBox)" stroke="#C03363" stroke-width="1"/>
  <rect x="4" y="10" width="24" height="5" rx="1.6" fill="url(#gftBox)" stroke="#C03363" stroke-width="1"/>
  <rect x="14.5" y="10" width="3" height="17" fill="url(#gftRib)" stroke="#B58A26" stroke-width=".8"/>
  <path d="M16 10 q-5 -7 -8 -3 q3 5 8 3 z" fill="url(#gftRib)" stroke="#B58A26" stroke-width=".7"/>
  <path d="M16 10 q5 -7 8 -3 q-3 5 -8 3 z" fill="url(#gftRib)" stroke="#B58A26" stroke-width=".7"/>
</svg>`;
}

export function iconTrophy(size = 22) {
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <linearGradient id="trpG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE89C"/>
      <stop offset="100%" stop-color="#E5A91A"/>
    </linearGradient>
  </defs>
  <path d="M9 6 h14 v8 q0 6 -7 7 q-7 -1 -7 -7 z" fill="url(#trpG)" stroke="#8C5F0F" stroke-width="1.2"/>
  <path d="M9 8 q-5 0 -5 4 q0 4 5 5"  fill="none" stroke="#8C5F0F" stroke-width="1.4"/>
  <path d="M23 8 q5 0 5 4 q0 4 -5 5"  fill="none" stroke="#8C5F0F" stroke-width="1.4"/>
  <rect x="13" y="21" width="6" height="3" fill="#8C5F0F"/>
  <rect x="10" y="24" width="12" height="3" rx="1" fill="url(#trpG)" stroke="#8C5F0F" stroke-width="1.2"/>
  <path d="M11 9 q3 -2 8 -1" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".55"/>
</svg>`;
}

export function iconBook(size = 22) {
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <linearGradient id="bkG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF8C42"/>
      <stop offset="100%" stop-color="#C95A18"/>
    </linearGradient>
  </defs>
  <path d="M6 7 h9 q3 0 3 3 v17 q-3 -2 -7 -2 h-5 z" fill="url(#bkG)" stroke="#8C3D08" stroke-width="1.2"/>
  <path d="M26 7 h-9 q-3 0 -3 3 v17 q3 -2 7 -2 h5 z" fill="url(#bkG)" stroke="#8C3D08" stroke-width="1.2"/>
  <path d="M16 10 v15" stroke="#8C3D08" stroke-width=".8"/>
  <g fill="#FFFFFF" opacity=".6">
    <rect x="8.5" y="12" width="6" height="1" rx=".5"/>
    <rect x="8.5" y="15" width="6" height="1" rx=".5"/>
    <rect x="17.5" y="12" width="6" height="1" rx=".5"/>
    <rect x="17.5" y="15" width="6" height="1" rx=".5"/>
  </g>
</svg>`;
}

export function iconHome(size = 22) {
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <linearGradient id="hmG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFB57A"/>
      <stop offset="100%" stop-color="#E5722F"/>
    </linearGradient>
  </defs>
  <path d="M4 16 L16 5 L28 16 V27 q0 1 -1 1 H5 q-1 0 -1 -1 z" fill="url(#hmG)" stroke="#8C3D08" stroke-width="1.3" stroke-linejoin="round"/>
  <rect x="13" y="18" width="6" height="10" fill="#FFE7C5" stroke="#8C3D08" stroke-width=".9"/>
  <circle cx="17.5" cy="23" r=".7" fill="#8C3D08"/>
  <path d="M6 16 q5 -5 10 -7" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".55"/>
</svg>`;
}

export function iconShop(size = 22) {
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <linearGradient id="spA" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFD3A1"/>
      <stop offset="100%" stop-color="#FF8C42"/>
    </linearGradient>
  </defs>
  <path d="M4 9 h24 l-2 5 q-1 1 -2 1 h-16 q-1 0 -2 -1 z" fill="url(#spA)" stroke="#8C3D08" stroke-width="1.2" stroke-linejoin="round"/>
  <rect x="6" y="15" width="20" height="13" rx="2" fill="#FFE3C0" stroke="#8C3D08" stroke-width="1.2"/>
  <rect x="13" y="18" width="6" height="10" fill="#FF8C42" stroke="#8C3D08" stroke-width="1"/>
  <circle cx="18" cy="23" r=".7" fill="#8C3D08"/>
</svg>`;
}

export function iconShare(size = 22) {
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <circle cx="16" cy="16" r="12" fill="none" stroke="url(#shG)" stroke-width="2.2"/>
  <defs>
    <linearGradient id="shG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#48C9B0"/>
      <stop offset="100%" stop-color="#0E9D85"/>
    </linearGradient>
  </defs>
  <path d="M16 6 v10 M11 11 l5 -5 l5 5" fill="none" stroke="url(#shG)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 20 h12" stroke="url(#shG)" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="16" cy="24" r="1.2" fill="#0E9D85"/>
</svg>`;
}

export function iconBack(size = 22, color = '#FF6B81') {
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <path d="M20 7 L9 16 L20 25" fill="none" stroke="${color}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

export function iconUndo(size = 18) {
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <path d="M9 12 q6 -8 14 -2 q5 4 3 11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M5 7 L9 12 L14 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

export function iconReset(size = 18) {
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <path d="M6 16 a10 10 0 1 0 4 -8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M10 4 L10 11 L17 11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

export function iconStar(size = 18, filled = true) {
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <linearGradient id="stG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE89C"/>
      <stop offset="100%" stop-color="#E5A91A"/>
    </linearGradient>
  </defs>
  <path d="M16 3 L20 12 L29 13 L22 19 L24 28 L16 23 L8 28 L10 19 L3 13 L12 12 Z"
        fill="${filled?'url(#stG)':'rgba(255,255,255,.35)'}" stroke="${filled?'#8C5F0F':'#B5AFA5'}" stroke-width="1.4" stroke-linejoin="round"/>
</svg>`;
}

export function iconPaw(size = 22, color = '#FF8C42') {
  return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
  <g fill="${color}">
    <circle cx="16" cy="20" r="6"/>
    <ellipse cx="8"  cy="14" rx="2.6" ry="3.4"/>
    <ellipse cx="24" cy="14" rx="2.6" ry="3.4"/>
    <ellipse cx="11" cy="7"  rx="2.2" ry="2.8"/>
    <ellipse cx="21" cy="7"  rx="2.2" ry="2.8"/>
  </g>
</svg>`;
}

/* Mode-card hero icons (large, used on Home) */
export function iconModeClassic(size = 56) {
  return `
<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <radialGradient id="mcG" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity=".8"/>
      <stop offset="50%" stop-color="#FFE3C0" stop-opacity=".4"/>
      <stop offset="100%" stop-color="#FF8C42" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mcA" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFB57A"/>
      <stop offset="100%" stop-color="#E5722F"/>
    </linearGradient>
    <linearGradient id="mcB" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE0EA"/>
      <stop offset="100%" stop-color="#FF6B81"/>
    </linearGradient>
    <linearGradient id="mcC" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#C9F0FF"/>
      <stop offset="100%" stop-color="#45B7D1"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#mcG)"/>
  <!-- 3 mini tubes -->
  <g stroke="#FFFFFF" stroke-width=".8">
    <rect x="14" y="20" width="9" height="26" rx="3.5" fill="url(#mcA)"/>
    <rect x="27.5" y="20" width="9" height="26" rx="3.5" fill="url(#mcB)"/>
    <rect x="41" y="20" width="9" height="26" rx="3.5" fill="url(#mcC)"/>
  </g>
  <g fill="#FFFFFF" opacity=".5">
    <rect x="14.5" y="21" width="2.2" height="22" rx="1"/>
    <rect x="28"   y="21" width="2.2" height="22" rx="1"/>
    <rect x="41.5" y="21" width="2.2" height="22" rx="1"/>
  </g>
</svg>`;
}

export function iconModeSteps(size = 56) {
  return `
<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
  <defs>
    <radialGradient id="msG" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity=".8"/>
      <stop offset="50%" stop-color="#C9F0FF" stop-opacity=".4"/>
      <stop offset="100%" stop-color="#45B7D1" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="msA" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E6F5FA"/>
    </linearGradient>
    <radialGradient id="msB" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="60%" stop-color="#FF8C42"/>
      <stop offset="100%" stop-color="#C03363"/>
    </radialGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#msG)"/>
  <!-- dart board -->
  <circle cx="32" cy="32" r="20" fill="url(#msA)" stroke="#9DB3C5" stroke-width="1"/>
  <circle cx="32" cy="32" r="14" fill="none" stroke="#9DB3C5" stroke-width=".8"/>
  <circle cx="32" cy="32" r="8"  fill="none" stroke="#9DB3C5" stroke-width=".8"/>
  <circle cx="32" cy="32" r="5"  fill="url(#msB)" stroke="#C03363" stroke-width="1"/>
  <!-- dart -->
  <line x1="20" y1="18" x2="32" y2="32" stroke="#5A3520" stroke-width="2.2" stroke-linecap="round"/>
  <polygon points="14,12 22,14 16,20 18,22" fill="#FFD24A" stroke="#8C5F0F" stroke-width=".8"/>
  <polygon points="32,32 30,34 34,34" fill="#FF6B81"/>
</svg>`;
}

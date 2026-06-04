/* ==========================================================================
   AdManager — modular ad layer for monetization
   Supports: mock (dev), crazygames (auto-detect), wechat, pangle, ylh
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CONFIG — switch provider here when you're ready for real ads
   -------------------------------------------------------------------------- */
export const AD_CONFIG = {
  // "mock" | "crazygames" | "wechat" | "pangle" | "ylh"
  // NOTE: when CrazyGames SDK is detected, provider auto-switches to "crazygames"
  provider: 'mock',

  // Per-placement daily limits & cooldown (seconds between ads)
  placements: {
    revive:       { dailyLimit: 3,  cooldown: 30, label: 'Revive'       },
    doubleReward: { dailyLimit: 3,  cooldown: 0,  label: 'Double Reward'},
    dailyDouble:  { dailyLimit: 1,  cooldown: 0,  label: 'Double Daily' },
    achvDouble:   { dailyLimit: 3,  cooldown: 0,  label: '2x Achievement'},
    spinWheel:    { dailyLimit: 5,  cooldown: 0,  label: 'Lucky Spin'   },
  },

  // Replace these with your real ad-unit IDs when switching provider
  wechat: {
    revive:       'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    doubleReward: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    dailyDouble:  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    achvDouble:   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    spinWheel:    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  },
  pangle: {
    revive:       'xxxxxxxx',
    doubleReward: 'xxxxxxxx',
    dailyDouble:  'xxxxxxxx',
    achvDouble:   'xxxxxxxx',
    spinWheel:    'xxxxxxxx',
  },
  ylh: {
    revive:       'xxxxxxxx',
    doubleReward: 'xxxxxxxx',
    dailyDouble:  'xxxxxxxx',
    achvDouble:   'xxxxxxxx',
    spinWheel:    'xxxxxxxx',
  },
  // CrazyGames — no ad-unit IDs needed; placement maps to ad type internally
  crazygames: {},
};

/* --------------------------------------------------------------------------
   2. STATE — daily ad-watch tracking (persisted in localStorage)
   -------------------------------------------------------------------------- */
const STORAGE_KEY = 'ss_ad_state_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { date: '', counts: {} };
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

function ensureToday(state) {
  const today = new Date().toDateString();
  if (state.date !== today) {
    state.date = today;
    state.counts = {};
  }
  return state;
}

function getTodayCount(state, placement) {
  ensureToday(state);
  return state.counts[placement] || 0;
}

function incrementCount(state, placement) {
  ensureToday(state);
  state.counts[placement] = (state.counts[placement] || 0) + 1;
  saveState(state);
}

/* --------------------------------------------------------------------------
   3. PUBLIC API
   -------------------------------------------------------------------------- */

/**
 * Check if a placement can still be watched today.
 * @returns {number} remaining watches for today, or 0
 */
export function getAdRemaining(placement) {
  const cfg = AD_CONFIG.placements[placement];
  if (!cfg) return 0;
  const state = loadState();
  const used = getTodayCount(state, placement);
  return Math.max(0, cfg.dailyLimit - used);
}

/**
 * Check if the placement is currently in cooldown.
 * @returns {boolean}
 */
let _cooldowns = {};
export function isInCooldown(placement) {
  const cfg = AD_CONFIG.placements[placement];
  if (!cfg || !cfg.cooldown) return false;
  const until = _cooldowns[placement] || 0;
  return Date.now() < until;
}

function setCooldown(placement) {
  const cfg = AD_CONFIG.placements[placement];
  if (cfg && cfg.cooldown > 0) {
    _cooldowns[placement] = Date.now() + cfg.cooldown * 1000;
  }
}

/**
 * Show a rewarded video ad.
 *
 * @param {string} placement - key from AD_CONFIG.placements
 * @param {Function} onSuccess - called after user finishes watching
 * @param {Function} onFail    - called on error / ad not available
 * @param {Function} onClose   - called when ad closes (also called before onSuccess)
 *
 * Usage:
 *   import { showRewardedAd } from './ads.js';
 *   showRewardedAd('doubleReward',
 *     () => { // give coins },
 *     () => { showToast('Ad not available') }
 *   );
 */
export async function showRewardedAd(placement, onSuccess, onFail, onClose) {
  const cfg = AD_CONFIG.placements[placement];
  if (!cfg) {
    if (onFail) onFail('unknown_placement');
    return;
  }

  // Cooldown check
  if (isInCooldown(placement)) {
    if (onFail) onFail('cooldown');
    return;
  }

  // Daily limit check
  const state = loadState();
  const used = getTodayCount(state, placement);
  if (used >= cfg.dailyLimit) {
    if (onFail) onFail('daily_limit');
    return;
  }

  const provider = AD_CONFIG.provider;

  try {
    switch (provider) {
      /* ----- 微信小游戏激励视频 ----- */
      case 'wechat':
        await _wechatRewardedAd(placement, onSuccess, onFail, onClose);
        break;

      /* ----- 穿山甲 H5 ----- */
      case 'pangle':
        await _pangleRewardedAd(placement, onSuccess, onFail, onClose);
        break;

      /* ----- 优量汇 H5 ----- */
      case 'ylh':
        await _ylhRewardedAd(placement, onSuccess, onFail, onClose);
        break;

      /* ----- Mock (MVP / dev) ----- */
      case 'mock':
      default:
        await _mockRewardedAd(placement, onSuccess, onFail, onClose);
        break;

      /* ----- CrazyGames rewarded video ----- */
      case 'crazygames':
        await _crazygamesRewardedAd(placement, onSuccess, onFail, onClose);
        break;
    }

    // Track and cooldown on success
    incrementCount(state, placement);
    setCooldown(placement);

  } catch (err) {
    console.warn('[AdManager] ad failed:', err);
    if (onFail) onFail(err);
  }
}

/**
 * Refresh all ad button states on the page.
 * Call this after ad completion or page navigation.
 */
export function refreshAllAdButtons() {
  document.querySelectorAll('.ovl-btn.ads').forEach(btn => {
    const p = btn.dataset.adPlacement;
    if (!p) return;
    updateAdButton(btn, p);
  });
}

export function updateAdButton(el, placement) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return;

  const cfg = AD_CONFIG.placements[placement];
  if (!cfg) return;

  const remaining = getAdRemaining(placement);
  const cooldown = isInCooldown(placement);

  el.classList.remove('ads-loading', 'ads-disabled');

  if (remaining <= 0) {
    el.classList.add('ads-disabled');
    el.innerHTML = `⏳ ${cfg.label} (0 left today)`;
  } else if (cooldown) {
    el.classList.add('ads-disabled');
    el.innerHTML = `⏱ ${cfg.label} (cooling down)`;
  } else {
    el.innerHTML = `📺 ${cfg.label} (${remaining} left)`;
  }
}

/* --------------------------------------------------------------------------
   4. PROVIDER IMPLEMENTATIONS
   -------------------------------------------------------------------------- */

/* 4a. Mock — simulates ad playback (current MVP behavior) */
async function _mockRewardedAd(placement, onSuccess, onFail, onClose) {
  // UX: show a toast to simulate "watching"
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = '📺 Playing ad...';
  document.body.appendChild(toast);

  // Simulate ad duration (1.2s in dev, increase for realism)
  await new Promise(resolve => setTimeout(resolve, 1200));

  toast.remove();

  if (onClose) onClose();
  if (onSuccess) onSuccess();
}


/* 4b. 微信小游戏激励视频 — READY TO USE (swap provider to 'wechat')
   Docs: https://developers.weixin.qq.com/minigame/dev/api/ad/wx.createRewardedVideoAd.html

   Usage:
     1. In wechat-minigame, call wx.createRewardedVideoAd({ adUnitId: 'xxx' })
     2. Load + show in this function
     3. Requires wechat minigame runtime — won't work in browser
*/
let _wxVideos = {};
async function _wechatRewardedAd(placement, onSuccess, onFail, onClose) {
  if (typeof wx === 'undefined' || !wx.createRewardedVideoAd) {
    throw new Error('Not in WeChat minigame environment');
  }

  const adUnitId = AD_CONFIG.wechat[placement];
  if (!adUnitId || adUnitId.startsWith('xxx')) {
    throw new Error('Ad unit ID not configured for: ' + placement);
  }

  return new Promise((resolve, reject) => {
    try {
      let videoAd = _wxVideos[placement];
      if (!videoAd) {
        videoAd = wx.createRewardedVideoAd({ adUnitId });
        _wxVideos[placement] = videoAd;
      }

      videoAd.onClose(res => {
        if (res && res.isEnded) {
          if (onClose) onClose();
          if (onSuccess) onSuccess();
          resolve();
        } else {
          reject('ad_not_completed');
        }
      });

      videoAd.onError(err => {
        console.error('[AdManager] WeChat ad error:', err);
        reject(err);
      });

      videoAd.show().catch(() => {
        // Ad not ready, try to load then show
        videoAd.load()
          .then(() => videoAd.show())
          .catch(reject);
      });
    } catch (e) {
      reject(e);
    }
  });
}


/* 4c. 穿山甲 H5 激励视频 — INTEGRATION GUIDE
   Docs: https://www.pangleglobal.com/zh/integration/h5-rewarded-video

   Steps to integrate:
   1. 在 <head> 中加载穿山甲 SDK
   2. 初始化: new window.PangleRewardedAd({ slotId: 'xxx' })
   3. 调用 show() 展示广告
   4. 监听 onClose 回调判断是否看完

   当前为 stub 实现，接入时替换下方代码：
*/
async function _pangleRewardedAd(placement, onSuccess, onFail, onClose) {
  // TODO: Replace with real Pangle SDK integration
  //
  // const slotId = AD_CONFIG.pangle[placement];
  // const rewardedAd = new window.PangleRewardedAd({ slotId });
  //
  // return new Promise((resolve, reject) => {
  //   rewardedAd.onClose((status) => {
  //     if (status === 'completed') {
  //       if (onClose) onClose();
  //       if (onSuccess) onSuccess();
  //       resolve();
  //     } else {
  //       reject('ad_not_completed');
  //     }
  //   });
  //   rewardedAd.show().catch(reject);
  // });

  // Fallback — for now, use mock behavior
  throw new Error('Pangle not yet integrated. Set provider to "mock" or integrate SDK.');
}


/* 4d. 优量汇 H5 激励视频 — INTEGRATION GUIDE
   Docs: https://developers.adnet.qq.com/doc/web/js_develop

   Steps to integrate:
   1. 在 <head> 中加载优量汇 JS SDK
   2. 调用 TencentGDT.RewardVideoAd 创建广告实例
   3. 调用 show() 展示
   4. 监听回调

   当前为 stub 实现，接入时替换下方代码：
*/
async function _ylhRewardedAd(placement, onSuccess, onFail, onClose) {
  // TODO: Replace with real YLH SDK integration
  //
  // const slotId = AD_CONFIG.ylh[placement];
  //
  // return new Promise((resolve, reject) => {
  //   const rewardedAd = new TencentGDT.RewardVideoAd({
  //     slot_id: slotId,
  //     onClose: (status) => {
  //       if (status === 'complete') {
  //         if (onClose) onClose();
  //         if (onSuccess) onSuccess();
  //         resolve();
  //       } else {
  //         reject('ad_not_completed');
  //       }
  //     },
  //     onError: (err) => reject(err),
  //   });
  //   rewardedAd.show();
  // });

  // Fallback
  throw new Error('YLH not yet integrated. Set provider to "mock" or integrate SDK.');
}


/* 4e. CrazyGames — full rewarded + interstitial support
   Docs: https://developer.crazygames.com/sdk/html5
   Auto-detects when running inside CrazyGames iframe. */
let _cgReady = false;

export function initCrazyGames() {
  if (typeof window.CrazyGames === 'undefined' || !window.CrazyGames.SDK) {
    return; // Not running on CrazyGames — silently skip
  }
  try {
    window.CrazyGames.SDK.init();
    _cgReady = true;
    AD_CONFIG.provider = 'crazygames';
    console.log('[AdManager] CrazyGames SDK initialized');
  } catch (err) {
    console.warn('[AdManager] CrazyGames init failed:', err);
  }
}

export function loadingStarted() {
  if (!_hasCrazyGames()) return;
  try { window.CrazyGames.SDK.game.loadingStarted(); } catch (_) {}
}

export function loadingStopped() {
  if (!_hasCrazyGames()) return;
  try { window.CrazyGames.SDK.game.loadingStopped(); } catch (_) {}
}

function _hasCrazyGames() {
  return _cgReady && typeof window.CrazyGames !== 'undefined' && window.CrazyGames.SDK && window.CrazyGames.SDK.ad;
}

async function _crazygamesRewardedAd(placement, onSuccess, onFail, onClose) {
  if (!_hasCrazyGames()) {
    throw new Error('CrazyGames SDK not available');
  }
  return new Promise((resolve, reject) => {
    window.CrazyGames.SDK.ad.requestAd('rewarded', {
      adStarted: () => {},
      adFinished: () => {
        if (onClose) onClose();
        if (onSuccess) onSuccess();
        resolve();
      },
      adError: (err) => {
        reject(err || 'ad_error');
      }
    });
  });
}

/**
 * Show interstitial / midgame ad.
 * Safe to call anywhere — silently no-ops outside CrazyGames.
 * @param {Function} [onDone] — called when ad finishes or errors
 */
export async function showInterstitialAd(onDone) {
  if (!_hasCrazyGames()) {
    if (onDone) onDone();
    return;
  }
  window.CrazyGames.SDK.ad.requestAd('midgame', {
    adStarted: () => {},
    adFinished: () => { if (onDone) onDone(); },
    adError: ()   => { if (onDone) onDone(); }
  });
}

/**
 * Notify CrazyGames that gameplay started / stopped.
 * Safe to call anywhere — silently no-ops outside CrazyGames.
 */
export function gameplayStart() {
  if (!_hasCrazyGames()) return;
  try { window.CrazyGames.SDK.game.gameplayStart(); } catch (_) {}
}
export function gameplayStop() {
  if (!_hasCrazyGames()) return;
  try { window.CrazyGames.SDK.game.gameplayStop(); } catch (_) {}
}
export function gameplayHappytime() {
  if (!_hasCrazyGames()) return;
  try { window.CrazyGames.SDK.game.happytime(); } catch (_) {}
}

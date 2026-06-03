/* ==========================================================================
   Sorting Shelter Pro — i18n (Chinese / English)
   Auto-detects browser language on first load, persists choice.
   ========================================================================== */

// Current language: 'en' | 'zh'
export let LANG = 'en';

// All user-facing strings keyed by ID → { en, zh }
const T = {

  // ── Home ──
  home_title:        { en: 'Sorting Shelter',     zh: '分拣庇护所' },
  home_subtitle:     { en: 'Sort the critters, rescue them all!', zh: '整理小动物，拯救它们！' },
  home_collected:    { en: 'Collected',            zh: '已收集' },
  home_share_title:  { en: 'Share with friends',   zh: '分享给朋友' },

  // ── Mode cards ──
  mode_classic:      { en: 'Classic',              zh: '经典模式' },
  mode_steps:        { en: 'Steps',                zh: '步数模式' },
  mode_level_fmt:    { en: 'Level {n}',            zh: '第{n}关' },

  // ── Nav ──
  nav_home:          { en: 'Home',                 zh: '首页' },
  nav_collection:    { en: 'Collection',           zh: '图鉴' },
  nav_achieve:       { en: 'Achieve',              zh: '成就' },
  nav_shop:          { en: 'Shop',                 zh: '商店' },

  // ── Game HUD ──
  game_classic:      { en: 'Classic',              zh: '经典模式' },
  game_steps:        { en: 'Steps',                zh: '步数模式' },
  game_lvl:          { en: 'Lvl',                  zh: '第' },
  game_lvl_fmt:      { en: 'Lvl {n}',              zh: '第{n}关' },
  game_moves:        { en: 'moves',                zh: '步' },
  game_tutorial:     { en: 'Tutorial',             zh: '教程' },
  game_shop:         { en: 'Shop',                 zh: '商店' },
  steps_left_fmt:    { en: '{n} move{s} left',     zh: '剩余{n}步' },
  steps_bonus:       { en: 'bonus',                zh: '加成' },

  // ── Tutorial ──
  tut_how_to_play:   { en: 'How to Play',          zh: '玩法说明' },
  tut_skip:          { en: 'Skip',                 zh: '跳过' },
  tut_step1_title:   { en: 'Drag to Empty',        zh: '拖到空管' },
  tut_step1_desc:    { en: 'Drag the top animal onto the empty tube.',   zh: '把顶部动物拖到空试管上' },
  tut_step2_title:   { en: 'Match the Top',        zh: '匹配同类' },
  tut_step2_desc:    { en: 'Drag onto a tube where the top matches.',    zh: '拖到顶部动物相同的试管上' },
  tut_step3_title:   { en: 'Rescue Them!',          zh: '拯救它们！' },
  tut_step3_desc:    { en: 'Fill a tube with 4 matching to free them.',  zh: '集齐4只相同动物即可释放' },

  // ── Items ──
  item_hint:         { en: 'Hint',                 zh: '提示' },
  item_slot:         { en: 'Extra Slot',           zh: '额外槽' },
  item_shuffle:      { en: 'Shuffle',              zh: '洗牌' },

  // ── Controls ──
  ctrl_undo:         { en: 'Undo',                 zh: '撤销' },
  ctrl_reset:        { en: 'Reset',                zh: '重置' },

  // ── Win ──
  win_title:         { en: 'All Rescued!',         zh: '全部获救！' },
  win_sub:           { en: 'The animals are back in the wild!', zh: '动物们回到了大自然！' },
  win_next:          { en: 'Next Level',           zh: '下一关' },
  win_2x_reward:      { en: '2x Reward',          zh: '双倍奖励' },
  win_share:         { en: 'Share with Friends',   zh: '分享给朋友' },
  win_home:          { en: 'Home',                 zh: '首页' },
  win_coins:         { en: 'coins',                zh: '金币' },
  win_best:          { en: 'best',                 zh: '最佳' },
  win_stat_fmt:      { en: '{moves} (best {opt})', zh: '{moves} (最佳{opt})' },

  // ── Fail ──
  fail_title:        { en: 'Out of Moves!',        zh: '步数用完了！' },
  fail_sub:          { en: 'The animals are still waiting...', zh: '动物们还在等待……' },
  fail_retry:        { en: 'Retry',                zh: '重试' },
  fail_revive:       { en: 'Watch Ad to Revive',   zh: '看广告复活' },
  fail_needed_fmt:   { en: 'You needed about {n} more move{s} to finish.', zh: '大约还需要{n}步才能完成救援。' },
  fail_short:        { en: 'The rescue ran short — try again!', zh: '救援未能完成 — 再试一次！' },

  // ── Shop ──
  shop_title:        { en: 'Shop',                 zh: '商店' },
  shop_coins:        { en: 'coins',                zh: '金币' },
  shop_hint_name:    { en: 'Hint',                 zh: '提示' },
  shop_hint_desc:    { en: 'Highlight a valid move', zh: '高亮一个可移动位置' },
  shop_shuffle_name: { en: 'Shuffle',              zh: '洗牌' },
  shop_shuffle_desc: { en: 'Restart this level +5 extra steps (Steps mode)', zh: '重洗本关 +5额外步数 (步数模式)' },
  shop_slot_name:    { en: 'Extra Slot',           zh: '额外槽' },
  shop_slot_desc:    { en: 'Add a spare tube (+2 cells)', zh: '添加一个备用试管 (+2格)' },
  shop_own:          { en: 'Own',                  zh: '拥有' },

  // ── Daily ──
  daily_title:       { en: 'Daily Reward',         zh: '每日奖励' },
  daily_day_fmt:     { en: 'Day {n} Streak',       zh: '连续第{n}天' },
  daily_loyalty:     { en: 'Loyalty Tier',         zh: '忠诚等级' },
  daily_loyalty_desc:{ en: '+150 coins + 1 random item every day', zh: '每天 +150金币 + 随机道具1个' },
  daily_claim:       { en: 'Claim',                zh: '领取' },
  daily_2x:          { en: '2x Claim',             zh: '双倍领取' },
  daily_claimed:     { en: 'Claimed',              zh: '已领取' },
  daily_loyalty_btn: { en: 'Claim Loyalty Reward', zh: '领取忠诚奖励' },
  daily_day:         { en: 'Day',                  zh: '第' },
  daily_day_fmt2:    { en: 'Day {n}',              zh: '第{n}天' },

  // ── Collection ──
  coll_title:        { en: 'Collection',           zh: '图鉴' },
  coll_sub:          { en: 'Discover all the animal friends!', zh: '发现所有动物朋友！' },
  coll_new_header:   { en: 'New Discovery!',       zh: '新发现！' },
  coll_new_header_n: { en: 'New Discoveries!',     zh: '新发现！' },
  coll_awesome:      { en: 'Awesome!',             zh: '太棒了！' },
  coll_rescued:      { en: 'rescued total',        zh: '总计解救' },
  coll_region_prefix:{ en: '',                     zh: '' },

  // ── Achievements ──
  achv_title:        { en: 'Achievements',          zh: '成就' },
  achv_unlocked_fmt: { en: '{done} / {total} unlocked', zh: '已解锁 {done} / {total}' },
  achv_done:         { en: 'Done',                 zh: '已完成' },
  achv_pop_title:    { en: 'Achievement Unlocked!', zh: '成就解锁！' },
  achv_reward_label: { en: 'Reward',               zh: '奖励' },
  achv_claim:        { en: 'Claim',                zh: '领取' },
  achv_2x:           { en: '2x Reward',            zh: '双倍奖励' },
  achv_bronze:       { en: 'Bronze',               zh: '铜' },
  achv_silver:       { en: 'Silver',               zh: '银' },
  achv_gold:         { en: 'Gold',                 zh: '金' },
  achv_diamond:      { en: 'Diamond',              zh: '钻石' },

  // ── Coin History ──
  coin_title:        { en: 'Coin History',         zh: '金币记录' },
  coin_empty:        { en: 'No records yet — go win some coins!', zh: '暂无记录 — 快去赢金币吧！' },
  coin_just_now:     { en: 'just now',             zh: '刚刚' },
  coin_m_ago:        { en: '{n}m ago',             zh: '{n}分钟前' },
  coin_h_ago:        { en: '{n}h ago',             zh: '{n}小时前' },
  coin_d_ago:        { en: '{n}d ago',             zh: '{n}天前' },
  coin_net:          { en: 'Net',                  zh: '净收入' },

  // ── Share ──
  share_text:        { en: 'I just rescued {n} animals in Sorting Shelter Pro! Beat my score?',
                                                  zh: '我在分拣庇护所解救了{n}只动物！来挑战我？' },
  share_title:       { en: 'Sorting Shelter Pro',  zh: '分拣庇护所' },
  share_copied:      { en: 'Link copied — paste anywhere!', zh: '链接已复制 — 粘贴即可分享！' },
  share_fail:        { en: 'Could not copy link',  zh: '无法复制链接' },

  // ── Toast ──
  toast_revived:     { en: 'Revived! Keep going.', zh: '已复活！继续加油。' },
  toast_2x_bonus:    { en: '2x! bonus',            zh: '双倍！额外奖励' },
  toast_2x_daily:    { en: '2x Daily claimed!',    zh: '每日双倍已领取！' },
  toast_no_hints:    { en: 'No hints available',   zh: '暂无可用提示' },
  toast_slot_open:   { en: 'Extra slot opened (cap 2)', zh: '额外槽已打开 (容量2)' },
  toast_shuffled:    { en: 'Board shuffled!',      zh: '棋盘已洗牌！' },
  toast_shuffled_s:  { en: 'Shuffled +5 steps bonus!', zh: '已洗牌 +5步加成！' },
  toast_need_coins:  { en: 'Need {n} coins',       zh: '需要{n}金币' },
  toast_purchased:   { en: 'Purchased!',           zh: '已购买！' },
  toast_music_on:    { en: 'Music on',             zh: '音乐已开' },
  toast_music_off:   { en: 'Music off',            zh: '音乐已关' },
  toast_reset:       { en: 'All progress reset',   zh: '已重置所有进度' },
  toast_ad_unavail:  { en: 'Ad unavailable, try later', zh: '广告暂不可用，稍后再试' },
  toast_ad_limit:    { en: 'No more ads today',    zh: '今日广告次数已用完' },
  toast_ad_cooldown: { en: 'Please wait before next ad', zh: '请稍候再观看广告' },
  toast_claimed:     { en: 'Reward claimed!',      zh: '奖励已领取！' },
  toast_loyalty:     { en: 'Loyalty Reward',       zh: '忠诚奖励' },
  toast_achv:        { en: 'claimed!',             zh: '已领取！' },

  // ── Confirm ──
  confirm_reset:     { en: 'Reset all progress? This cannot be undone.', zh: '重置所有进度？此操作不可撤销。' },

  // ── Ads placeholder ──
  ad_loading:        { en: 'Loading ad…',          zh: '广告加载中…' },

  // ── Language toggle ──
  lang_en:           { en: 'EN',                   zh: 'EN' },
  lang_zh:           { en: '中文',                  zh: '中文' },
  lang_tooltip:      { en: 'Switch Language',      zh: '切换语言' },

  // ── Regions (localized) ──
  region_forest:     { en: 'Forest',               zh: '森林' },
  region_grassland:  { en: 'Grassland & Farm',     zh: '草原与农场' },
  region_rainforest: { en: 'Rainforest',           zh: '雨林' },
  region_ocean:      { en: 'Ocean & Polar',        zh: '海洋与极地' },
  region_mythical:   { en: 'Mythical & Rare',      zh: '神话与稀有' },

  // ── Achievement Category Names ──
  achv_cat_level:    { en: 'Level Journey',        zh: '关卡旅程' },
  achv_cat_combo:    { en: 'Combo',                zh: '连击' },
  achv_cat_star:     { en: 'Perfectionist',        zh: '完美主义' },
  achv_cat_rescue:   { en: 'Rescue',               zh: '救援' },
  achv_cat_collect:  { en: 'Collection',           zh: '图鉴' },
  achv_cat_steps:    { en: 'Steps',                zh: '步数' },
  achv_cat_general:  { en: 'General',              zh: '综合' },
  achv_cat_skill:    { en: 'Skill',                zh: '技巧' },

  // ── Shop item type names ──
  type_hint:         { en: 'hint',                 zh: '提示' },
  type_slot:         { en: 'Extra Slot',           zh: '额外槽' },
  type_shuffle:      { en: 'Shuffle',              zh: '洗牌' },

  // ── Coin sources ──
  coin_src_game:     { en: 'Level',                zh: '通关' },
  coin_src_ad:       { en: 'Ad Bonus',             zh: '广告奖励' },
  coin_src_daily:    { en: 'Daily',                zh: '每日签到' },
  coin_src_achv:     { en: 'Achievement',          zh: '成就' },
  coin_src_purchase: { en: 'Purchase',             zh: '购买' },
  coin_src_loyalty:  { en: 'Loyalty',              zh: '忠诚' },

  // ── Misc ──
  misc_close:        { en: 'Close',                zh: '关闭' },
  misc_share:        { en: 'Share',                zh: '分享' },
  misc_level:        { en: 'Level',                zh: '关卡' },
  combo_fmt:         { en: 'COMBO x{n}!',          zh: '连击 x{n}！' },
  loyalty_banner:    { en: 'Loyalty Tier · +150 coins + 1 random item every day',
                       zh: '忠诚等级 · 每日 +150金币 + 随机道具×1' },
  coin_detail_level: { en: '{mode} Lvl {lv} ({stars})',
                       zh: '{mode} 第{lv}关 ({stars})' },
  coin_detail_tutorial: { en: 'Tutorial Complete',   zh: '教程完成' },
  coin_detail_ad_2x:    { en: 'Ad 2x Reward',       zh: '广告双倍奖励' },
  coin_detail_daily_2x: { en: 'Daily 2x: Day {n}',  zh: '每日双倍：第{n}天' },
  coin_detail_signin:    { en: 'Day {n} Sign-in',    zh: '第{n}天签到' },
  coin_detail_loyalty:   { en: 'Day {n} Loyalty',    zh: '第{n}天忠诚奖励' },
  coin_detail_buy:       { en: 'Buy {item}',         zh: '购买{item}' },
  coin_detail_achv_2x:   { en: 'Achv 2x: {name}',    zh: '成就双倍：{name}' },

};

// ── Public API ──

/** Translate a key and optionally interpolate {n}, {s}, etc. */
export function t(key, vars = {}) {
  const entry = T[key];
  if (!entry) {
    console.warn(`[i18n] Missing key: ${key}`);
    return key;
  }
  let str = entry[LANG] || entry.en || key;
  // Simple interpolation: {name}
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return str;
}

/** Look up raw translation (for dynamic lookups, e.g. achievement names) */
export function raw(key, lang) {
  const entry = T[key];
  if (!entry) return null;
  return entry[lang || LANG] || entry.en || key;
}

/** Set language, persist, and trigger a full UI refresh. */
export function setLang(lang) {
  LANG = lang;
  try { localStorage.setItem('ss_lang', lang); } catch (_) {}
  // Fire a custom event so game.js can re-render everything
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  // Update all data-i18n elements on the page
  applyStaticI18n();
}

/** Walk all [data-i18n] elements and set their textContent. */
export function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    // Check for format vars stored as JSON in data-i18n-vars
    let vars = {};
    if (el.dataset.i18nVars) {
      try { vars = JSON.parse(el.dataset.i18nVars); } catch (_) {}
    }
    el.textContent = t(key, vars);
  });
  // Also update placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });
  // Update title attributes
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    el.title = t(key);
  });
  // Language toggle button visual
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) {
    langBtn.textContent = LANG === 'zh' ? '中' : 'EN';
    langBtn.title = t('lang_tooltip');
  }
}

// ── Auto-init ──
(function () {
  try {
    const saved = localStorage.getItem('ss_lang');
    if (saved === 'zh' || saved === 'en') {
      LANG = saved;
    } else {
      // Default to English
      LANG = 'en';
    }
  } catch (_) { LANG = 'en'; }
  // Apply on next microtask once DOM is parsed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyStaticI18n);
  } else {
    applyStaticI18n();
  }
})();

// Export as window globals for inline handlers
window.t = t;
window.setLang = setLang;
window.LANG = () => LANG;

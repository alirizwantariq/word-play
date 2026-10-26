/* ============================================================
   CHAIN REACTION WORDS - Game Engine
   Vanilla JS, no dependencies. Runs in any browser and inside
   the Android WebView shell.
   ============================================================ */

"use strict";

/* ---------------- Utilities ---------------- */

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

/* Deterministic PRNG so every level always shuffles the same way */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWith(arr, rnd) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(rnd() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { }
}

/* ---------------- Constants ---------------- */

var HINT_COST = 25;
var COINS_PER_STAR = 10;
var START_COINS = 60;

/* ---------------- Save state ---------------- */

var SAVE_KEY = "crw_save_v1";
var save = {
  coins: START_COINS,
  sound: true,
  stars: {},          /* "p0l3": 0..3 */
  bestEndless: 0,
  seenTutorial: false
};

function loadSave() {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      var data = JSON.parse(raw);
      if (data && typeof data === "object") {
        save.coins = (typeof data.coins === "number") ? data.coins : START_COINS;
        save.sound = (data.sound !== false);
        save.stars = data.stars || {};
        save.bestEndless = data.bestEndless || 0;
        save.seenTutorial = !!data.seenTutorial;
      }
    }
  } catch (e) { /* private mode / WebView issues: play without saving */ }
}

function saveNow() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { }
}

/* ---------------- Level helpers ---------------- */

var PACKS = window.CRW_PACKS;
var ALL_WORDS = [];
(function buildPool() {
  var seen = {};
  PACKS.forEach(function (p) {
    p.levels.forEach(function (chain) {
      chain.forEach(function (w) { if (!seen[w]) { seen[w] = 1; ALL_WORDS.push(w); } });
    });
  });
})();

function levelKey(p, l) { return "p" + p + "l" + l; }
function getStars(p, l) { return save.stars[levelKey(p, l)] || 0; }
function packCompleted(p) {
  var n = 0;
  for (var l = 0; l < PACKS[p].levels.length; l++) if (getStars(p, l) > 0) n++;
  return n;
}
function packUnlocked(p) {
  if (p === 0) return true;
  return packCompleted(p - 1) >= 7;
}
function levelUnlocked(p, l) {
  if (!packUnlocked(p)) return false;
  if (l === 0) return true;
  return getStars(p, l - 1) > 0;
}
function totalStars() {
  var t = 0;
  for (var k in save.stars) t += save.stars[k];
  return t;
}

/* ---------------- Screens ---------------- */

var currentScreen = "screen-home";

/* Activates the screen element with the given id (e.g. "screen-home",
   "duel-guess", "screen-hunt") and hides all others. */
function showScreen(id) {
  currentScreen = id;
  $$(".screen").forEach(function (el) {
    el.classList.toggle("active", el.id === id);
  });
}

/* ---------------- Toast ---------------- */

var toastTimer = null;
function toast(msg) {
  var t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
}

/* ---------------- HOME ---------------- */

function nextUnfinished() {
  for (var p = 0; p < PACKS.length; p++) {
    if (!packUnlocked(p)) continue;
    for (var l = 0; l < PACKS[p].levels.length; l++) {
      if (getStars(p, l) === 0 && levelUnlocked(p, l)) return { p: p, l: l };
    }
  }
  return null;
}

function renderHome() {
  showScreen("screen-home");

  /* word of the day */
  var wotd = window.WOTD_get();
  $("#wotd-word").textContent = wotd.w;
  $("#wotd-fact").textContent = wotd.f;

  $("#home-stars").textContent = "★ " + totalStars();
  $("#home-coins").textContent = save.coins;
  var nxt = nextUnfinished();
  $("#btn-continue").innerHTML =
    nxt ? "▶  CHAIN REACTION — LEVEL " + (nxt.l + 1) : "★  ALL LEVELS DONE!";
}

/* ---------------- PACKS ---------------- */

function renderPacks() {
  showScreen("screen-packs");
  var wrap = $("#packs-grid");
  wrap.innerHTML = "";
  $("#packs-stars").textContent = "★ " + totalStars();
  PACKS.forEach(function (pack, p) {
    var unlocked = packUnlocked(p);
    var done = packCompleted(p);
    var maxStars = pack.levels.length * 3;
    var earned = 0;
    pack.levels.forEach(function (c, l) { earned += getStars(p, l); });

    var card = document.createElement("button");
    card.className = "pack-card" + (unlocked ? "" : " locked");
    card.style.setProperty("--pk", pack.color);
    card.innerHTML =
      '<div class="pack-num">PACK ' + (p + 1) + '</div>' +
      '<div class="pack-name">' + pack.name + '</div>' +
      '<div class="pack-tag">' + pack.tagline + '</div>' +
      '<div class="pack-meta">★ ' + earned + '/' + maxStars + '</div>' +
      (unlocked ? "" :
        '<div class="pack-lock">' +
        '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M17 9V7a5 5 0 0 0-10 0v2H5v13h14V9h-2zm-8-2a3 3 0 0 1 6 0v2H9V7z"/></svg>' +
        '<span>Finish 7 levels<br>of the pack before</span></div>');
    if (unlocked) {
      card.addEventListener("click", function () {
        window.CRWAudio.click();
        renderLevels(p);
      });
    } else {
      card.addEventListener("click", function () {
        window.CRWAudio.wrong();
        toast("Complete 7 levels in the previous pack first!");
      });
    }
    wrap.appendChild(card);
  });
}

/* ---------------- LEVELS ---------------- */

var levelsPackIdx = 0;

function renderLevels(p) {
  levelsPackIdx = p;
  showScreen("screen-levels");
  var pack = PACKS[p];
  $("#levels-title").textContent = pack.name;
  $("#levels-title").style.setProperty("--pk", pack.color);
  var earned = 0;
  pack.levels.forEach(function (c, l) { earned += getStars(p, l); });
  $("#levels-stars").textContent = "★ " + earned + "/" + pack.levels.length * 3;

  var grid = $("#levels-grid");
  grid.innerHTML = "";
  pack.levels.forEach(function (chain, l) {
    var unlocked = levelUnlocked(p, l);
    var st = getStars(p, l);
    var btn = document.createElement("button");
    btn.className = "level-btn" + (unlocked ? "" : " locked");
    btn.style.setProperty("--pk", pack.color);
    btn.innerHTML =
      '<span class="level-num">' + (l + 1) + '</span>' +
      '<span class="level-stars">' +
      (st > 0 ? "★".repeat(st) + "<span class='off'>" + "★".repeat(3 - st) + "</span>" :
        (unlocked ? '<span class="off">☆☆☆</span>' : '')) +
      '</span>' +
      (unlocked ? "" : '<span class="level-lock"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M17 9V7a5 5 0 0 0-10 0v2H5v13h14V9h-2zm-8-2a3 3 0 0 1 6 0v2H9V7z"/></svg></span>');
    if (unlocked) {
      btn.addEventListener("click", function () {
        window.CRWAudio.click();
        startLevel(p, l);
      });
    } else {
      btn.addEventListener("click", function () {
        window.CRWAudio.wrong();
        toast("Finish the level before it first!");
      });
    }
    grid.appendChild(btn);
  });
}

/* ---------------- GAME ---------------- */

var G = null; /* current game state */

function tileClass(word) {
  var len = word.length;
  if (len <= 4) return " sz-a";
  if (len <= 6) return " sz-b";
  if (len <= 8) return " sz-c";
  return " sz-d";
}

function startLevel(p, l) {
  var pack = PACKS[p];
  var chain = pack.levels[l];
  var globalIdx = 0;
  for (var i = 0; i < p; i++) globalIdx += PACKS[i].levels.length;
  globalIdx += l;

  var rnd = mulberry32(p * 1000 + l + 7);
  var middles = chain.slice(1, chain.length - 1);
  var decoyCount = window.CRW_decoys(globalIdx);
  var inChain = {};
  chain.forEach(function (w) { inChain[w] = 1; });
  var pool = shuffleWith(ALL_WORDS.filter(function (w) { return !inChain[w]; }), rnd);
  var decoys = pool.slice(0, decoyCount);

  G = {
    mode: "level",
    packIdx: p,
    levelIdx: l,
    chain: chain,
    nextIdx: 1,
    lives: 3,
    score: 0,
    combo: 1,
    wrongCount: 0,
    hintGlowing: false,
    used: {},
    tiles: shuffleWith(middles.concat(decoys), rnd)
  };
  renderGame();
  if (!save.seenTutorial) openTutorial();
}

function startEndless() {
  G = {
    mode: "endless",
    lives: 3,
    score: 0,
    combo: 1,
    chainsDone: 0,
    wrongCount: 0,
    hintGlowing: false,
    used: {}
  };
  loadEndlessChain();
  renderGame();
}

function loadEndlessChain() {
  var rnd = mulberry32(Math.floor(Math.random() * 1e9));
  var p = Math.floor(rnd() * PACKS.length);
  var l = Math.floor(rnd() * PACKS[p].levels.length);
  var chain = PACKS[p].levels[l];
  var inChain = {};
  chain.forEach(function (w) { inChain[w] = 1; });
  var pool = shuffleWith(ALL_WORDS.filter(function (w) { return !inChain[w]; }), rnd);
  var decoys = pool.slice(0, 6);
  G.chain = chain;
  G.nextIdx = 1;
  G.used = {};
  G.tiles = shuffleWith(chain.slice(1, chain.length - 1).concat(decoys), rnd);
  G.wrongCount = 0;
  G.hintGlowing = false;
}

function renderGame() {
  showScreen("screen-game");
  var pack = G.mode === "level" ? PACKS[G.packIdx] : null;

  /* header */
  $("#game-label").innerHTML = G.mode === "level" ?
    '<b style="color:' + pack.color + '">PACK ' + (G.packIdx + 1) + '</b> · LEVEL ' + (G.levelIdx + 1) :
    '<b style="color:#FF5E78">ENDLESS</b> · CHAIN ' + (G.chainsDone + 1);
  renderHearts();
  $("#game-coins").textContent = save.coins;
  $("#game-score").textContent = G.score;
  updateCombo();

  /* chain strip */
  var strip = $("#chain-strip");
  strip.innerHTML = "";
  var startChip = document.createElement("div");
  startChip.className = "chip chip-start" + tileClass(G.chain[0]);
  startChip.textContent = G.chain[0];
  strip.appendChild(startChip);

  for (var i = 1; i < G.chain.length - 1; i++) {
    var slot = document.createElement("div");
    if (i < G.nextIdx) {
      slot.className = "chip chip-filled" +
        (i === G.nextIdx - 1 ? " new" : "") + " pop-in" + tileClass(G.chain[i]);
      slot.textContent = G.chain[i];
      slot.style.setProperty("--pk", (pack ? pack.color : "#FF5E78"));
    } else {
      slot.className = "chip slot" + tileClass(G.chain[i]);
    }
    strip.appendChild(slot);
  }
  var endChip = document.createElement("div");
  endChip.className = "chip chip-end" + tileClass(G.chain[G.chain.length - 1]);
  endChip.textContent = G.chain[G.chain.length - 1];
  strip.appendChild(endChip);
  strip.scrollLeft = strip.scrollWidth;

  /* prompt */
  var cur = G.chain[G.nextIdx - 1];
  $("#game-prompt").innerHTML = 'Find the word that links to <span class="cur">' + cur + '</span>';

  /* grid */
  var grid = $("#tile-grid");
  grid.innerHTML = "";
  var visTiles = G.tiles.filter(function (w) { return !G.used[w]; });
  var cols = visTiles.length <= 6 ? 3 : 4;
  grid.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
  visTiles.forEach(function (word, idx) {
    var b = document.createElement("button");
    b.className = "tile tint-" + (idx % 5) + tileClass(word);
    b.textContent = word;
    b.dataset.word = word;
    b.addEventListener("pointerdown", function (ev) {
      tapTile(word, b, ev);
    });
    grid.appendChild(b);
  });
}

function renderHearts() {
  var el = $("#game-hearts");
  el.innerHTML = "";
  for (var i = 0; i < 3; i++) {
    var h = document.createElement("span");
    h.className = "heart" + (i < G.lives ? "" : " lost");
    h.textContent = "♥";
    el.appendChild(h);
  }
}

function updateCombo() {
  var el = $("#combo-pill");
  if (G.combo >= 2) {
    el.style.display = "inline-flex";
    el.textContent = "COMBO ×" + G.combo;
    el.classList.remove("bump");
    void el.offsetWidth; /* restart animation */
    el.classList.add("bump");
  } else {
    el.style.display = "none";
  }
}

function scorePop(x, y, txt) {
  var pop = document.createElement("div");
  pop.className = "score-pop";
  pop.textContent = txt;
  pop.style.left = (x - 40) + "px";
  pop.style.top = (y - 30) + "px";
  $("#screen-game").appendChild(pop);
  setTimeout(function () { pop.remove(); }, 900);
}

function tapTile(word, tileEl, ev) {
  if (!G || tileEl.classList.contains("used")) return;
  window.CRWAudio.init();

  if (word === G.chain[G.nextIdx]) {
    /* ---------- CORRECT ---------- */
    G.combo = G.combo + 1;
    var gained = 100 * (G.combo - 1);
    G.score += gained;
    G.nextIdx++;
    G.used[word] = true;
    tileEl.classList.add("used");
    tileEl.classList.remove("hint-glow");
    G.hintGlowing = false;
    window.CRWAudio.correct(G.combo);
    window.CRWAudio.place();
    vibrate(18);
    scorePop((ev && ev.clientX ? ev.clientX : window.innerWidth / 2),
      (ev && ev.clientY ? ev.clientY : window.innerHeight / 2), "+" + gained);
    renderGame();

    if (G.nextIdx >= G.chain.length - 1) {
      if (G.mode === "level") levelComplete();
      else endlessChainComplete();
    }
  } else {
    /* ---------- WRONG ---------- */
    G.lives--;
    G.combo = 1;
    G.wrongCount++;
    tileEl.classList.add("shake");
    setTimeout(function () { tileEl.classList.remove("shake"); }, 450);
    window.CRWAudio.wrong();
    vibrate([40, 60, 40]);
    renderHearts();
    updateCombo();
    if (G.wrongCount >= 2 && !G.hintGlowing) glowHint();
    if (G.lives <= 0) {
      if (G.mode === "level") setTimeout(openFail, 550);
      else setTimeout(openGameOver, 550);
    }
  }
}

function glowHint() {
  var need = G.chain[G.nextIdx];
  $$("#tile-grid .tile").forEach(function (t) {
    if (t.dataset.word === need && !t.classList.contains("used")) {
      t.classList.add("hint-glow");
      G.hintGlowing = true;
    }
  });
}

function useHint() {
  if (!G || G.mode && G.nextIdx >= G.chain.length - 1) return;
  if (save.coins < HINT_COST) {
    window.CRWAudio.wrong();
    toast("Not enough coins! Earn stars to get more.");
    return;
  }
  save.coins -= HINT_COST;
  saveNow();
  $("#game-coins").textContent = save.coins;
  window.CRWAudio.coin();
  glowHint();
}

/* ---------------- Level results ---------------- */

function levelComplete() {
  var stars = Math.max(1, G.lives);                 /* 3 lives -> 3 stars */
  var coins = stars * COINS_PER_STAR;
  var key = levelKey(G.packIdx, G.levelIdx);
  var firstTime = getStars(G.packIdx, G.levelIdx) === 0;
  save.stars[key] = Math.max(getStars(G.packIdx, G.levelIdx), stars);
  save.coins += coins;
  saveNow();
  window.CRWAudio.win();
  vibrate([30, 50, 30, 50, 60]);
  openWin(stars, coins, firstTime);
}

function endlessChainComplete() {
  G.chainsDone++;
  G.score += 200;
  save.coins += 5;
  saveNow();
  window.CRWAudio.win();
  vibrate([30, 50, 30]);
  toast("Chain complete! +200 pts, +5 coins");
  setTimeout(function () {
    loadEndlessChain();
    renderGame();
  }, 700);
}

/* ---------------- Overlays ---------------- */

function openOverlay(html, opts) {
  var ov = $("#overlay");
  ov.innerHTML = '<div class="card">' + html + '</div>' +
    (opts && opts.confetti ? '<canvas id="confetti"></canvas>' : '');
  ov.classList.add("show");
  if (opts && opts.confetti) startConfetti();
}

function closeOverlay() {
  var ov = $("#overlay");
  if (!ov.classList.contains("show")) return false;
  ov.classList.remove("show");
  ov.innerHTML = "";
  return true;
}

function openWin(stars, coins, firstTime) {
  var p = G.packIdx, l = G.levelIdx;
  var isLastOfPack = l === PACKS[p].levels.length - 1;
  var isLastOverall = p === PACKS.length - 1 && isLastOfPack;
  var title = isLastOverall ? "🏆  GAME COMPLETE!" :
    (isLastOfPack ? "PACK COMPLETE!" : "CHAIN COMPLETE!");
  var starsHtml = "";
  for (var i = 0; i < 3; i++) {
    starsHtml += '<span class="big-star ' + (i < stars ? "on" : "off") +
      '" style="animation-delay:' + (i * 0.25) + 's">★</span>';
  }
  var next = "";
  if (!isLastOverall) next =
    '<button id="ov-next" class="btn primary big">NEXT ▶</button>';
  openOverlay(
    '<div class="ov-title">' + title + '</div>' +
    '<div class="ov-stars">' + starsHtml + '</div>' +
    '<div class="ov-score">' + G.score + '<span> pts</span></div>' +
    '<div class="ov-coins">+' + coins + ' coins</div>' +
    '<div class="ov-btns">' + next +
    '<button id="ov-replay" class="btn ghost">↻ REPLAY</button>' +
    '<button id="ov-home" class="btn ghost">HOME</button></div>',
    { confetti: true }
  );
  var playStarSound = function (n) {
    if (n < stars) { window.CRWAudio.star(n); setTimeout(function () { playStarSound(n + 1); }, 300); }
  };
  playStarSound(0);
  $("#ov-replay").addEventListener("click", function () { closeOverlay(); startLevel(p, l); });
  $("#ov-home").addEventListener("click", function () { closeOverlay(); renderHome(); });
  var nxt = $("#ov-next");
  if (nxt) nxt.addEventListener("click", function () {
    closeOverlay();
    if (isLastOfPack) renderPacks();
    else startLevel(p, l + 1);
  });
}

function openFail() {
  window.CRWAudio.lose();
  openOverlay(
    '<div class="ov-title bad">CHAIN BROKEN!</div>' +
    '<div class="ov-text">Out of hearts. Want to try again?</div>' +
    '<div class="ov-btns">' +
    '<button id="ov-retry" class="btn primary big">↻ RETRY</button>' +
    '<button id="ov-home" class="btn ghost">HOME</button></div>'
  );
  $("#ov-retry").addEventListener("click", function () {
    closeOverlay(); startLevel(G.packIdx, G.levelIdx);
  });
  $("#ov-home").addEventListener("click", function () { closeOverlay(); renderHome(); });
}

function openGameOver() {
  var best = Math.max(save.bestEndless, G.score);
  var newBest = G.score > save.bestEndless && G.score > 0;
  save.bestEndless = best;
  saveNow();
  window.CRWAudio.lose();
  openOverlay(
    '<div class="ov-title bad">GAME OVER</div>' +
    '<div class="ov-score">' + G.score + '<span> pts</span></div>' +
    '<div class="ov-text">' + (newBest ? "🎉 New best score!" :
      "Best: " + best + " pts") + '</div>' +
    '<div class="ov-btns">' +
    '<button id="ov-again" class="btn primary big">↻ PLAY AGAIN</button>' +
    '<button id="ov-home" class="btn ghost">HOME</button></div>'
  );
  $("#ov-again").addEventListener("click", function () { closeOverlay(); startEndless(); });
  $("#ov-home").addEventListener("click", function () { closeOverlay(); renderHome(); });
}

function openTutorial() {
  save.seenTutorial = true;
  saveNow();
  openOverlay(
    '<div class="ov-title">HOW TO PLAY</div>' +
    '<div class="tut-chain">' +
    '<span class="chip chip-start sz-b" style="font-size:15px">BREAD</span>' +
    '<span class="tut-arrow">→</span>' +
    '<span class="chip chip-filled sz-b" style="font-size:15px">BUTTER</span>' +
    '<span class="tut-arrow">→</span>' +
    '<span class="chip chip-filled sz-b" style="font-size:15px">MILK</span>' +
    '<span class="tut-arrow">→</span>' +
    '<span class="chip chip-end sz-b" style="font-size:15px">MOON</span>' +
    '</div>' +
    '<div class="ov-text">Tap the word that <b>links</b> to the previous one.<br>' +
    'Bread → <b>butter</b> → <b>milk</b> → <b>cow</b>… the cow jumps over the <b>moon</b>!</div>' +
    '<div class="ov-text small">Build the chain from the green chip to the pink chip.<br>' +
    'A wrong tap costs a ♥ heart. Stuck? Use a hint!</div>' +
    '<button id="ov-go" class="btn primary big">GOT IT!</button>'
  );
  $("#ov-go").addEventListener("click", function () {
    window.CRWAudio.click();
    closeOverlay();
  });
}

function openHuntModePicker() {
  var boost = { on: false };
  openOverlay(
    '<div class="ov-title">WORD HUNT</div>' +
    '<div class="ov-text small">Pick your challenge — 6 words, find them all!</div>' +
    '<div class="mode-pick">' +
    '<button id="hunt-mode-btn-0" class="btn primary big">⚡ BLITZ<br>' +
    '<span class="btn-sub">30 seconds — hints every 5s</span></button>' +
    '<button id="hunt-mode-btn-1" class="btn secondary">🏃 RUSH<br>' +
    '<span class="btn-sub">60 seconds — hints every 8s</span></button>' +
    '<button id="hunt-mode-btn-2" class="btn secondary">🧘 CLASSIC<br>' +
    '<span class="btn-sub">90 seconds — hints every 12s</span></button>' +
    '</div>' +
    '<button id="hunt-boost" class="btn hint">✨ Letter hints: OFF — tap to watch a short ad &amp; enable</button>'
  );
  var boostBtn = $("#hunt-boost");
  boostBtn.addEventListener("click", function () {
    if (boost.on) return;
    requestAd(function () {
      boost.on = true;
      boostBtn.textContent = "✨ Letter hints: ON for this game!";
      boostBtn.classList.add("on");
      toast("Random letters will glow to help you ✨");
    });
  });
  [0, 1, 2].forEach(function (idx) {
    $("#hunt-mode-btn-" + idx).addEventListener("click", function () {
      window.CRWAudio.click();
      save.huntMode = idx;
      saveNow();
      var b = boost.on;
      closeOverlay();
      showScreen("screen-hunt");
      WordHunt.start(null, idx, b);
    });
  });
}

function openSettings() {
  window.CRWAudio.click();
  openOverlay(
    '<div class="ov-title">SETTINGS</div>' +
    '<div class="set-row"><span>Sound</span>' +
    '<button id="set-sound" class="switch ' + (save.sound ? "on" : "") + '">' +
    '<i></i></button></div>' +
    '<div class="set-row"><span>Best endless score</span><b>★ ' + save.bestEndless + '</b></div>' +
    '<div class="set-row"><span>Best word hunt score</span><b>★ ' + (save.huntBest || 0) + '</b></div>' +
    '<button id="set-reset" class="btn danger">Reset all progress</button>' +
    '<div class="ov-text small">Word Play v2.0.0<br>3 word games · works offline · optional ads</div>' +
    '<button id="set-close" class="btn ghost">CLOSE</button>'
  );
  $("#set-sound").addEventListener("click", function () {
    save.sound = !save.sound;
    saveNow();
    window.CRWAudio.setEnabled(save.sound);
    this.classList.toggle("on", save.sound);
    if (save.sound) { window.CRWAudio.init(); window.CRWAudio.click(); }
  });
  $("#set-reset").addEventListener("click", function () {
    if (this.dataset.confirm) {
      localStorage.removeItem(SAVE_KEY);
      save = { coins: START_COINS, sound: true, stars: {}, bestEndless: 0, seenTutorial: true };
      saveNow();
      closeOverlay();
      renderHome();
      toast("Progress reset");
    } else {
      this.dataset.confirm = "1";
      this.textContent = "Tap again to confirm";
    }
  });
  $("#set-close").addEventListener("click", function () { closeOverlay(); });
}

/* ---------------- Confetti ---------------- */

function startConfetti() {
  var cv = $("#confetti");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  cv.width = cv.offsetWidth;
  cv.height = cv.offsetHeight;
  var colors = ["#FF8A3D", "#FFD447", "#FF5E78", "#4ECDC4", "#B479FF", "#6BCB77"];
  var parts = [];
  for (var i = 0; i < 140; i++) {
    parts.push({
      x: Math.random() * cv.width,
      y: -20 - Math.random() * cv.height * 0.5,
      w: 6 + Math.random() * 7,
      h: 8 + Math.random() * 8,
      c: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 3,
      vx: -1.5 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: -0.15 + Math.random() * 0.3
    });
  }
  var running = true;
  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      if (p.y > cv.height + 30) { p.y = -20; p.x = Math.random() * cv.width; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    requestAnimationFrame(frame);
  }
  frame();
  setTimeout(function () { running = false; }, 6000);
}

/* ---------------- Rewarded ads (optional) ----------------
   In the Android app the native side shows an AdMob rewarded ad
   and calls window.__adReward(true/false). In a browser there is
   no ad network, so the reward is granted directly for testing. */

function addCoins(n) {
  save.coins += n;
  saveNow();
  var chip = $("#home-coins");
  if (chip) chip.textContent = save.coins;
  var gchip = $("#game-coins");
  if (gchip) gchip.textContent = save.coins;
  window.CRWAudio.coin();
}

var pendingAdReward = null;

/* Generic rewarded-ad request; onReward(true) fires when the ad completes. */
function requestAd(onReward) {
  window.CRWAudio.click();
  if (window.AndroidBridge && window.AndroidBridge.showRewardedAd) {
    pendingAdReward = onReward;
    window.AndroidBridge.showRewardedAd();
  } else {
    /* browser dev fallback: pretend the ad played */
    onReward(true);
  }
}

window.__adReward = function (ok) {
  var cb = pendingAdReward;
  pendingAdReward = null;
  if (!cb) {                          /* default reward: coins */
    if (ok) { addCoins(100); toast("+100 coins! ⚡"); }
    else toast("Ad not ready yet — try again in a moment");
    return;
  }
  if (ok) cb(true);
  else toast("Ad not ready yet — try again in a moment");
};

function watchAd() {
  requestAd(function () { addCoins(100); toast("+100 coins! ⚡"); });
}

/* ---------------- Android back button ---------------- */

window.__crwBack = function () {
  if (closeOverlay()) return;
  if (currentScreen.indexOf("duel-") === 0) {
    if (currentScreen === "duel-guess" || currentScreen === "duel-write") toast("Duel ended");
    WordDuel.leave();
    renderHome();
    return;
  }
  if (currentScreen === "screen-hunt") { WordHunt.leave(); renderHome(); return; }
  if (currentScreen === "screen-game") { renderHome(); return; }
  if (currentScreen === "screen-levels") { renderPacks(); return; }
  if (currentScreen === "screen-packs") { renderHome(); return; }
  if (window.AndroidBridge && window.AndroidBridge.exitApp) {
    window.AndroidBridge.exitApp();
  }
};

/* ---------------- Demo mode (for screenshots) ---------------- */

function applyDemoSave() {
  /* fake progress so screenshots look alive */
  var seeds = [
    [3, 2, 3, 3, 3, 2, 3, 3, 2, 3],
    [3, 3, 2, 3, 0, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  seeds.forEach(function (arr, p) {
    arr.forEach(function (s, l) {
      if (s > 0) save.stars[levelKey(p, l)] = s;
    });
  });
  save.coins = 240;
  save.seenTutorial = true;
}

function demoFill(n) {
  for (var i = 0; i < n; i++) {
    var need = G.chain[G.nextIdx];
    var el = $$("#tile-grid .tile").filter(function (t) { return t.dataset.word === need; })[0];
    if (el) tapTile(need, el, null);
  }
}

function runDemo() {
  var qs = new URLSearchParams(location.search);
  var demo = qs.get("demo");
  if (!demo) return false;
  if (demo === "test") { runTests(); return true; }
  if (demo === "verify") { runDataTests(); return true; }
  applyDemoSave();

  if (demo === "home") { renderHome(); }
  else if (demo === "packs") { renderPacks(); }
  else if (demo === "levels") { renderLevels(1); }
  else if (demo === "play") {
    startLevel(1, 3);                     /* SHOE LACE CURTAIN CALL PHONE */
    demoFill(1);                          /* LACE placed */
    G.score = 350; G.combo = 2;
    $("#game-score").textContent = G.score;
    updateCombo();
  }
  else if (demo === "win") {
    startLevel(0, 1);                     /* SUN HOT COLD ICE CREAM */
    G.score = 620;
    demoFill(3);
  }
  else if (demo === "endless") {
    startEndless();
    G.chainsDone = 2; G.score = 1450; G.lives = 2;
    demoFill(2);
    renderHearts();
    $("#game-score").textContent = G.score;
  }
  else if (demo === "gameover") {
    startEndless();
    G.score = 2340; G.lives = 0;
    save.bestEndless = 3110;
    openGameOver();
  }
  else if (demo === "duelwrite") { WordDuel._demo("write"); }
  else if (demo === "duel") { WordDuel._demo("guess"); }
  else if (demo === "hunt") {
    showScreen("screen-hunt");
    WordHunt._demo();
  }
  else { renderHome(); }
  return true;
}

/* ---------------- Self-tests (run with ?demo=test) ---------------- */

function runTests() {
  var log = [];
  function T(name, cond) { log.push((cond ? "PASS" : "FAIL") + " " + name); }
  function tapCorrect() {
    var need = G.chain[G.nextIdx];
    var el = $$("#tile-grid .tile").filter(function (t) { return t.dataset.word === need; })[0];
    tapTile(need, el, null);
  }

  save.seenTutorial = true;

  /* --- level flow: BREAD BUTTER MILK COW MOON --- */
  startLevel(0, 0);
  T("level starts", G && G.chain[0] === "BREAD" && G.nextIdx === 1 && G.lives === 3);
  T("start word not a tile", !$$("#tile-grid .tile").some(function (t) { return t.dataset.word === "BREAD"; }));

  tapCorrect();
  T("correct tap places word", G.nextIdx === 2 && !!G.used["BUTTER"]);
  T("combo increments", G.combo === 2);
  T("score 100", G.score === 100);
  T("used word removed from grid", !$$("#tile-grid .tile").some(function (t) { return t.dataset.word === "BUTTER"; }));

  var wrongTile = $$("#tile-grid .tile").filter(function (t) { return t.dataset.word !== G.chain[G.nextIdx]; })[0];
  tapTile(wrongTile.dataset.word, wrongTile, null);
  T("wrong tap costs a life", G.lives === 2);
  T("wrong tap resets combo", G.combo === 1);

  var coinsBefore = save.coins;
  useHint();
  T("hint costs 25 coins", save.coins === coinsBefore - 25);
  T("hint glows correct tile", G.hintGlowing === true);

  while (G.nextIdx < G.chain.length - 1) tapCorrect();
  T("win overlay shown", $("#overlay").classList.contains("show"));
  T("2 stars for 1 wrong tap", getStars(0, 0) === 2);
  T("coins awarded 20", save.coins === coinsBefore - 25 + 20);
  closeOverlay();

  /* --- unlock logic --- */
  T("level 2 unlocked", levelUnlocked(0, 1) === true);
  T("level 3 locked", levelUnlocked(0, 2) === false);
  T("pack 2 locked", packUnlocked(1) === false);
  for (var l = 0; l < 7; l++) save.stars[levelKey(0, l)] = 1;
  T("pack 2 unlocked at 7 done", packUnlocked(1) === true);
  T("pack 3 still locked", packUnlocked(2) === false);

  /* --- endless --- */
  startEndless();
  T("endless starts", G.mode === "endless" && G.lives === 3);
  var scoreBefore = G.score;
  while (G.nextIdx < G.chain.length - 1) tapCorrect();
  T("endless chain done", G.chainsDone === 1);
  T("endless bonus score", G.score >= scoreBefore + 200);

  /* --- Word Duel v2: Guess the Word (full 2-player flow) --- */
  WordDuel.start();
  T("duel setup shown", document.getElementById("duel-setup").classList.contains("active"));
  WordDuel.begin();
  T("duel write shown", document.getElementById("duel-write").classList.contains("active"));
  T("5 categories offered",
    document.querySelectorAll("#duel-cats .cat-chip").length === 5);
  document.querySelectorAll("#duel-cats .cat-chip")[0].click();
  T("category selectable", WordDuel._state().players[0].cat === "ANIMAL");

  /* live dictionary suggestions while typing */
  document.getElementById("duel-input").value = "TA";
  WordDuel.renderWrite();
  T("live suggestions while typing",
    document.querySelectorAll("#duel-suggestions .sugg-chip").length > 0);

  /* THE regression test: lowercase input must store uppercase */
  document.getElementById("duel-input").value = "butter";
  WordDuel.confirmWord();
  T("word stored uppercase (bug fix)", WordDuel._state().players[0].word === "BUTTER");
  T("duel pass shown", document.getElementById("duel-pass").classList.contains("active"));

  WordDuel.passAction();                 /* player 2 writes */
  T("p2 writing now", WordDuel._state().writerIdx === 1);
  document.getElementById("duel-input").value = "BUTTER";
  WordDuel.confirmWord();
  T("duplicate word rejected", WordDuel._state().writerIdx === 1);
  document.getElementById("duel-input").value = "DRAGON";
  WordDuel.confirmWord();
  WordDuel.passAction();                 /* all words written -> guessing */
  T("duel guess shown", document.getElementById("duel-guess").classList.contains("active"));
  T("target is p1 word", WordDuel._state().word === "BUTTER");
  T("keyboard has 26 keys", document.querySelectorAll("#duel-keyboard .key").length === 26);

  var h0 = WordDuel._state().hearts;
  WordDuel.guessLetter("Z");
  T("wrong letter pops a heart", WordDuel._state().hearts === h0 - 1);
  T("banter callout shown",
    document.getElementById("duel-callout").classList.contains("show"));

  var p2s0 = WordDuel._state().players[1].score;
  WordDuel.guessLetter("B");
  T("correct letter reveals blank",
    document.querySelectorAll("#duel-blanks .blank.on").length === 1);
  T("single letter scores 5", WordDuel._state().players[1].score === p2s0 + 5);
  WordDuel.guessLetter("T");
  T("double letter scores 10", WordDuel._state().players[1].score === p2s0 + 15);
  WordDuel.guessLetter("U");
  WordDuel.guessLetter("E");
  WordDuel.guessLetter("R");
  T("solve bonus +20", WordDuel._state().players[1].score === p2s0 + 50);
  T("solved flag set", WordDuel._state().solved === true);

  WordDuel._nextWord();                  /* intermission between words */
  T("intermission pass shown",
    document.getElementById("duel-pass").classList.contains("active"));
  WordDuel.passAction();
  T("second word up", WordDuel._state().word === "DRAGON");
  T("solved banner cleared for next word",
    document.getElementById("duel-callout").textContent === "");

  "DRAGON".split("").forEach(function (c) { WordDuel.guessLetter(c); });
  T("p1 score (6 letters x 5 + solve bonus)", WordDuel._state().players[0].score === 50);
  WordDuel._nextWord();                  /* last word -> results */
  T("duel ended at results",
    document.getElementById("duel-results").classList.contains("active"));
  T("p2 final score", WordDuel._state().players[1].score === 50);
  WordDuel.leave();

  /* --- Word Hunt (diagonal support) --- */
  showScreen("screen-hunt");
  WordHunt.start();
  T("hunt grid is 8x8", document.querySelectorAll("#hunt-grid .hunt-cell").length === 64);
  T("hunt lists 6 words", document.querySelectorAll("#hunt-words .hunt-word").length === 6);

  var g = WordHunt._grid();
  var placedOk = g.words.every(function (e) {
    return e.cells.map(function (id) { return g.cells[id]; }).join("") === e.w;
  });
  T("placed words match their cells", placedOk);
  WordHunt.leave();

  /* lineBetween now supports diagonals */
  T("diagonal line 0->9", JSON.stringify(WordHunt._lineBetween(0, 9)) === "[0,9]");
  T("diagonal line 0->18", JSON.stringify(WordHunt._lineBetween(0, 18)) === "[0,9,18]");
  T("non-line rejected", JSON.stringify(WordHunt._lineBetween(0, 11)) === "[]");

  /* diagonals actually get placed */
  var anyDiag = false;
  for (var seed = 1; seed <= 25 && !anyDiag; seed++) {
    WordHunt.start(seed);
    if (WordHunt._grid().words.some(function (e) { return e.diagonal; })) anyDiag = true;
    WordHunt.leave();
  }
  T("diagonal words placed", anyDiag);

  /* THREE TIMED MODES: BLITZ 30s, RUSH 60s, CLASSIC 90s */
  WordHunt.start(1, 0);
  T("blitz mode is 30s", WordHunt._state().timeLeft === 30);
  T("blitz still has 6 words", WordHunt._grid().words.length === 6);
  WordHunt.leave();
  WordHunt.start(1, 1);
  T("rush mode is 60s", WordHunt._state().timeLeft === 60);
  WordHunt.leave();

  WordHunt.start(1, 2);
  T("classic mode is 90s", WordHunt._state().timeLeft === 90);
  T("classic hint interval is gentle", WordHunt.MODES[2].hintEvery === 12);

  /* ad boost: random single letters glow */
  WordHunt.start(1, 2, true);
  T("boost mode is on", WordHunt._state().hintBoost === true);
  WordHunt._showLetterHint();
  T("letter hint glows exactly one cell",
    document.querySelectorAll(".hunt-cell.letter-hint").length === 1);
  WordHunt.leave();

  /* line selection (the drag/tap flow) works end-to-end */
  WordHunt.start(1, 2);
  var first = WordHunt._grid().words[0];
  WordHunt._tryLine(first.cells[0], first.cells[first.cells.length - 1]);
  T("line selection finds the word", WordHunt._state().found.length === 1);
  T("found word cells turn green",
    document.querySelectorAll(".hunt-cell.got").length === first.cells.length);
  WordHunt._tryLine(first.cells[0], first.cells[first.cells.length - 1]);
  T("re-selecting a found word is ignored", WordHunt._state().found.length === 1);
  WordHunt.leave();

  /* HINT button (25 coins) still works and glows a cell */
  WordHunt.start(1, 2);
  var c0 = save.coins;
  WordHunt.useHint();
  T("hunt hint costs 25 coins", save.coins === c0 - 25);
  T("hunt hint glows a cell",
    document.querySelectorAll(".hunt-cell.letter-hint").length >= 1);
  WordHunt.leave();
  save.coins = c0; saveNow();   /* restore for later tests */

  /* WORD OF THE DAY rotates correctly by calendar day */
  var wa = window.WOTD_get(new Date(2026, 0, 1));
  var wb = window.WOTD_get(new Date(2026, 0, 2));
  T("word of the day changes daily", wa.w !== wb.w);
  var days = Math.round((new Date(2026, 11, 31) - new Date(2026, 0, 0)) / 86400000);
  T("word of the day wraps the year",
    window.WOTD_get(new Date(2026, 11, 31)).w ===
    window.WOTD_ENTRIES[days % window.WOTD_ENTRIES.length].w);
  T("word of the day pool is large", window.WOTD_ENTRIES.length >= 120);
  T("all wotd entries have facts", window.WOTD_ENTRIES.every(function (e) {
    return /^[A-Z]{2,12}$/.test(e.w) && e.f.length > 8;
  }));

  var el = document.createElement("div");
  el.id = "test-log";
  el.textContent = "||" + log.join("|") + "||";
  document.body.appendChild(el);
}

/* ---------------- Full-game verification (?demo=verify) ----------------
   Simulates playing every single level through the real tapTile logic
   and validates all level-data rules. Prints results into #test-log.  */

function runDataTests() {
  var log = [];
  var problems = 0;
  function T(name, cond) {
    if (!cond) { log.push("FAIL " + name); problems++; }
  }

  /* don't persist verification runs */
  saveNow = function () { };
  save = { coins: 1000, sound: false, stars: {}, bestEndless: 0, seenTutorial: true };

  function tapCorrect() {
    var need = G.chain[G.nextIdx];
    var el = $$("#tile-grid .tile").filter(function (t) { return t.dataset.word === need; })[0];
    if (!el) { T("chain " + G.packIdx + "/" + G.levelIdx + " missing tile for " + need, false); return false; }
    tapTile(need, el, null);
    return true;
  }

  var levelCount = 0;
  PACKS.forEach(function (pack, p) {
    T("pack " + p + " has 10 levels", pack.levels.length === 10);
    T("pack " + p + " has name/color", !!pack.name && /^#[0-9A-F]{6}$/i.test(pack.color));
    pack.levels.forEach(function (chain, l) {
      levelCount++;
      var id = "L" + (p + 1) + "-" + (l + 1) + " (" + chain[0] + ")";

      /* --- static data rules --- */
      T(id + " length>=4", chain.length >= 4);
      var seen = {};
      chain.forEach(function (w) {
        T(id + " word '" + w + "' is A-Z only", /^[A-Z]{2,10}$/.test(w));
        seen[w] = (seen[w] || 0) + 1;
      });
      var dups = Object.keys(seen).filter(function (k) { return seen[k] > 1; });
      T(id + " no duplicate words", dups.length === 0);

      /* --- play it through the real engine --- */
      startLevel(p, l);
      T(id + " tiles fit 4x4 grid", G.tiles.length <= 16);
      T(id + " has decoys", G.tiles.length >= chain.length - 1);
      var ok = true;
      while (G.nextIdx < G.chain.length - 1 && ok) ok = tapCorrect();
      T(id + " completes", ok && $("#overlay").classList.contains("show"));
      T(id + " 3 stars on perfect run", getStars(p, l) === 3);
      closeOverlay();
    });
  });

  T("total levels = " + (PACKS.length * 10), levelCount === PACKS.length * 10);
  log.unshift(problems === 0 ? "ALL " + levelCount + " LEVELS VERIFIED — " + problems + " problems"
    : problems + " PROBLEMS FOUND");
  var el = document.createElement("div");
  el.id = "test-log";
  el.textContent = "||" + log.join("|") + "||";
  document.body.appendChild(el);
}

/* ---------------- Boot ---------------- */

document.addEventListener("DOMContentLoaded", function () {
  loadSave();

  var qs = new URLSearchParams(location.search);
  if (qs.get("full") === "1") document.documentElement.classList.add("full");

  window.CRWAudio.setEnabled(save.sound);
  window.addEventListener("pointerdown", function () { window.CRWAudio.init(); }, { once: false });

  /* button wiring */
  $("#btn-continue").addEventListener("click", function () {
    window.CRWAudio.click();
    var nxt = nextUnfinished();
    if (nxt) startLevel(nxt.p, nxt.l);
    else { toast("All levels done — try Endless!"); startEndless(); }
  });
  $("#btn-levels").addEventListener("click", function () {
    window.CRWAudio.click();
    renderPacks();
  });
  $("#btn-endless").addEventListener("click", function () {
    window.CRWAudio.click();
    startEndless();
  });
  $("#btn-settings").addEventListener("click", openSettings);

  $("#back-packs").addEventListener("click", function () { renderHome(); });
  $("#back-levels").addEventListener("click", function () { renderPacks(); });
  $("#back-game").addEventListener("click", function () { renderHome(); });
  $("#btn-hint").addEventListener("click", useHint);

  /* --- Word Duel (Guess the Word) --- */
  $("#btn-duel").addEventListener("click", function () {
    window.CRWAudio.click();
    WordDuel.start();
  });
  $("#duel-back1").addEventListener("click", function () { WordDuel.leave(); renderHome(); });
  $("#duel-back2").addEventListener("click", function () { WordDuel.leave(); renderHome(); });
  $("#duel-back3").addEventListener("click", function () { WordDuel.leave(); renderHome(); });
  $("#duel-start").addEventListener("click", function () { WordDuel.begin(); });
  $("#duel-invite").addEventListener("click", function () { WordDuel.invite(); });
  $("#duel-input").addEventListener("input", function () { WordDuel.renderWrite(); });
  $("#duel-input").addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") WordDuel.confirmWord();
  });
  $("#duel-write-done").addEventListener("click", function () { WordDuel.confirmWord(); });
  $("#duel-pass-btn").addEventListener("click", function () { WordDuel.passAction(); });
  $("#duel-again").addEventListener("click", function () { WordDuel.again(); });
  $("#duel-home").addEventListener("click", function () { WordDuel.leave(); renderHome(); });

  /* --- Word Hunt (mode picker -> easy / classic) --- */
  $("#btn-hunt").addEventListener("click", function () {
    window.CRWAudio.click();
    openHuntModePicker();
  });
  $("#hunt-back").addEventListener("click", function () { WordHunt.leave(); renderHome(); });
  $("#btn-hunt-hint").addEventListener("click", function () { WordHunt.useHint(); });
  WordHunt.wire();

  /* --- rewarded ads --- */
  $("#btn-ad").addEventListener("click", watchAd);

  if (!runDemo()) renderHome();
});
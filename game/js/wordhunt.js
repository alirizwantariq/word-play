/* ============================================================
   WORD PLAY - Word Hunt
   Words hide in a letter grid — swipe across letters to find
   them all. Twelve levels across three difficulty tiers:

     EASY   (1-4)   small grids, few short words, no diagonals,
                    NO timer - relaxed, great for young players
     MEDIUM (5-8)   bigger grids, more words, diagonals appear,
                    generous timer
     HARD   (9-12)  full grids, reverse words, more letters,
                    tighter timer

   Every level changes the grid rows/cols, word count and time.
   Difficulty ramps smoothly as the level number grows.

   HINTS (both live INSIDE the game):
     - HINT button: 25 coins glows a first letter of an unfound word
     - ✨ HINTS button: watch one rewarded ad -> letters glow
       periodically for the rest of THIS level

   SELECTION: drag a line, or tap first + last letter.
   Tap outside the grid (or the ✕) to cancel.
   ============================================================ */

window.WordHunt = (function () {
  "use strict";

  /* rows/cols swap per level so the grid always feels fresh;
     time 0 = untimed (easy tier); rev = words also read backwards */
  var LEVELS = [
    /* ---- EASY ---- */
    { tier: "EASY",   rows: 5, cols: 5, words: 3, len: [3, 5], time: 0,   diag: false, rev: false, hintEvery: 6 },
    { tier: "EASY",   rows: 6, cols: 5, words: 4, len: [3, 5], time: 0,   diag: false, rev: false, hintEvery: 6 },
    { tier: "EASY",   rows: 5, cols: 6, words: 4, len: [4, 5], time: 0,   diag: false, rev: false, hintEvery: 6 },
    { tier: "EASY",   rows: 6, cols: 6, words: 4, len: [4, 6], time: 0,   diag: false, rev: false, hintEvery: 6 },
    /* ---- MEDIUM ---- */
    { tier: "MEDIUM", rows: 6, cols: 7, words: 5, len: [4, 6], time: 110, diag: true,  rev: false, hintEvery: 8 },
    { tier: "MEDIUM", rows: 7, cols: 6, words: 5, len: [4, 7], time: 110, diag: true,  rev: false, hintEvery: 8 },
    { tier: "MEDIUM", rows: 7, cols: 7, words: 6, len: [4, 7], time: 115, diag: true,  rev: false, hintEvery: 8 },
    { tier: "MEDIUM", rows: 7, cols: 8, words: 6, len: [5, 7], time: 110, diag: true,  rev: false, hintEvery: 8 },
    /* ---- HARD ---- */
    { tier: "HARD",   rows: 8, cols: 8, words: 7, len: [5, 7], time: 115, diag: true,  rev: true,  hintEvery: 10 },
    { tier: "HARD",   rows: 9, cols: 8, words: 7, len: [5, 8], time: 105, diag: true,  rev: true,  hintEvery: 10 },
    { tier: "HARD",   rows: 8, cols: 9, words: 8, len: [5, 8], time: 110, diag: true,  rev: true,  hintEvery: 10 },
    { tier: "HARD",   rows: 9, cols: 9, words: 8, len: [5, 8], time: 100, diag: true,  rev: true,  hintEvery: 10 }
  ];
  var HINT_GLOW_MS = 1600;

  var H = null;   /* current hunt state */

  function pool(minLen, maxLen) {
    var words = (window.CRW_PACKS || []).reduce(function (acc, p) {
      p.levels.forEach(function (c) { acc = acc.concat(c); });
      return acc;
    }, []);
    words = words.filter(function (w) { return w.length >= minLen && w.length <= maxLen; });
    return words.filter(function (w, i, a) { return a.indexOf(w) === i; });
  }

  function makeGrid(rnd, lv) {
    var words = pool(lv.len[0], lv.len[1]);
    var chosen = [];
    var shuffled = words.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
    }
    for (var k = 0; k < shuffled.length && chosen.length < lv.words; k++) {
      if (chosen.indexOf(shuffled[k]) === -1) chosen.push(shuffled[k]);
    }
    var cells = new Array(lv.rows * lv.cols).fill(null);
    var placed = [];          /* { w, cells:[ids], diagonal } */
    var DIRS = [[0, 1], [1, 0]];                       /* across, down */
    if (lv.diag) DIRS.push([1, 1], [-1, 1]);            /* diagonals */
    if (lv.rev) DIRS.push([0, -1], [-1, 0], [1, -1], [-1, -1]);  /* backwards */
    chosen.forEach(function (w) {
      for (var attempt = 0; attempt < 80; attempt++) {
        var d = DIRS[Math.floor(rnd() * DIRS.length)];
        var rMin = d[0] === -1 ? w.length - 1 : 0;
        var rMax = d[0] === 1 ? lv.rows - w.length : lv.rows - 1;
        var cMin = d[1] === -1 ? w.length - 1 : 0;
        var cMax = d[1] === 1 ? lv.cols - w.length : lv.cols - 1;
        var r0 = rMin + Math.floor(rnd() * (rMax - rMin + 1));
        var c0 = cMin + Math.floor(rnd() * (cMax - cMin + 1));
        var idxs = [];
        var ok = true;
        for (var i = 0; i < w.length; i++) {
          var r = r0 + d[0] * i;
          var c = c0 + d[1] * i;
          var id = r * lv.cols + c;
          if (cells[id] !== null && cells[id] !== w[i]) { ok = false; break; }
          idxs.push(id);
        }
        if (ok) {
          for (var m = 0; m < idxs.length; m++) cells[idxs[m]] = w[m];
          placed.push({
            w: w, cells: idxs,
            diagonal: d[0] !== 0 && d[1] !== 0,
            /* reads right-to-left / bottom-to-top (hard tier only) */
            rev: d[1] === -1 || (d[0] === -1 && d[1] === 0)
          });
          break;
        }
      }
    });
    var LETTERS = "AAABCDEEEEFGHIIKLMNOOPRRSSTTUVWY";
    for (var i = 0; i < cells.length; i++) {
      if (cells[i] === null) {
        cells[i] = LETTERS[Math.floor(rnd() * LETTERS.length)];
      }
    }
    return { cells: cells, words: placed, rows: lv.rows, cols: lv.cols };
  }

  /* ---------- game flow ---------- */

  function start(seed, levelIdx, adHints) {
    var rnd = (function (s) {
      s = s || (Date.now() % 100000);
      return function () {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    })(seed);
    var lv = LEVELS[levelIdx || 0];
    H = {
      grid: makeGrid(rnd, lv),
      levelIdx: levelIdx || 0,
      adHints: !!adHints,
      found: [],
      score: 0,
      timeLeft: lv.time,
      timer: null,
      hintTimer: null,
      selecting: null,      /* active drag: { from: id } */
      anchor: null,         /* tap-tap mode: first letter of a line */
      cancelEl: null
    };
    render();
    if (lv.time > 0) H.timer = setInterval(tick, 1000);
    /* rewarded-ad hints: gentle single-letter glows for this level */
    if (H.adHints) startHintTimer();
  }

  /* ✨ in-game button: watch one ad -> letter hints for this level */
  function enableAdHints() {
    if (!H || H.adHints) return;
    H.adHints = true;
    startHintTimer();
    renderHintButton();
  }

  function startHintTimer() {
    if (!H || H.hintTimer) return;
    H.hintTimer = setInterval(showLetterHint, LEVELS[H.levelIdx].hintEvery * 1000);
  }

  function tick() {
    if (!H) return;
    /* safety: if the user somehow left the hunt screen, stop quietly
       instead of popping the game-over overlay over another screen */
    if (currentScreen !== "screen-hunt") { leave(); return; }
    var lv = LEVELS[H.levelIdx];
    if (lv.time <= 0) return;              /* easy tier: untimed */
    H.timeLeft--;
    var t = document.getElementById("hunt-timer");
    t.textContent = H.timeLeft + "s";
    t.classList.toggle("urgent", H.timeLeft <= 10);
    if (H.timeLeft <= 0) gameOver(false);
  }

  function stop() {
    if (H && H.timer) { clearInterval(H.timer); H.timer = null; }
    if (H && H.hintTimer) { clearInterval(H.hintTimer); H.hintTimer = null; }
  }

  function leave() {
    stop();
    H = null;
  }

  function gameOver(complete) {
    stop();
    var lv = LEVELS[H.levelIdx];
    var isLast = H.levelIdx === LEVELS.length - 1;
    var best = Math.max(save.huntBest || 0, H.score);
    var newBest = H.score > (save.huntBest || 0);
    save.huntBest = best;

    /* completion unlocks the next level + first-time coin bonus */
    var coinsEarned = 0;
    if (complete) {
      if (!save.huntDone[H.levelIdx]) {
        save.huntDone[H.levelIdx] = true;
        coinsEarned = 25;
        if (H.levelIdx + 1 < LEVELS.length) {
          save.huntLevel = Math.max(save.huntLevel || 1, H.levelIdx + 2);
        }
      } else {
        coinsEarned = 5;
      }
      save.coins += coinsEarned;
    }
    saveNow();
    window.CRWAudio.lose();
    roundEnded();

    var head = complete
      ? (isLast ? "🏆 WORD HUNT COMPLETE!" : "🏆 ALL FOUND!")
      : "TIME'S UP!";
    var body = complete
      ? '<div class="ov-text">' + H.grid.words.length + " words · " + lv.rows + "×" + lv.cols +
        " grid — level " + (H.levelIdx + 1) + " (" + lv.tier + ")" +
        (coinsEarned ? '<br>+' + coinsEarned + " coins" : "") + '</div>'
      : '<div class="ov-text">' + H.found.length + " of " + H.grid.words.length +
        " words found — level " + (H.levelIdx + 1) + " (" + lv.tier + ")" +
        (newBest ? " — 🎉 new best!" : "<br>Best: " + best) + '</div>' +
        '<div class="ov-text small">Missed: ' + H.grid.words.filter(function (e) {
          return H.found.indexOf(e.w) === -1;
        }).map(function (e) { return e.w; }).join(", ") + '</div>';

    openOverlay(
      '<div class="ov-title">' + head + '</div>' +
      '<div class="ov-score">' + H.score + '<span> pts</span></div>' +
      body +
      '<div class="ov-btns">' +
      (complete && !isLast
        ? '<button id="hunt-next" class="btn primary big">NEXT LEVEL ▶</button>' : "") +
      '<button id="hunt-again" class="btn ' + (complete && !isLast ? "secondary" : "primary big") + '">↻ PLAY AGAIN</button>' +
      '<button id="hunt-home" class="btn ghost">HOME</button></div>'
    );
    var again = function () {
      var li = H.levelIdx, ah = H.adHints;
      closeOverlay(); adBreak(function () { start(null, li, ah); });
    };
    var nxt = document.getElementById("hunt-next");
    if (nxt) nxt.addEventListener("click", function () {
      var li = H.levelIdx;
      closeOverlay(); adBreak(function () { start(null, li + 1, false); });
    });
    document.getElementById("hunt-again").addEventListener("click", again);
    document.getElementById("hunt-home").addEventListener("click", function () {
      closeOverlay(); leave(); adBreak(renderHome);
    });
  }

  /* ---------- hints ---------- */

  /* pick a random unfound word + one random letter, glow it briefly */
  function showLetterHint() {
    if (!H) return;
    var open = H.grid.words.filter(function (e) { return H.found.indexOf(e.w) === -1; });
    if (!open.length) return;
    var entry = open[Math.floor(Math.random() * open.length)];
    var cellId = entry.cells[Math.floor(Math.random() * entry.cells.length)];
    glowCell(cellId);
  }

  function glowCell(cellId) {
    var el = document.querySelector('.hunt-cell[data-id="' + cellId + '"]');
    if (!el || el.classList.contains("got")) return;
    el.classList.add("letter-hint");
    setTimeout(function () {
      el.classList.remove("letter-hint");
    }, HINT_GLOW_MS);
  }

  /* HINT button (25 coins): glow the FIRST letter of an unfound word */
  function useHint() {
    if (!H) return;
    var lv = LEVELS[H.levelIdx];
    if (lv.time > 0 && H.timeLeft <= 0) return;
    if (save.coins < 25) { toast("Not enough coins! Earn stars in Chain Reaction"); return; }
    var target = null;
    for (var i = 0; i < H.grid.words.length; i++) {
      if (H.found.indexOf(H.grid.words[i].w) === -1) { target = H.grid.words[i]; break; }
    }
    if (!target) return;
    save.coins -= 25;
    saveNow();
    window.CRWAudio.coin();
    glowCell(target.cells[0]);
    renderHintButton();
    toast("Look for the glowing letter! ✨");
  }

  /* ---------- rendering ---------- */

  function render() {
    /* NOTE: does not manage the active class — the caller must call
       showScreen("screen-hunt") first (all real entry points do). */
    var lv = LEVELS[H.levelIdx];
    document.getElementById("hunt-mode").innerHTML =
      '<span class="pill-mini">LEVEL ' + (H.levelIdx + 1) + "</span>" +
      '<span class="pill-mini tier-' + lv.tier.toLowerCase() + '">' + lv.tier + "</span>";
    var t = document.getElementById("hunt-timer");
    if (lv.time > 0) {
      t.style.display = "";
      t.textContent = H.timeLeft + "s";
      t.classList.remove("urgent");
    } else {
      t.style.display = "none";      /* easy tier: relaxed, no clock */
    }
    var g = document.getElementById("hunt-grid");
    g.innerHTML = "";
    g.style.gridTemplateColumns = "repeat(" + lv.cols + ", 1fr)";
    H.grid.cells.forEach(function (ch, i) {
      var c = document.createElement("div");
      c.className = "hunt-cell";
      c.textContent = ch;
      c.dataset.id = i;
      g.appendChild(c);
    });
    renderFound();
    document.getElementById("hunt-score").textContent = H.score + " pts";
    renderHintButton();
  }

  function renderHintButton() {
    var hb = document.getElementById("btn-hunt-hint");
    if (hb) hb.classList.toggle("disabled", save.coins < 25);
    var ab = document.getElementById("btn-hunt-adhints");
    if (ab) {
      var on = H && H.adHints;
      ab.classList.toggle("disabled", !!on);
      ab.innerHTML = on
        ? '<span class="bulb"></span> HINTS ON ✨'
        : '<span class="bulb"></span> HINTS · WATCH AD';
    }
  }

  function renderFound() {
    var list = document.getElementById("hunt-words");
    list.innerHTML = "";
    H.grid.words.forEach(function (entry) {
      var el = document.createElement("span");
      var isFound = H.found.indexOf(entry.w) !== -1;
      el.className = "hunt-word" + (isFound ? " found" : "") +
        (entry.diagonal ? " diag" : "") + (entry.rev ? " rev" : "");
      el.textContent = isFound ? entry.w : new Array(entry.w.length + 1).join("-");
      list.appendChild(el);
    });
  }

  /* ---------- selection: drag OR tap first+last, cancel anytime ---------- */

  function cellAt(x, y) {
    var el = null;
    try { el = document.elementFromPoint(x, y); } catch (e) { }
    if (el && el.classList && el.classList.contains("hunt-cell")) return +el.dataset.id;
    return null;
  }

  function lineBetween(a, b) {
    var cols = H.grid.cols;
    var r1 = Math.floor(a / cols), c1 = a % cols;
    var r2 = Math.floor(b / cols), c2 = b % cols;
    var dr = r2 - r1, dc = c2 - c1;
    var cells = [];
    if (r1 === r2) {
      for (var c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) cells.push(r1 * cols + c);
    } else if (c1 === c2) {
      for (var r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) cells.push(r * cols + c1);
    } else if (Math.abs(dr) === Math.abs(dc)) {
      var steps = Math.abs(dr);
      var sr = dr > 0 ? 1 : -1, sc = dc > 0 ? 1 : -1;
      for (var s = 0; s <= steps; s++) cells.push((r1 + sr * s) * cols + (c1 + sc * s));
    }
    return cells;
  }

  function clearSel() {
    Array.prototype.forEach.call(document.querySelectorAll(".hunt-cell"), function (c) {
      c.classList.remove("sel");
    });
  }

  function paintSel(cells) {
    clearSel();
    cells.forEach(function (id) {
      var el = document.querySelector('.hunt-cell[data-id="' + id + '"]');
      if (el) el.classList.add("sel");
    });
  }

  function setCancelBar(show, text) {
    var bar = document.getElementById("hunt-cancelbar");
    if (!bar) return;
    bar.classList.toggle("show", !!show);
    if (text) bar.textContent = text;
  }

  function cancelSelection() {
    H.selecting = null;
    H.anchor = null;
    clearSel();
    setCancelBar(false);
  }

  /* --- drag flow --- */

  function onDown(ev) {
    if (!H || (LEVELS[H.levelIdx].time > 0 && H.timeLeft <= 0)) return;
    var id = cellAt(ev.clientX, ev.clientY);
    if (id === null) { cancelSelection(); return; }   /* tap outside = cancel */
    var g = document.getElementById("hunt-grid");
    try { g.setPointerCapture(ev.pointerId); } catch (e) { }
    H.selecting = { from: id, moved: false };
    clearSel();
    setCancelBar(true, "Drag to the last letter — release outside to cancel ✕");
    ev.preventDefault();
  }

  function onMove(ev) {
    if (!H || !H.selecting) return;
    var id = cellAt(ev.clientX, ev.clientY);
    if (id === null) { clearSel(); return; }          /* finger off-grid: unpaint */
    var cells = lineBetween(H.selecting.from, id);
    if (cells.length) {
      H.selecting.to = id;
      H.selecting.moved = true;
      paintSel(cells);
    }
    ev.preventDefault();
  }

  function onUp(ev) {
    if (!H || !H.selecting) return;
    var sel = H.selecting;
    H.selecting = null;

    /* released outside the grid -> cancel */
    var end = cellAt(ev.clientX, ev.clientY);
    if (end === null) { cancelSelection(); return; }

    /* simple tap (no drag): anchor flow - tap first, then last letter */
    if (!sel.moved && sel.from === end) {
      if (H.anchor === null) {
        H.anchor = sel.from;
        paintSel([sel.from]);
        setCancelBar(true, "Now tap the last letter — tap the same one to cancel ✕");
        return;
      }
      if (H.anchor === end) { cancelSelection(); return; }   /* tap again = cancel */
      tryLine(H.anchor, end);
      return;
    }

    /* drag flow */
    if (sel.moved) tryLine(sel.from, end);
    else cancelSelection();
  }

  function onCancel() { cancelSelection(); }

  /* check a finished line against the hidden words */
  function tryLine(a, b) {
    H.anchor = null;
    setCancelBar(false);
    var cells = lineBetween(a, b);
    if (cells.length < 2) { clearSel(); return; }
    var word = cells.map(function (i) { return H.grid.cells[i]; }).join("");
    var entry = null;
    for (var i = 0; i < H.grid.words.length; i++) {
      if (H.grid.words[i].w === word && H.found.indexOf(word) === -1) {
        entry = H.grid.words[i]; break;
      }
    }
    if (entry) {
      H.found.push(word);
      H.score += 10 + word.length * 2 + (entry.diagonal ? 5 : 0);
      save.huntWords = (save.huntWords || 0) + 1;   /* settings stat */
      document.getElementById("hunt-score").textContent = H.score + " pts";
      entry.cells.forEach(function (cid, k) {
        var el = document.querySelector('.hunt-cell[data-id="' + cid + '"]');
        if (el) {
          el.classList.remove("sel", "letter-hint");
          el.classList.add("got");
          el.style.setProperty("--i", k);
        }
      });
      window.CRWAudio.sparkle();
      try { navigator.vibrate(20); } catch (e) { }
      if (entry.diagonal) toast("Diagonal! +" + (10 + word.length * 2 + 5) + " points");
      renderFound();
      if (H.found.length === H.grid.words.length) gameOver(true);
    } else {
      clearSel();
      window.CRWAudio.wrong();
    }
  }

  /* tap outside the grid cancels an active anchor selection */
  function onDocDown(ev) {
    if (!H || (H.anchor === null && !H.selecting)) return;
    var el = null;
    try { el = ev.target.closest ? ev.target.closest("#hunt-grid") : null; } catch (e) { }
    if (!el) cancelSelection();
  }

  function wire() {
    var g = document.getElementById("hunt-grid");
    g.addEventListener("pointerdown", onDown);
    g.addEventListener("pointermove", onMove);
    g.addEventListener("pointerup", onUp);
    g.addEventListener("pointercancel", onCancel);
    document.addEventListener("pointerdown", onDocDown, true);
    var cb = document.getElementById("hunt-cancelbar");
    if (cb) cb.addEventListener("click", cancelSelection);
  }

  return {
    start: start,
    wire: wire,
    useHint: useHint,
    enableAdHints: enableAdHints,
    leave: leave,
    active: function () { return !!H; },
    level: function () { return H ? H.levelIdx : 0; },
    LEVELS: LEVELS,
    /* test/demo hooks */
    _grid: function () { return H ? H.grid : null; },
    _lineBetween: lineBetween,
    _showLetterHint: showLetterHint,
    _tryLine: tryLine,
    _state: function () { return H; },
    _demo: function () {
      start(7, 8, true);       /* level 9 (HARD, 8x8, timed) + hints for the shot */
      stop();
      /* pre-find one word */
      var entry = H.grid.words[0];
      entry.cells.forEach(function (id) {
        var el = document.querySelector('.hunt-cell[data-id="' + id + '"]');
        if (el) el.classList.add("got");
      });
      H.found.push(entry.w);
      H.score = 10 + entry.w.length * 2 + (entry.diagonal ? 5 : 0);
      document.getElementById("hunt-score").textContent = H.score + " pts";
      H.timeLeft = 43;
      document.getElementById("hunt-timer").textContent = "43s";
      renderFound();
      showLetterHint();
    }
  };
})();
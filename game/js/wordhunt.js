/* ============================================================
   WORD PLAY - Word Hunt
   Words hide in a letter grid — swipe across letters to find
   them all before the timer runs out.

   THREE MODES: BLITZ (30s) · RUSH (60s) · CLASSIC (90s).
   Optional rewarded-ad boost: random single letters from the
   unfound words glow periodically (more often in short modes,
   never too much). Manual hint: 25 coins glows a first letter.

   SELECTION: drag a line, or tap first + last letter.
   Tap outside the grid (or the ✕) to cancel.
   ============================================================ */

window.WordHunt = (function () {
  "use strict";

  var SIZE = 8;

  var MODES = [
    { name: "BLITZ", time: 30, hintEvery: 5 },     /* hints often */
    { name: "RUSH", time: 60, hintEvery: 8 },      /* hints sometimes */
    { name: "CLASSIC", time: 90, hintEvery: 12 }   /* hints rarely */
  ];
  var HINT_GLOW_MS = 1600;

  var H = null;   /* current hunt state */

  function pool() {
    var words = (window.CRW_PACKS || []).reduce(function (acc, p) {
      p.levels.forEach(function (c) { acc = acc.concat(c); });
      return acc;
    }, []);
    words = words.filter(function (w) { return w.length >= 4 && w.length <= 7; });
    return words.filter(function (w, i, a) { return a.indexOf(w) === i; });
  }

  function makeGrid(rnd) {
    var words = pool();
    var chosen = [];
    var shuffled = words.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
    }
    for (var k = 0; k < shuffled.length && chosen.length < 6; k++) {
      if (chosen.indexOf(shuffled[k]) === -1) chosen.push(shuffled[k]);
    }
    var cells = new Array(SIZE * SIZE).fill(null);
    var placed = [];          /* { w, cells:[ids], diagonal } */
    var DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1]];   /* across, down, diagonals */
    chosen.forEach(function (w) {
      for (var attempt = 0; attempt < 80; attempt++) {
        var d = DIRS[Math.floor(rnd() * DIRS.length)];
        var rMin = d[0] === -1 ? w.length - 1 : 0;
        var rMax = d[0] === 1 ? SIZE - w.length : SIZE - 1;
        var cMax = d[1] === 1 ? SIZE - w.length : SIZE - 1;
        var r0 = rMin + Math.floor(rnd() * (rMax - rMin + 1));
        var c0 = Math.floor(rnd() * (cMax + 1));
        var idxs = [];
        var ok = true;
        for (var i = 0; i < w.length; i++) {
          var r = r0 + d[0] * i;
          var c = c0 + d[1] * i;
          var id = r * SIZE + c;
          if (cells[id] !== null && cells[id] !== w[i]) { ok = false; break; }
          idxs.push(id);
        }
        if (ok) {
          for (var m = 0; m < idxs.length; m++) cells[idxs[m]] = w[m];
          placed.push({ w: w, cells: idxs, diagonal: d[0] !== 0 && d[1] !== 0 });
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
    return { cells: cells, words: placed };
  }

  /* ---------- game flow ---------- */

  function start(seed, modeIdx, hintBoost) {
    var rnd = (function (s) {
      s = s || (Date.now() % 100000);
      return function () {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    })(seed);
    var mode = MODES[modeIdx || 0];
    H = {
      grid: makeGrid(rnd),
      modeIdx: modeIdx || 0,
      hintBoost: !!hintBoost,
      found: [],
      score: 0,
      timeLeft: mode.time,
      timer: null,
      hintTimer: null,
      selecting: null,      /* active drag: { from: id } */
      anchor: null,         /* tap-tap mode: first letter of a line */
      cancelEl: null
    };
    render();
    H.timer = setInterval(tick, 1000);
    /* ad-boost: gentle, mode-timed single-letter hints */
    if (H.hintBoost) {
      H.hintTimer = setInterval(showLetterHint, mode.hintEvery * 1000);
    }
  }

  function tick() {
    if (!H) return;
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
    var best = Math.max(save.huntBest || 0, H.score);
    var newBest = H.score > (save.huntBest || 0);
    save.huntBest = best;
    saveNow();
    window.CRWAudio.lose();
    openOverlay(
      '<div class="ov-title">' + (complete ? "🏆 ALL FOUND!" : "TIME\'S UP!") + '</div>' +
      '<div class="ov-score">' + H.score + '<span> pts</span></div>' +
      '<div class="ov-text">' + H.found.length + " of " + H.grid.words.length +
      " words found in " + MODES[H.modeIdx].name + " mode" +
      (newBest ? " — 🎉 new best!" : "<br>Best: " + best) + '</div>' +
      '<div class="ov-text small">Missed: ' + H.grid.words.filter(function (e) {
        return H.found.indexOf(e.w) === -1;
      }).map(function (e) { return e.w; }).join(", ") + '</div>' +
      '<div class="ov-btns">' +
      '<button id="hunt-again" class="btn primary big">↻ PLAY AGAIN</button>' +
      '<button id="hunt-home" class="btn ghost">HOME</button></div>'
    );
    document.getElementById("hunt-again").addEventListener("click", function () {
      var m = H.modeIdx, b = H.hintBoost;
      closeOverlay(); start(null, m, b);
    });
    document.getElementById("hunt-home").addEventListener("click", function () {
      closeOverlay(); leave(); renderHome();
    });
  }

  /* ---------- hints ---------- */

  /* pick a random unfound word + one random letter, glow it briefly */
  function showLetterHint() {
    if (!H || H.timeLeft <= 0) return;
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
    if (!H || H.timeLeft <= 0) return;
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
    var hb = document.getElementById("btn-hunt-hint");
    if (hb) hb.classList.toggle("disabled", save.coins < 25);
    toast("Look for the glowing letter! ✨");
  }

  /* ---------- rendering ---------- */

  function render() {
    document.getElementById("screen-hunt").classList.add("active");
    var mode = MODES[H.modeIdx];
    document.getElementById("hunt-mode").innerHTML =
      '<span class="pill-mini">' + mode.name + " · " + mode.time + "s</span>" +
      (H.hintBoost ? '<span class="pill-mini easy">✨hints</span>' : "");
    var g = document.getElementById("hunt-grid");
    g.innerHTML = "";
    H.grid.cells.forEach(function (ch, i) {
      var c = document.createElement("div");
      c.className = "hunt-cell";
      c.textContent = ch;
      c.dataset.id = i;
      g.appendChild(c);
    });
    renderFound();
    document.getElementById("hunt-score").textContent = H.score;
    var t = document.getElementById("hunt-timer");
    t.textContent = H.timeLeft + "s";
    t.classList.remove("urgent");
    var hb = document.getElementById("btn-hunt-hint");
    if (hb) hb.classList.toggle("disabled", save.coins < 25);
  }

  function renderFound() {
    var list = document.getElementById("hunt-words");
    list.innerHTML = "";
    H.grid.words.forEach(function (entry) {
      var el = document.createElement("span");
      var isFound = H.found.indexOf(entry.w) !== -1;
      el.className = "hunt-word" + (isFound ? " found" : "") + (entry.diagonal ? " diag" : "");
      el.textContent = isFound ? entry.w : entry.w.replace(/[A-Z]/g, "_");
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
    var r1 = Math.floor(a / SIZE), c1 = a % SIZE;
    var r2 = Math.floor(b / SIZE), c2 = b % SIZE;
    var dr = r2 - r1, dc = c2 - c1;
    var cells = [];
    if (r1 === r2) {
      for (var c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) cells.push(r1 * SIZE + c);
    } else if (c1 === c2) {
      for (var r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) cells.push(r * SIZE + c1);
    } else if (Math.abs(dr) === Math.abs(dc)) {
      var steps = Math.abs(dr);
      var sr = dr > 0 ? 1 : -1, sc = dc > 0 ? 1 : -1;
      for (var s = 0; s <= steps; s++) cells.push((r1 + sr * s) * SIZE + (c1 + sc * s));
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
    if (!H || H.timeLeft <= 0) return;
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
      document.getElementById("hunt-score").textContent = H.score;
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
    leave: leave,
    active: function () { return !!H; },
    mode: function () { return H ? H.modeIdx : 0; },
    MODES: MODES,
    /* test/demo hooks */
    _grid: function () { return H ? H.grid : null; },
    _lineBetween: lineBetween,
    _showLetterHint: showLetterHint,
    _tryLine: tryLine,
    _state: function () { return H; },
    _demo: function () {
      start(7, 2, true);       /* classic 90s + hints boost for the shot */
      stop();
      /* pre-find one word */
      var entry = H.grid.words[0];
      entry.cells.forEach(function (id) {
        var el = document.querySelector('.hunt-cell[data-id="' + id + '"]');
        if (el) el.classList.add("got");
      });
      H.found.push(entry.w);
      H.score = 10 + entry.w.length * 2 + (entry.diagonal ? 5 : 0);
      document.getElementById("hunt-score").textContent = H.score;
      H.timeLeft = 43;
      document.getElementById("hunt-timer").textContent = "43s";
      renderFound();
      showLetterHint();
    }
  };
})();
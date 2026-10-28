/* ============================================================
   WORD PLAY - Word Duel v2: "Guess the Word" (pass & play)
   Each player secretly writes ONE word (object, animal, person,
   food or place). Then everyone else takes turns guessing
   letters - hangman style. 6 shared hearts per word: every wrong
   letter pops a heart. Solve it -> guessers score; hearts run
   out -> the writer scores!
   - Dynamic word suggestions while typing (live dictionary)
   - Category is the built-in hint (shown to guessers)
   - Invite button shares the game with friends
   ============================================================ */

window.WordDuel = (function () {
  "use strict";

  var CATEGORIES = ["ANIMAL", "OBJECT", "PERSON", "FOOD", "PLACE"];
  var MAX_HEARTS = 6;
  var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  var D = null;

  /* ---------- state ---------- */

  function newDuel(count) {
    var players = [];
    for (var i = 0; i < count; i++) {
      players.push({ name: "Player " + (i + 1), score: 0, word: "", cat: "FOOD" });
    }
    return {
      players: players,
      writerIdx: 0,          /* whose word is being written / guessed */
      guesserSeat: 1,        /* seat of the current guesser */
      writingDone: false,
      word: "",              /* current word being guessed */
      cat: "",
      guessed: "",           /* letters already tried */
      hearts: MAX_HEARTS,
      solved: false,
      phase: "setup"
    };
  }

  function writer() { return D.players[D.writerIdx]; }
  function guesser() { return D.players[D.guesserSeat]; }

  /* ---------- screens ---------- */

  function show(phase) {
    D.phase = phase;
    showScreen("duel-" + phase);   /* global screen manager in game.js */
  }

  /* ---------- setup ---------- */

  function start() {
    D = newDuel(2);
    D.selected = 2;
    renderSetup();
  }

  function renderSetup() {
    show("setup");
    var wrap = document.getElementById("duel-player-count");
    wrap.innerHTML = "";
    [2, 3, 4].forEach(function (n) {
      var b = document.createElement("button");
      b.className = "pill-btn" + (D.selected === n ? " sel" : "");
      b.textContent = n;
      b.addEventListener("click", function () {
        window.CRWAudio.click();
        D.selected = n;
        renderSetup();
      });
      wrap.appendChild(b);
    });
    document.getElementById("duel-setup-info").innerHTML =
      "Each player secretly writes <b>one word</b> — an animal, object, person, food or place. " +
      "Then everyone else guesses it letter by letter. <b>6 shared hearts</b> per word: " +
      "wrong letters pop hearts. Solve it to score — run out and the writer wins the round!";
  }

  function begin() {
    D = newDuel(D.selected);
    window.CRWAudio.click();
    renderWrite();
  }

  /* ---------- write phase: one secret word per player ---------- */

  function renderWrite() {
    show("write");
    var p = writer();
    document.getElementById("duel-write-head").innerHTML =
      "<b>" + p.name + "</b>, write your secret word!";

    /* category chips */
    var cats = document.getElementById("duel-cats");
    cats.innerHTML = "";
    CATEGORIES.forEach(function (c) {
      var b = document.createElement("button");
      b.className = "cat-chip" + (p.cat === c ? " sel" : "");
      b.textContent = c;
      b.addEventListener("click", function () {
        window.CRWAudio.click();
        p.cat = c;
        renderWrite();
      });
      cats.appendChild(b);
    });

    var input = document.getElementById("duel-input");
    var w = (input.value || "").toUpperCase().replace(/[^A-Z]/g, "");
    document.getElementById("duel-word-count").textContent =
      w.length < 3 ? "min 3 letters" : w.length + " letters ✓";

    /* live dictionary suggestions while typing */
    var suggWrap = document.getElementById("duel-suggestions");
    suggWrap.innerHTML = "";
    var sugg = window.CRW_suggest(w.length >= 1 ? w : "", usedWords(), null);
    if (!w.length) {
      document.getElementById("duel-sugg-label").style.display = "none";
    } else {
      document.getElementById("duel-sugg-label").style.display = "block";
      sugg.forEach(function (sw) {
        var b = document.createElement("button");
        b.className = "sugg-chip";
        b.textContent = sw;
        b.addEventListener("click", function () {
          window.CRWAudio.click();
          input.value = sw;
          renderWrite();
        });
        suggWrap.appendChild(b);
      });
    }

    var ok = document.getElementById("duel-write-done");
    ok.classList.toggle("disabled", w.length < 3 || w.length > 8);
  }

  function usedWords() {
    return D.players.map(function (p) { return p.word; }).filter(Boolean);
  }

  function confirmWord() {
    var input = document.getElementById("duel-input");
    var w = (input.value || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (w.length < 3 || w.length > 8) { toast("Use 3–8 letters"); return; }
    if (usedWords().indexOf(w) !== -1) { toast("Someone already wrote that!"); return; }
    writer().word = w;
    input.value = "";
    window.CRWAudio.place();

    D.writerIdx++;
    if (D.writerIdx < D.players.length) {
      document.getElementById("duel-pass-text").innerHTML =
        "Nice word! Now pass to <b class='accent'>" + writer().name + "</b>";
      document.getElementById("duel-pass-btn").textContent = "I'M READY ▶";
      show("pass");
    } else {
      /* all words written -> guessing begins with player 1's word */
      D.writerIdx = 0;
      document.getElementById("duel-pass-text").innerHTML =
        "All words locked in! We start with <b class='accent'>" +
        D.players[0].name + "'s</b> word.";
      document.getElementById("duel-pass-btn").textContent = "START GUESSING ▶";
      D.passNext = "guess";
      show("pass");
    }
  }

  /* pass-screen button (used between writers and before guessing) */
  function passAction() {
    window.CRWAudio.click();
    if (!D) return;
    if (D.passNext === "guess") {
      D.passNext = null;
      startWord();          /* writerIdx already points at the right word */
    } else {
      renderWrite();
    }
  }

  /* ---------- guess phase ---------- */

  /* animated callout: turns every letter tap into a spoken prompt
     like "Does it have Z? NO!" - the social voice of the party game */
  var CALL_CORRECT = ["{L}? YES! ⚡", "It has {L}! 🎉", "{L}, take it! 🔥", "Nailed it — {L}! 💪"];
  var CALL_WRONG = ["Does it have {L}? No… 💔", "{L}? Nope! 💔", "Sadly, no {L}! 💔", "{L}? Bold guess! 😅"];

  function callout(text) {
    var el = document.getElementById("duel-callout");
    if (!el) return;
    el.textContent = text;
    el.classList.remove("show");
    void el.offsetWidth;          /* restart the animation */
    el.classList.add("show");
  }

  /* Wipe the banner when a new word/round starts - otherwise it
     replays when the guess screen becomes visible again. */
  function clearCallout() {
    var el = document.getElementById("duel-callout");
    if (!el) return;
    el.classList.remove("show");
    el.textContent = "";
  }

  function pick(arr, letter) {
    return arr[Math.floor(Math.random() * arr.length)].replace("{L}", letter);
  }

  function startWord() {
    var w = writer();
    clearCallout();                /* never carry banners between words */
    D.word = w.word;
    D.cat = w.cat;
    D.guessed = "";
    D.hearts = MAX_HEARTS;
    D.solved = false;
    D.guesserSeat = (D.writerIdx + 1) % D.players.length;
    renderGuess();
  }

  function renderGuess() {
    show("guess");
    document.getElementById("duel-guess-head").innerHTML =
      "Guess <b>" + writer().name + "'s</b> word! <span class='pill-mini'>" + D.cat + "</span>";

    /* hearts */
    var hr = document.getElementById("duel-hearts");
    hr.innerHTML = "";
    for (var i = 0; i < MAX_HEARTS; i++) {
      var h = document.createElement("span");
      h.className = "heart big" + (i < D.hearts ? "" : " lost");
      h.textContent = "♥";
      hr.appendChild(h);
    }

    /* blanks */
    var blanks = document.getElementById("duel-blanks");
    blanks.innerHTML = "";
    for (var j = 0; j < D.word.length; j++) {
      var s = document.createElement("span");
      var known = D.guessed.indexOf(D.word[j]) !== -1;
      s.className = "blank" + (known ? " on" : "");
      s.textContent = known ? D.word[j] : "_";
      blanks.appendChild(s);
    }

    document.getElementById("duel-turn-label").innerHTML =
      "<b class='accent'>" + guesser().name + "</b>, pick a letter!";

    /* keyboard */
    var kb = document.getElementById("duel-keyboard");
    kb.innerHTML = "";
    for (var k = 0; k < ALPHABET.length; k++) {
      var ch = ALPHABET[k];
      var b = document.createElement("button");
      var state = D.guessed.indexOf(ch) !== -1;
      var hit = state && D.word.indexOf(ch) !== -1;
      b.className = "key" + (state ? (hit ? " hit" : " miss") : "");
      b.textContent = ch;
      if (!state) {
        (function (c, btn) {
          b.addEventListener("click", function () { guessLetter(c, btn); });
        })(ch, b);
      } else {
        b.disabled = true;
      }
      kb.appendChild(b);
    }
  }

  function guessLetter(ch, btn) {
    if (D.solved || D.hearts <= 0) return;
    window.CRWAudio.letterTap();
    D.guessed += ch;

    if (D.word.indexOf(ch) !== -1) {
      /* correct letter */
      var hits = 0;
      for (var i = 0; i < D.word.length; i++) if (D.word[i] === ch) hits++;
      guesser().score += 5 * hits;
      window.CRWAudio.correct(2 + hits);
      callout(pick(CALL_CORRECT, ch));
      vibrate(15);

      /* solved? */
      var all = true;
      for (var j = 0; j < D.word.length; j++) {
        if (D.guessed.indexOf(D.word[j]) === -1) { all = false; break; }
      }
      if (all) {
        D.solved = true;
        guesser().score += 20;
        window.CRWAudio.win();
        callout("SOLVED! It was " + D.word + " 🏆");
        vibrate([30, 50, 30]);
        renderGuess();
        setTimeout(nextWord, 1500);
        return;
      }
      /* correct guessers keep their turn */
      renderGuess();
    } else {
      /* wrong letter -> hangman penalty (gentle pop, not a harsh buzz) */
      D.hearts--;
      window.CRWAudio.pop();
      callout(pick(CALL_WRONG, ch));
      vibrate(40);
      if (D.hearts <= 0) {
        writer().score += 15;
        window.CRWAudio.lose();
        callout("No hearts left… it was " + D.word + " 🖤");
        renderGuess();
        setTimeout(nextWord, 1800);
        return;
      }
      /* rotate to the next guesser */
      do {
        D.guesserSeat = (D.guesserSeat + 1) % D.players.length;
      } while (D.guesserSeat === D.writerIdx);
      renderGuess();
    }
  }

  function nextWord() {
    D.writerIdx++;
    if (D.writerIdx >= D.players.length) {
      showResults();
      return;
    }
    document.getElementById("duel-pass-text").innerHTML =
      "Next word: <b class='accent'>" + writer().name + "'s</b>! " +
      "Scores — " + D.players.map(function (p) {
        return p.name.split(" ")[1] + ": " + p.score;
      }).join(" · ");
    document.getElementById("duel-pass-btn").textContent = "I'M READY ▶";
    D.passNext = "guess";
    show("pass");
  }

  /* ---------- results ---------- */

  function showResults() {
    show("results");
    var ranked = D.players.slice().sort(function (a, b) { return b.score - a.score; });
    document.getElementById("duel-results-title").innerHTML =
      "🏆 <b>" + ranked[0].name + "</b> WINS!";
    var list = document.getElementById("duel-results-list");
    list.innerHTML = "";
    ranked.forEach(function (p, i) {
      var row = document.createElement("div");
      row.className = "result-row" + (i === 0 ? " winner" : "");
      row.innerHTML = "<span class='result-rank'>" + (i + 1) + "</span>" +
        "<span class='result-name'>" + p.name + "<br><small>word: " + p.word + "</small></span>" +
        "<span class='result-score'>" + p.score + "</span>";
      list.appendChild(row);
    });
    window.CRWAudio.win();
    roundEnded();
  }

  function again() {
    var count = D.players.length;
    D = newDuel(count);
    renderWrite();
  }

  function leave() {
    D = null;
  }

  /* ---------- invite friends (native share on Android) ---------- */

  function invite() {
    window.CRWAudio.click();
    var msg = "Play Word Play with me! 🎮 3 quick word games — pass & play " +
      "Word Duel on one phone. Get it free: " +
      "https://play.google.com/store/apps/details?id=com.blankthedev.wordplay";
    if (window.AndroidBridge && window.AndroidBridge.shareText) {
      window.AndroidBridge.shareText(msg);
    } else if (navigator.share) {
      navigator.share({ text: msg }).catch(function () { });
    } else {
      try {
        var ta = document.createElement("textarea");
        ta.value = msg;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast("Invite copied! Send it to your friends 👥");
      } catch (e) { toast(msg); }
    }
  }

  return {
    start: start,
    begin: begin,
    renderWrite: renderWrite,
    confirmWord: confirmWord,
    passAction: passAction,
    guessLetter: guessLetter,
    again: again,
    invite: invite,
    leave: leave,
    active: function () { return !!D; },
    /* test/demo hooks */
    _state: function () { return D; },
    _nextWord: nextWord,
    _demo: function (mode) {
      if (mode === "write") {
        D = newDuel(3);
        D.writerIdx = 1;                 /* player 2 typing */
        document.getElementById("duel-input").value = "PI";
        renderWrite();
      } else if (mode === "guess") {
        D = newDuel(3);
        D.players[0].word = "TACO"; D.players[0].cat = "FOOD";
        D.players[1].word = "DRAGON"; D.players[1].cat = "ANIMAL";
        D.players[2].word = "MOON"; D.players[2].cat = "PLACE";
        D.writerIdx = 0;
        D.players[0].score = 45;
        D.players[1].score = 30;
        D.players[2].score = 60;
        D.word = "TACO";
        D.cat = "FOOD";
        D.guessed = "TA";
        D.hearts = 4;
        D.guesserSeat = 1;
        renderGuess();
        callout("A? YES! ⚡");
      }
    }
  };
})();
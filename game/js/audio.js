/* ============================================================
   WORD PLAY - Audio Engine v2
   All sounds are generated with the Web Audio API (no files,
   works offline). v2 = richer, more engaging: layered notes,
   soft "bubble pop" penalties, sparkles and fanfares.
   ============================================================ */

window.CRWAudio = (function () {
  "use strict";

  var ctx = null;
  var enabled = true;

  function init() {
    if (!ctx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  /* One oscillator blip with a soft envelope */
  function tone(freq, dur, type, vol, delay, slideTo) {
    if (!enabled || !ctx) return;
    try {
      var t0 = ctx.currentTime + (delay || 0);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch (e) { /* never let audio break gameplay */ }
  }

  /* Two stacked oscillators for a fuller voice */
  function duo(freq, freq2, dur, type, vol, delay) {
    tone(freq, dur, type, vol, delay);
    tone(freq2, dur, type, (vol || 0.15) * 0.55, delay);
  }

  return {
    init: init,
    setEnabled: function (v) { enabled = !!v; },
    getEnabled: function () { return enabled; },

    /* soft UI click */
    click: function () {
      tone(660, 0.07, "sine", 0.11);
    },

    /* soft letter-key tap (Word Duel keyboard) */
    letterTap: function () {
      tone(880, 0.045, "sine", 0.08);
    },

    /* rising 3-note chime; pitch climbs with the combo.
       Layered with a soft octave for a fuller "ding". */
    correct: function (combo) {
      var base = 440 * Math.pow(1.10, Math.min(combo || 1, 14));
      duo(base, base * 2, 0.11, "triangle", 0.16);
      duo(base * 1.26, base * 2.5, 0.12, "triangle", 0.13, 0.075);
      duo(base * 1.5, base * 3, 0.16, "triangle", 0.15, 0.15);
    },

    /* placing a word in the chain: quick happy pop */
    place: function () {
      duo(520, 1040, 0.07, "sine", 0.12);
      duo(780, 1560, 0.09, "sine", 0.10, 0.05);
    },

    /* gentle bubble-pop for a wrong letter in Duel
       (soft instead of harsh - penalties shouldn't hurt) */
    pop: function () {
      tone(520, 0.1, "sine", 0.16, 0, 130);
      tone(260, 0.08, "sine", 0.08, 0.02, 80);
    },

    /* grumpy descending buzz (Chain Reaction wrong tap) */
    wrong: function () {
      tone(170, 0.18, "sawtooth", 0.10, 0, 105);
    },

    /* sparkle glissando - finding a word in Word Hunt */
    sparkle: function () {
      var notes = [1174, 1397, 1568, 2093];
      for (var i = 0; i < notes.length; i++) {
        tone(notes[i], 0.09, "triangle", 0.11, i * 0.045);
      }
    },

    /* star pop */
    star: function (n) {
      var f = 900 + (n || 0) * 250;
      duo(f, f * 1.5, 0.15, "triangle", 0.15);
      duo(f * 1.33, f * 2, 0.18, "triangle", 0.13, 0.08);
    },

    /* victory fanfare: bass + brass arpeggio + shimmer */
    win: function () {
      duo(130.8, 65.4, 0.5, "sine", 0.14, 0);                 /* bass */
      var notes = [523.25, 659.25, 783.99, 1046.5];
      for (var i = 0; i < notes.length; i++) {
        duo(notes[i], notes[i] * 2, 0.24, "triangle", 0.15, 0.06 + i * 0.11);
      }
      duo(1318.5, 2637, 0.6, "sine", 0.10, 0.55);             /* shimmer */
    },

    /* game over: softer, still kind to kids */
    lose: function () {
      var notes = [392, 349.23, 293.66, 261.63];
      for (var i = 0; i < notes.length; i++) {
        tone(notes[i], 0.3, "sine", 0.12, i * 0.18);
      }
    },

    /* coin pickup */
    coin: function () {
      tone(988, 0.08, "square", 0.05);
      tone(1319, 0.13, "square", 0.05, 0.06);
    }
  };
})();
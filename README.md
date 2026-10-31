# ⚡ Word Play — 3 Quick Word Games

A complete, release-ready Android game hub for all ages (5–95). **Chain
Reaction**, **Word Duel** (pass & play), and **Word Hunt** — plus a **Word of
the Day**, optional rewarded ads for coins/hints, light between-round ads, and a calm, pleasant
offline-first design.

```
BREAD → BUTTER → MILK → COW → MOON 🐄🌙
```

## 🎮 The three games

| Game | How it plays |
|---|---|
| **⚡ Chain Reaction** | Tap the word that links to the last one — build the chain from START to END. 80 hand-crafted levels in 8 packs (incl. the "Grand Finale" pack: FIREFLY → FLYWHEEL → WHEEL OF FORTUNE → FORTUNE COOKIE), 3 hearts, combo scoring, hint coins, Endless mode. |
| **👥 Word Duel** | Party "Guess the Word" for 2–4 players on one phone. Each player secretly writes ONE word (animal / object / person / food / place) — the category is everyone's clue. Everyone else guesses letters hangman-style: **6 shared hearts** per word, wrong letters pop hearts. Solve it → guessers score (+5/letter, +20 solve). Hearts gone → the writer scores. **Animated banter callouts** ("Does it have Z? No… 💔"). Live dictionary suggestions while typing. |
| **🔎 Word Hunt** | Words hidden in a letter grid — find them all! **12 levels across three difficulty tiers: EASY → MEDIUM → HARD.** Grids grow and change shape every level (5×5 up to 9×9); EASY is relaxed and **untimed** with short words and no diagonals, MEDIUM adds diagonals + a generous timer, HARD adds words reading **backwards (↩)** and bigger grids. Drag a line (or tap first + last letter); tap outside or ✕ to cancel. Hints live **inside the game**: a 25-coin HINT glows a word's first letter, and one optional rewarded ad turns on **✨ automatic letter hints** for that level. Completing levels unlocks the next one and pays coins. |

Plus: **✨ Word of the Day** on the home screen — 100+ words with cool one-line
facts, rotating daily so facts rarely repeat.

## 🎮 Play it right now

- **Hosted (share this link):** https://alirizwantariq.github.io/word-play/game/index.html
- **Locally:**

```bash
open game/index.html
```

No build step. The same files ship inside the Android app.

## 📱 Deploy to Google Play

Everything is in **[BUILD-AND-DEPLOY.md](BUILD-AND-DEPLOY.md)** —
screenshots, store listing copy, privacy policy, signing, AdMob setup, and
the step-by-step Play Console walkthrough (including the 12-tester
closed-testing requirement for new accounts).

The Android project compiles on this machine:

```bash
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
  ./gradlew assembleDebug     # debug APK (installable now)
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
  ./gradlew bundleRelease     # AAB for Play Console upload
```

## 🗂 Project layout

| Folder | What it is |
|---|---|
| `game/` | The games — `index.html`, `css/styles.css`, `js/levels.js`, `js/wordoftheday.js`, `js/wordduel.js`, `js/wordhunt.js`, `js/audio.js`, `js/game.js` |
| `android/` | Android Studio project (Kotlin WebView shell, AdMob rewarded + interstitial ads, UMP consent, adaptive icons) |
| `store-listing/` | Play Store icon, feature graphic, 10 screenshots, listing copy, privacy policy |
| `tools/` | Icon generator (Swift), feature-graphic source, pixel-verification utilities |

## 🔧 Extending

- **Add Chain Reaction levels** → `game/js/levels.js` (chains are arrays of
  consecutive associated words)
- **Add Word-of-the-Day facts** → `game/js/wordoftheday.js`
- **Tune the Duel** → hearts (6), categories, scoring (5/letter, +20 solve,
  +15 unsolved) at the top of `game/js/wordduel.js`
- **Restyle** → CSS variables at the top of `game/css/styles.css`
- **New icons** → edit and re-run `tools/make-icons.swift`
- **Self-test the whole suite** → `game/index.html?demo=test` (41 assertions)
- **Verify all levels are solvable** → `game/index.html?demo=verify`

## 🔒 Privacy & ads

All games are **fully playable offline**. Game progress lives in `localStorage`
on the device and never leaves it. The only online feature is **optional**
rewarded ads (tap "+100" → watch a short ad → coins), powered by Google AdMob
with **test ad IDs** out of the box. See BUILD-AND-DEPLOY.md §6 to swap in real
IDs, or §6 for a checklist to remove ads entirely and ship 100% ad-free.

## 🧪 QA status

- ✅ 78/78 automated tests pass: Chain Reaction logic (21), full Word Duel
  flow incl. banter callouts, banner-clear & uppercase regression, Word Hunt
  level ladder (tiers, per-level grids, untimed easy, reverse words, unlock +
  coin rewards, in-game hints) & WOTD rotation — `?demo=test`
- ✅ All 80 levels verified solvable + data-valid through the real engine
  (`?demo=verify`)
- ✅ 29/29 real-tap flows pass **on an Android emulator** (physical
  `adb input` taps/swipes): a full Chain Reaction level, the whole Word Duel
  write → lock-in → keyboard-solve path, and the Word Hunt picker → level 1 →
  completion → unlock → NEXT LEVEL path — `tools/flows.mjs`
- ✅ Layout audits clean at 412×732, 360×640 and 800×1280 (tablet):
  no clipped, off-screen or truncated elements — `tools/audit.js`
- ✅ 0 crashes across repeated cold launches (ad SDK UI-thread fix verified)
- ✅ Android builds verified: `assembleDebug` (8.2 MB APK) and `bundleRelease`
  (6.2 MB AAB)
- ✅ Toolchain: Gradle 9.6.0 / AGP 9.4.0 / built-in Kotlin / Java 25
- ✅ Play assets: icon 512×512, feature 1024×500, phone 1080×1920 and
  tablet 1600×2560 — **all captured from a real Android device**
  (`tools/store-shots.mjs`)
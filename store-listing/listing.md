# Play Store Listing — Word Play

Copy-paste everything below into **Google Play Console → Create app**.

---

## 1. App details

| Field | Value |
|---|---|
| App name (30 chars max) | `Word Play: 3 Word Games` |
| Default language | English (US) |
| App or game | **Game** |
| Free or paid | **Free** |

---

## 2. Store listing

### Short description (80 chars max)
```
3 offline word games: Chain Reaction, Word Duel & Word Hunt. 80 puzzle levels!
```

### Full description (4000 chars max)
```
🎮 THREE quick word games in your pocket — all offline, all easy to learn, impossible to put down!

⚡ CHAIN REACTION
Link related words to build a chain! BREAD → BUTTER → MILK → COW → MOON 🐄🌙
80 hand-crafted levels across 8 packs, from warm-up brain teasers to tricky
compound-word mind benders. 3 hearts, combo scoring, stars, hint coins and an
Endless mode for high-score hunters.

👥 WORD DUEL (2–4 PLAYERS, PASS & PLAY)
The party game on one phone! Each player secretly writes ONE word — an
animal, object, person, food or place. Then everyone else guesses it
letter by letter:
   B _ _ _ _ _  →  BUTTER!
✔ 6 shared hearts per word — every wrong letter pops one (hangman rules!)
✔ Solve it to score; run out of hearts and the writer wins the round
✔ Every tap calls out loud: "Does it have Z? No… 💔" — animated party banter!
✔ Smart word suggestions while you type
✔ Invite-friends button + 2, 3 or 4 player rounds — no internet needed

🔎 WORD HUNT
Words hide in a letter grid — across, down AND diagonally (backwards
on the hardest levels, marked ↩). Swipe across the letters (or tap
first + last letter) to find them all!
✔ 12 LEVELS across three tiers: EASY → MEDIUM → HARD
✔ The grid grows and changes shape on every level (5×5 up to 9×9)
✔ EASY levels are relaxed with NO timer — perfect for young players
✔ Hints live inside the game: a manual HINT (25 coins) glows a word's
  first letter, or watch one short ad to turn on ✨ automatic letter
  hints for that level
✔ Stuck mid-selection? Tap outside the grid or the ✕ to cancel

✨ WORD OF THE DAY
Discover a new fascinating word with a cool one-line fact every single day
— over 100 facts that take months to repeat!

WHY YOU'LL LOVE IT
⭐ Quick rounds — perfect for waiting rooms, commutes and family game night
⭐ Builds vocabulary & lateral thinking for kids, sharpens adult brains
⭐ Beautiful, colorful, touch-friendly design
⭐ Works 100% OFFLINE — no Wi-Fi needed
⭐ No sign-up. No chat. No purchases. Kid-safe.
⭐ Optional: watch a short ad to earn +100 hint coins

From kids learning their first word associations to grandparents who love a
clever pun — grab your friends and start playing with words today! 🎉
```

### Graphics (use the files in `store-listing/`)
| Asset | File |
|---|---|
| App icon (512×512) | `icon-512.png` |
| Feature graphic (1024×500) | `feature-graphic.png` |
| Phone screenshots (1080×1920, captured on a real Android device) — upload up to 8 | `screenshots/phone-home.png`, `phone-play.png`, `phone-duelwrite.png`, `phone-duel.png`, `phone-hunt.png`, `phone-win.png`, `phone-packs.png`, `phone-endless.png` (extra: `phone-levels.png`) |
| 10" tablet (1600×2560, captured on a real Android device) | `screenshots/tablet-home.png`, `tablet-play.png`, `tablet-duel.png`, `tablet-hunt.png` (extras: `tablet-packs.png`, `tablet-levels.png`, `tablet-win.png`, `tablet-endless.png`, `tablet-duelwrite.png`) |

To re-capture any of these from a connected device/emulator, run
`node tools/store-shots.mjs phone` and `node tools/store-shots.mjs tablet`
(the emulator must be at `wm size 1080x1920` + `wm density 420` for phone,
`1600x2560` + `wm density 320` for tablet).

### Contact details
| Field | Value |
|---|---|
| Website | (your site, or a GitHub page) |
| Email | (your support email) |
| Privacy policy URL | your hosted `privacy-policy.html` (see BUILD-AND-DEPLOY.md) |

---

## 3. Ads declaration

| Question | Answer |
|---|---|
| Does your app contain ads? | **Yes** — optional rewarded video ads ("watch ad → +100 coins") + interstitials between rounds (max 1 per 3 rounds, ≥2 min apart) |

> Debug builds use Google's **test ad units**. A release build will not compile
> until your real AdMob IDs are in `android/gradle.properties`
> (see BUILD-AND-DEPLOY.md §6).

---

## 4. Content rating questionnaire (IARC)

| Question | Answer |
|---|---|
| App category | Puzzle / Word game |
| Does it contain violence? | No |
| Does it contain sexual content / nudity? | No |
| Does it contain profanity or crude humor? | No |
| Controlled substances? | No |
| Gambling or simulated gambling? | No |
| Does it share user-provided personal info with 3rd parties? | No |
| Does it collect user info shared with ad networks? | **Yes — the AdMob SDK collects device identifiers/ad interaction for ads** |
| Does the app enable purchases? (in-app billing) | No |
| Is it a social app that allows user-to-user contact? | No |
| Unrestricted web browsing? | No |

Result: **Rated Everyone** (ads are permitted at this rating; requests are tagged child-directed and capped at G).

---

## 5. Data safety section (answers with ads enabled)

| Question | Answer |
|---|---|
| Does your app collect user data? | **Yes** |
| Data type | **Device or other IDs** (advertising ID via Google AdMob SDK) |
| Is this data shared? | Yes — shared with ad networks (Google AdMob) to serve ads |
| Purposes | Advertising / Analytics (ad performance) |
| Data encrypted in transit | **Yes** (HTTPS) |
| Can users request data deletion? | **No** — the data collected is the device advertising ID; users can reset it any time in Android Settings → Ads, or opt out via Privacy → Ads. State this in the "data deletion" note field. |

> Game progress (stars, coins, best scores) is stored ONLY in the app's local
> storage on the device and never leaves it. The only data transmitted is what
> the Google Mobile Ads SDK collects for serving ads.

---

## 6. Target audience & content

| Field | Answer |
|---|---|
| Target age groups | Children (5 & under), 6–8, 9–12, 13–18, 18+ — tick **all** |
| Could the app appeal to children? | Yes |
| Content suitable for children? | Yes — no chat, no purchases, no user-generated content |

> ⚠️ If you want the **Designed for Families** program you must serve
> families-certified ads in your AdMob account for this app (a toggle in AdMob).
> Otherwise skip the program — the app still appears in normal search.

---

## 7. App content — other checkboxes

| Item | Answer |
|---|---|
| Ads | **Contains ads** (optional rewarded + between-round interstitials) |
| In-app purchases | None |
| News app | No |
| COVID-19 app | No |
| Government app | No |
| Financial features | No |
| Health apps | No |
| Audio | Brief synthesized sound effects; video ads (network-served) |
| 2D/3D rendering | 2D only |
| AR | No |
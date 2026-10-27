# 🚀 Build & Deploy Guide — Word Play

From this folder to a live app on Google Play. Follow the steps in order.

---

## 0. Try the games right now (30 seconds)

Open the game in any browser — no build needed:

```bash
open game/index.html
```

Play all three games! This is exactly what ships inside the Android app.

---

## 1. What's in this project

```
word-play/
├── game/                  The complete games (HTML/CSS/JS) — playable in any browser
│                          Chain Reaction · Word Duel (pass&play) · Word Hunt · Word of the Day
├── android/               Native Android Studio project (Kotlin WebView shell + AdMob rewarded ads)
├── store-listing/         Everything for the Play Console listing
│   ├── icon-512.png           Play Store icon (512×512)
│   ├── feature-graphic.png    Feature graphic (1024×500)
│   ├── screenshots/           8 phone (1080×1920) + 2 tablet (1600×2560) shots
│   ├── listing.md             All listing texts + form answers (copy-paste)
│   └── privacy-policy.html    Host this (see step 5)
├── tools/                 Icon generator (Swift), feature graphic source, pixel checkers
├── README.md             Project overview
└── BUILD-AND-DEPLOY.md   This file
```

---

## 2. Test on a real Android device

**Option A — Android Studio (recommended first time)**
1. Install/open **Android Studio**.
2. `File → Open…` → select the **`android/`** folder.
3. Let it sync (it downloads Gradle 9.6.0 + dependencies automatically on first open).
4. Enable **Developer options → USB debugging** on your phone, plug it in.
5. Press **▶ Run**. The game installs and launches fullscreen.

> Toolchain note: the project uses **AGP 9.4.0 / Gradle 9.6.0** with AGP's
> built-in Kotlin — it works with the JDK bundled in current Android Studio
> (Java 17+ required, verified with Java 25).

**Option B — Command line (already verified working on this Mac)**

```bash
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
  ./gradlew assembleDebug
```

The debug APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.
Install it with:

```bash
~/Library/Android/sdk/platform-tools/adb install -r \
  android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 3. Build the signed release bundle (AAB)

Google Play requires an **Android App Bundle (.aab)** signed with your own keystore.

**3.1. Create a keystore (one-time — keep this file safe forever!)**

```bash
keytool -genkeypair -v \
  -keystore chain-words-release.jks \
  -alias chainwords \
  -keyalg RSA -keysize 2048 -validity 10000
```

(Any JDK works — you can also run `keytool` from Android Studio's JBR:
`"/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool"`.)

**3.2. Build the signed AAB**

Easiest: in Android Studio use **Build → Generate Signed App Bundle / APK…**
→ *Android App Bundle* → pick your keystore → **release**.

Or from the CLI:

```bash
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
  ./gradlew bundleRelease
# produces app/build/outputs/bundle/release/app-release.aab
# (unsigned — Play signs it for you via Play App Signing, see step 4)
```

> **Play App Signing:** when you upload your first AAB, Play Console asks you to
> enroll in *Play App Signing*. Google manages the signing key; you keep your
> upload keystore (`chain-words-release.jks`) for future updates. Just follow the
> default (recommended) option.

---

## 4. Create the app on Play Console

1. Sign up at **play.google.com/console** (one-time **US $25** fee).
2. **Create app** → fill in: name `Word Play: 3 Word Games`, language English (US), **Game**, **Free**.
3. Open **Store listing** and paste everything from **`store-listing/listing.md`**:
   - Upload `store-listing/icon-512.png`, `feature-graphic.png`
   - Upload all screenshots from `store-listing/screenshots/`
   - Short + full descriptions from `listing.md`
4. **App content** section — complete every item using the answer tables in `listing.md`:
   - Privacy policy URL (see step 5 below)
   - Ads → **Contains ads** (rewarded, optional)
   - Content rating questionnaire → answers in `listing.md` → results in **Everyone**
   - Target audience → all age groups 5+ (optionally opt in to *Designed for Families*)
   - Data safety → answers in `listing.md` §5 (AdMob advertising ID)
   - App access → *All functionality available to all users*

---

## 5. ✅ Privacy policy — already hosted!

The repo's GitHub Pages is enabled, so your privacy policy is live at:

```
https://alirizwantariq.github.io/word-play/store-listing/privacy-policy.html
```

Use that URL in the Play Console privacy policy field.

> ⚠️ One step left: replace `your-email@example.com` inside
> `store-listing/privacy-policy.html` with your real support email,
> then commit + push — GitHub Pages updates automatically.

Bonus: the game itself is playable online at
`https://alirizwantariq.github.io/word-play/game/index.html` — great for
sharing with testers before the Play Store launch.

---

## 6. ⚠️ Go live with REAL ads (required before production)

The app ships with **Google's official TEST ad IDs** so you can test everything
safely without an account. Test ads look real but pay nothing. Before going to
production, swap in your own AdMob IDs:

1. Create a free **AdMob account** at admob.google.com → add your app
   ("Word Play", Android, package `com.wordplay.game`).
2. Create a **Rewarded** ad unit and copy its ID (`ca-app-pub-…/…`).
3. Replace **2 strings** in the Android project:
   - `android/app/src/main/AndroidManifest.xml` →
     `com.google.android.gms.ads.APPLICATION_ID` = your AdMob **app ID**
     (looks like `ca-app-pub-…~…`)
   - `android/app/src/main/java/com/wordplay/game/MainActivity.kt` →
     `TEST_AD_UNIT` = your AdMob **rewarded unit ID**
     (looks like `ca-app-pub-…/…`)
4. Rebuild the AAB (step 3) and upload.
5. In AdMob, if you publish as a family/kids-friendly game, enable
   **"Families" ads** for this app (AdMob → Apps → your app → Ad content
   filtering) so only family-certified ads serve.

> Don't want ads at all? Remove `play-services-ads` from
> `android/app/build.gradle`, delete the ads code block in `MainActivity.kt`,
> remove the INTERNET permission + AdMob meta-data from the manifest, then
> answer "No ads" and "No data collected" in the Console — and you're back to
> the zero-data privacy story.

---

## 7. ⚠️ Closed testing requirement (new personal accounts)

If your **personal** developer account was created after Nov 2023, Google requires
a **closed test before production**:

| Requirement | Detail |
|---|---|
| Testers | At least **12 testers** must opt in and stay opted in |
| Duration | Test must run for at least **14 days** continuously |
| Track | Run it as a **Closed testing** track |

How to run it:
1. Play Console → **Testing → Closed testing → Create track**.
2. Upload your AAB, add your email list (up to 100 emails), roll out.
3. Testers get an opt-in link — they install from Play like a normal app.
4. Find 12+ people: friends, family, coworkers, classmates, Reddit
   (r/AndroidBtesting, r/alphabetausers), or the Play Console "tester communities".
5. After 14 days with 12 testers, Console unlocks the **Production** track.

*(If you publish under an organization account instead, this requirement doesn't apply.)*

---

## 8. Production release

1. **Production → Create release** → upload the same AAB → rollout **100%** (or staged: 5% → 20% → 100% over a few days — safer).
2. Set countries (start with a few, go global after early feedback).
3. Submit → review usually takes **a few hours to a few days**.
4. 🎉 You're live on Google Play.

---

## 9. Updating the app later

1. Edit the game (`game/` folder — most changes live in `js/levels.js`).
2. Re-copy the game into the Android assets:
   ```bash
   rm -rf android/app/src/main/assets/www && cp -R game android/app/src/main/assets/www
   ```
3. Bump the version in `android/app/build.gradle`:
   - `versionCode 1 → 2` (must increase by exactly 1 each release)
   - `versionName "1.0.0" → "1.1.0"`
4. Rebuild the AAB, upload to the same app → new release.

---

## 10. Making it your own

- **New levels:** add chains to `game/js/levels.js` — every consecutive word pair
  should be a strong association. Test in browser with `game/index.html?demo=test`.
- **Colors/theme:** tweak CSS variables at the top of `game/css/styles.css`.
- **Sounds:** all effects are synthesized in `game/js/audio.js`.
- **Icons:** edit `tools/make-icons.swift` and re-run it (`swift tools/make-icons.swift ..`).
- **Keep Play happy:** `targetSdk` is 35. Google requires targeting an API within
  1 year of the newest Android release — bump `compileSdk`/`targetSdk` in
  `android/app/build.gradle` to 36 or 37 with your next update (before ~Oct 2027).

## 11. Future monetization (optional roadmap)

✅ **Rewarded ads are already built in** (optional "watch ad → +100 coins",
Google AdMob with test IDs — see §6 to go live). If you want more later:

| Option | Effort | Notes |
|---|---|---|
| More ad placements (interstitial) | Low | Keep them rare — players hate mid-game ads |
| In-app purchases (coin packs / remove ads) | Medium | Google Play Billing; set up products in Console |
| Online multiplayer / leaderboards | High | Needs a backend (e.g., Firebase) + new Data Safety answers |
| Paid app | Trivial | Switch from Free to Paid (not recommended first release — free + volume first) |
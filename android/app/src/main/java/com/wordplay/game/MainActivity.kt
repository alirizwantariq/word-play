package com.wordplay.game

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewAssetLoader.AssetsPathHandler
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

/**
 * Native shell for Word Play.
 *
 * The games (chain reaction / word duel / word hunt) are plain
 * HTML/CSS/JS shipped as assets and served locally through
 * WebViewAssetLoader, so gameplay works 100% offline.
 *
 * The only online feature is ads: OPTIONAL rewarded ads (watch a short
 * ad -> +100 coins / hints) and interstitials at round breaks (the game
 * decides when - see adBreak() in game.js). Debug builds use Google's
 * TEST units; release IDs come from gradle.properties (see
 * BUILD-AND-DEPLOY.md). Nothing loads until Google's UMP consent flow
 * says ads may be requested.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    private val assetLoader by lazy {
        WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", AssetsPathHandler(this))
            .build()
    }

    /* ---------- consent (UMP) + SDK start ---------- */

    private lateinit var consentInfo: ConsentInformation
    private val adsStarted = AtomicBoolean(false)

    private fun gatherConsent() {
        val params = ConsentRequestParameters.Builder()
            // child-directed: no consent form, ads are non-personalised anyway
            .setTagForUnderAgeOfConsent(BuildConfig.ADMOB_CHILD_DIRECTED)
            .build()
        consentInfo = UserMessagingPlatform.getConsentInformation(this)
        consentInfo.requestConsentInfoUpdate(this, params, {
            UserMessagingPlatform.loadAndShowConsentFormIfRequired(this) { _ ->
                if (consentInfo.canRequestAds()) startAds()
            }
        }, { _ ->
            // offline / UMP error: fall back to whatever consent was stored last time
            if (consentInfo.canRequestAds()) startAds()
        })
        // a returning user's stored consent lets ads start before the update finishes
        if (consentInfo.canRequestAds()) startAds()
    }

    private fun startAds() {
        if (!adsStarted.compareAndSet(false, true)) return
        if (BuildConfig.ADMOB_CHILD_DIRECTED) {
            MobileAds.setRequestConfiguration(
                RequestConfiguration.Builder()
                    .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE)
                    .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
                    .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)
                    .build()
            )
        }
        Thread {
            MobileAds.initialize(this) {
                runOnUiThread {
                    loadAd()
                    loadInterstitial()
                }
            }
        }.start()
    }

    /* ---------- rewarded ads ---------- */

    private var rewardedAd: RewardedAd? = null
    private var earnedReward = false

    private fun loadAd() {
        RewardedAd.load(
            this,
            BuildConfig.ADMOB_REWARDED_ID,
            AdRequest.Builder().build(),
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    rewardedAd = null
                }
            }
        )
    }

    private fun showAd() {
        runOnUiThread {
            val ad = rewardedAd
            if (ad == null) {
                notifyReward(false)
                return@runOnUiThread
            }
            earnedReward = false
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    rewardedAd = null
                    loadAd()
                    notifyReward(earnedReward)
                }

                override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                    rewardedAd = null
                    loadAd()
                    notifyReward(false)
                }
            }
            ad.show(this@MainActivity) { _ -> earnedReward = true }
        }
    }

    private fun notifyReward(earned: Boolean) {
        webView.evaluateJavascript("window.__adReward && window.__adReward($earned)", null)
    }

    /* ---------- interstitials (round breaks) ---------- */

    // read from the JS bridge thread, so taken atomically
    private val interstitialAd = AtomicReference<InterstitialAd?>(null)

    private fun loadInterstitial() {
        InterstitialAd.load(
            this,
            BuildConfig.ADMOB_INTERSTITIAL_ID,
            AdRequest.Builder().build(),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd.set(ad)
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    interstitialAd.set(null)
                }
            }
        )
    }

    /** Shows the loaded interstitial; the game resumes via window.__interstitialDone(). */
    private fun showInterstitial(ad: InterstitialAd) {
        runOnUiThread {
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    loadInterstitial()
                    notifyInterstitialDone()
                }

                override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                    loadInterstitial()
                    notifyInterstitialDone()
                }
            }
            ad.show(this@MainActivity)
        }
    }

    private fun notifyInterstitialDone() {
        webView.evaluateJavascript("window.__interstitialDone && window.__interstitialDone()", null)
    }

    /* ---------- lifecycle ---------- */

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        /* Keyboard fix for edge-to-edge (Android 15): pad the WebView above
           the IME so inputs & buttons stay visible while typing. */
        androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(webView) { v, insets ->
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
            v.setPadding(0, 0, 0, ime)
            insets
        }

        /* Allow Chrome DevTools remote debugging for debug/test builds
           (chrome://inspect) - never active in release. */
        if ((applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true          // localStorage for progress/stars/coins
            textZoom = 100                    // ignore system font-size scaling
        }

        webView.addJavascriptInterface(Bridge(), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                /* Serve game assets straight from the APK, and never let
                   the WebView HTTP cache keep an old copy after an app
                   update (stale JS/CSS would break the new build). */
                val res = assetLoader.shouldInterceptRequest(request.url) ?: return null
                res.responseHeaders = mapOf("Cache-Control" to "no-store")
                return res
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean = request.url.host != HOST
        }

        // Android back button -> let the game decide (close overlay / go home / exit)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript("window.__crwBack && window.__crwBack()", null)
            }
        })

        // ads start only once UMP consent allows them (see gatherConsent)
        gatherConsent()

        webView.loadUrl("https://$HOST/assets/www/index.html")
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    /** Immersive fullscreen, like a real game. */
    private fun hideSystemBars() {
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        controller.hide(WindowInsetsCompat.Type.systemBars())
    }

    /** JS bridge exposed to the game as window.AndroidBridge */
    inner class Bridge {
        @JavascriptInterface
        fun exitApp() {
            finish()
        }

        @JavascriptInterface
        fun showRewardedAd() {
            showAd()
        }

        /** true = an interstitial is showing and __interstitialDone() will follow. */
        @JavascriptInterface
        fun showInterstitial(): Boolean {
            val ad = interstitialAd.getAndSet(null) ?: return false
            showInterstitial(ad)
            return true
        }

        /** Settings shows a "Privacy options" button only when UMP requires one. */
        @JavascriptInterface
        fun privacyOptionsRequired(): Boolean =
            ::consentInfo.isInitialized && consentInfo.privacyOptionsRequirementStatus ==
                ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED

        @JavascriptInterface
        fun showPrivacyOptions() {
            runOnUiThread {
                UserMessagingPlatform.showPrivacyOptionsForm(this@MainActivity) { _ ->
                    if (consentInfo.canRequestAds()) startAds()
                }
            }
        }

        /** Native share sheet — used by Word Duel's "Invite friends" */
        @JavascriptInterface
        fun shareText(text: String) {
            runOnUiThread {
                val send = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, text)
                }
                startActivity(Intent.createChooser(send, "Invite friends"))
            }
        }
    }

    companion object {
        private const val HOST = "appassets.androidplatform.net"
    }
}
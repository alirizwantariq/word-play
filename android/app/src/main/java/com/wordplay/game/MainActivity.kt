package com.wordplay.game

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
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
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

/**
 * Native shell for Word Play.
 *
 * The games (chain reaction / word duel / word hunt) are plain
 * HTML/CSS/JS shipped as assets and served locally through
 * WebViewAssetLoader, so gameplay works 100% offline.
 *
 * The only online feature is OPTIONAL rewarded ads (watch a short ad
 * -> +100 coins). AdMob is initialised with Google's official TEST
 * ad unit - swap in your own AdMob IDs before going live (see
 * BUILD-AND-DEPLOY.md).
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    private val assetLoader by lazy {
        WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", AssetsPathHandler(this))
            .build()
    }

    /* ---------- rewarded ads ---------- */

    private var rewardedAd: RewardedAd? = null
    private var earnedReward = false

    private fun loadAd() {
        RewardedAd.load(
            this,
            TEST_AD_UNIT,
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

    /* ---------- lifecycle ---------- */

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

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
            ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

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

        // optional rewarded ads (test ad unit; see BUILD-AND-DEPLOY.md to swap)
        Thread { MobileAds.initialize(this) { loadAd() } }.start()

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

        /** Google's public rewarded-ads TEST unit. Replace before release. */
        private const val TEST_AD_UNIT = "ca-app-pub-3940256099942544/5224354917"
    }
}
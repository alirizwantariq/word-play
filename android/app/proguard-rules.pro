# Keep the JavaScript bridge when minification is enabled
-keepclassmembers class com.wordplay.game.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
# Google Mobile Ads
-keep class com.google.android.gms.ads.** { *; }

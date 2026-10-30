// Capture Play Store screenshots from the live Android device.
// Usage: node tools/store-shots.mjs phone|tablet
import { execSync } from "child_process";
import { mkdirSync } from "fs";

const ADB = process.env.HOME + "/Library/Android/sdk/platform-tools/adb";
const kind = process.argv[2] || "phone";
const OUT = `store-listing/screenshots/${kind}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function cdp(e) {
  for (let i = 0; i < 3; i++) {
    try {
      const out = execSync("node tools/cdp.mjs -", { input: e, maxBuffer: 1 << 20 }).toString().trim();
      try { return JSON.parse(out); } catch { return out; }
    } catch (e2) { execSync("sleep 1"); }
  }
  return null;
}
function waitReady() {
  for (let i = 0; i < 20; i++) {
    if (cdp('typeof currentScreen') === "string") return true;
    execSync("sleep 1");
  }
  throw new Error("page not ready");
}

function shot(name) {
  execSync(`${ADB} shell screencap -p /sdcard/_shot.png`, { stdio: "ignore" });
  execSync(`${ADB} pull /sdcard/_shot.png ${OUT}-${name}.png`, { stdio: "ignore" });
  console.log(`  saved ${OUT}-${name}.png`);
}
async function demo(mode, name, settle = 900) {
  try { cdp(`location.href="https://appassets.androidplatform.net/assets/www/index.html?demo=${mode}"; 1`); }
  catch (e) { /* navigation kills the evaluate - fine */ }
  await sleep(1500);
  waitReady();
  await sleep(settle);
  shot(name);
}

mkdirSync("store-listing/screenshots", { recursive: true });
console.log(`— capturing ${kind} screenshots —`);
await demo("home", "home");
await demo("packs", "packs");
await demo("levels", "levels");
await demo("play", "play");
await demo("win", "win", 1200);
await demo("endless", "endless");
await demo("duelwrite", "duelwrite");
await demo("duel", "duel");
await demo("hunt", "hunt");
console.log("done");
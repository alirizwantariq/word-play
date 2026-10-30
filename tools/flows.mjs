// Real-tap end-to-end flows for the Word Play WebView on the emulator.
// Every interaction is a physical `adb shell input tap/swipe` at coordinates
// computed from the live DOM, so this exercises the real touch pipeline.
import { execSync } from "child_process";

const ADB = process.env.HOME + "/Library/Android/sdk/platform-tools/adb";
const DENSITY = 2.625;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function cdp(expr) {
  for (let i = 0; i < 3; i++) {
    try {
      const out = execSync("node tools/cdp.mjs -", {
        input: expr, maxBuffer: 1 << 20,
      }).toString().trim();
      try { return JSON.parse(out); } catch { return out; }
    } catch (e) {
      if (i === 2) throw e;
      execSync("sleep 1");
    }
  }
}
function ensureApp() {
  const focus = execSync(`${ADB} shell dumpsys window | grep mCurrentFocus`, { maxBuffer: 1 << 20 }).toString();
  if (!focus.includes("wordplay")) {
    execSync(`${ADB} shell am start -n com.blankthedev.wordplay/com.wordplay.game.MainActivity`, { stdio: "ignore" });
    execSync("sleep 3");
    const pid = execSync(`${ADB} shell pidof com.blankthedev.wordplay`).toString().trim();
    execSync(`${ADB} forward tcp:9222 localabstract:webview_devtools_remote_${pid}`, { stdio: "ignore" });
  }
  /* wait until the game page is actually interactive */
  for (let i = 0; i < 15; i++) {
    try {
      const state = execSync(`node tools/cdp.mjs "typeof currentScreen"`, { maxBuffer: 1 << 20 }).toString().trim();
      if (state.includes("string")) return;
    } catch (e) { /* socket not ready yet */ }
    execSync("sleep 1");
  }
  throw new Error("game page did not become ready");
}
function tapCss(x, y) {
  execSync(`${ADB} shell input tap ${Math.round(x * DENSITY)} ${Math.round(y * DENSITY)}`);
}
async function tapEl(jsExpr) {
  const r = cdp(`(function(el){if(!el||!el.getBoundingClientRect)return null;
    var r=el.getBoundingClientRect();
    if(r.width===0||r.height===0)return null;
    return [r.left+r.width/2, r.top+r.height/2]})(${jsExpr})`);
  if (!r) throw new Error("element missing: " + jsExpr);
  if (process.env.FLOW_DEBUG) console.log(`    tap ${jsExpr.slice(0, 60)} → css(${r[0].toFixed(0)},${r[1].toFixed(0)}) phys(${Math.round(r[0]*DENSITY)},${Math.round(r[1]*DENSITY)})`);
  tapCss(r[0], r[1]);
  await sleep(500);
}
function key(k) { execSync(`${ADB} shell input keyevent ${k}`); }

let pass = 0, fail = 0;
function check(name, cond) {
  console.log((cond ? "  ✓ " : "  ✗ ") + name);
  cond ? pass++ : fail++;
}

async function chainFlow() {
  console.log("— FLOW 1: Chain Reaction level, played entirely with real taps —");
  ensureApp();
  cdp('renderHome(); null');
  await sleep(600);
  await tapEl('document.getElementById("btn-continue")');
  check("home → level screen", cdp('currentScreen') === "screen-game");

  let guard = 0;
  while (cdp('G && G.nextIdx < G.chain.length - 1') === true && guard++ < 10) {
    await tapEl(`document.querySelector('#tile-grid .tile[data-word="${cdp('G.chain[G.nextIdx]')}"]')`);
    await sleep(350);
  }
  await sleep(1300); // win overlay + confetti
  check("level won via taps", cdp('document.getElementById("overlay").classList.contains("show")') === true);
  check("stars awarded", cdp('Object.keys(save.stars).length') > 0);
  if (cdp('document.getElementById("ov-next") ? true : false')) {
    const before = cdp('G.levelIdx');
    await tapEl('document.getElementById("ov-next")');
    const after = cdp('currentScreen');
    check("NEXT advances (next level or pack list)",
      (after === "screen-game" && cdp('G.levelIdx') === before + 1) || after === "screen-packs");
  }
  key(4); await sleep(600);
  check("back key → home", cdp('currentScreen') === "screen-home");
}

async function duelFlow() {
  console.log("— FLOW 2: Word Duel, real taps (chips, LOCK IN, keyboard) —");
  ensureApp();
  cdp('WordDuel.start(); null');
  await tapEl('document.getElementById("duel-back1")');      // back cancels duel
  check("duel back → home", cdp('currentScreen') === "screen-home");
  cdp('WordDuel.start(); null');
  await tapEl('document.querySelectorAll("#duel-player-count .pill-btn")[2]'); // 4 players
  check("4 players selectable", cdp('WordDuel._state().selected') === 4);
  await tapEl('document.getElementById("duel-start")');
  check("write screen", cdp('currentScreen') === "duel-write");
  // type via CDP (emulator IME quirk), tap chips with real taps
  cdp('var i=document.getElementById("duel-input"); i.value="PIZ"; i.dispatchEvent(new Event("input",{bubbles:true})); null');
  await tapEl('document.querySelector("#duel-cats .cat-chip")');
  await sleep(200);
  await tapEl('document.querySelector("#duel-suggestions .sugg-chip")'); // tap PIZZA
  check("suggestion chip fills word", cdp('document.getElementById("duel-input").value') === "PIZZA");
  await tapEl('document.getElementById("duel-write-done")');
  check("LOCK IN → pass screen", cdp('currentScreen') === "duel-pass");
  await tapEl('document.getElementById("duel-pass-btn")');
  check("pass → next writer", cdp('currentScreen') === "duel-write" && cdp('WordDuel._state().writerIdx') === 1);
  // remaining players via JS (fast), then guess with real key taps
  cdp('for(var k=1;k<4;k++){WordDuel.passAction(); document.getElementById("duel-input").value=["MOON","TACO","GIFT"][k-1]; WordDuel.confirmWord();} null');
  await sleep(300);
  await tapEl('document.getElementById("duel-pass-btn")');
  check("guess screen up", cdp('currentScreen') === "duel-guess");
  // tap letters: P I Z Z A with real taps
  "PIZZA".split("").forEach(() => {});
  for (const ch of "PIZZA") {
    await tapEl(`document.querySelectorAll('#duel-keyboard .key')[${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(ch)}]`);
  }
  await sleep(700);
  check("word solved via key taps", cdp('WordDuel._state().solved') === true);
  check("guesser scored", cdp('WordDuel._state().players[1].score') > 0);
  key(4); await sleep(500);
  check("back from duel → home", cdp('currentScreen') === "screen-home");
}

async function huntFlow() {
  console.log("— FLOW 3: Word Hunt, real taps + real swipe selection —");
  ensureApp();
  cdp('renderHome(); null');
  await tapEl('document.getElementById("btn-hunt")');
  check("mode picker opens", cdp('document.getElementById("overlay").classList.contains("show")') === true);
  await tapEl('document.getElementById("hunt-mode-btn-0")'); // BLITZ
  check("hunt starts (BLITZ)", cdp('currentScreen') === "screen-hunt" && cdp('WordHunt.MODES[WordHunt._state().modeIdx].name') === "BLITZ");

  // REAL SWIPE along the first unfound word's full length
  const pts = cdp('(function(){var w=WordHunt._state().grid.words[0];return {word:w.w,cells:w.cells}})()');
  const a = cdp(`(function(){var c=document.querySelectorAll('#hunt-grid .hunt-cell')[${pts.cells[0]}];var r=c.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
  const b = cdp(`(function(){var c=document.querySelectorAll('#hunt-grid .hunt-cell')[${pts.cells[pts.cells.length - 1]}];var r=c.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
  execSync(`${ADB} shell input swipe ${Math.round(a[0]*DENSITY)} ${Math.round(a[1]*DENSITY)} ${Math.round(b[0]*DENSITY)} ${Math.round(b[1]*DENSITY)} ${250 * pts.cells.length}`);
  await sleep(900);
  check(`swipe found "${pts.word}"`, cdp(`WordHunt._state().found.indexOf("${pts.word}")!==-1`) === true);

  // anchor-tap flow: tap first letter → cancel bar shows; tap outside → cleared
  const w2 = cdp('(function(){var s=WordHunt._state();for(var i=0;i<s.grid.words.length;i++){if(s.found.indexOf(s.grid.words[i].w)===-1)return s.grid.words[i];}return null})()');
  const p1 = cdp(`(function(){var c=document.querySelectorAll('#hunt-grid .hunt-cell')[${w2.cells[0]}];var r=c.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
  execSync(`${ADB} shell input tap ${Math.round(p1[0]*DENSITY)} ${Math.round(p1[1]*DENSITY)}`);
  await sleep(400);
  check("tap selects anchor + cancel bar",
    cdp('document.querySelectorAll("#hunt-grid .hunt-cell.sel").length') > 0 &&
    cdp('document.getElementById("hunt-cancelbar").classList.contains("show")') === true);
  execSync(`${ADB} shell input tap ${Math.round(30 * DENSITY)} 70`); // tap outside (status row)
  await sleep(400);
  check("no selection stuck", cdp('document.querySelectorAll("#hunt-grid .hunt-cell.sel").length') === 0);

  key(4); await sleep(500);
  check("back from hunt → home (timer stops)", cdp('currentScreen') === "screen-home" && cdp('WordHunt.active()') === false);
}

async function exitFlow() {
  console.log("— FLOW 4: back key on home exits the app —");
  cdp('renderHome(); null');
  key(4); await sleep(1200);
  const focus = execSync(`${ADB} shell dumpsys window | grep mCurrentFocus`).toString();
  check("app exits cleanly from home", !focus.includes("wordplay"));
}

async function main() {
  ensureApp();
  await chainFlow();
  await duelFlow();
  await huntFlow();
  await exitFlow();
  console.log(`\nREAL-TAP FLOWS: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error("FLOW ERROR:", e.message); process.exit(1); });
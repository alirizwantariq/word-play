// CDP driver for the Word Play WebView on the Android emulator.
// Usage: node tools/cdp.mjs "<js expression>"  -> prints JSON result
// Self-heals the adb forward: Android restarts the app process often
// (backgrounded apps get killed), which renames the devtools socket.
import { execSync } from "child_process";

const ADB = process.env.HOME + "/Library/Android/sdk/platform-tools/adb";
const BASE = "http://localhost:9222";

function reforward() {
  try {
    const pid = execSync(`${ADB} shell pidof com.blankthedev.wordplay`).toString().trim();
    if (pid) execSync(`${ADB} forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);
  } catch (e) { /* app not running */ }
}

async function main() {
  const expr = process.argv[2] === "-"
    ? await new Promise(r => { let s = ""; process.stdin.on("data", d => s += d).on("end", () => r(s)); })
    : process.argv[2];
  if (!expr) { console.error("usage: node cdp.mjs '<js>' (or '-' to read from stdin)"); process.exit(1); }

  reforward();
  const targets = await (await fetch(`${BASE}/json`)).json();
  const page = targets.find((t) => t.type === "page" && t.url.includes("appassets"));
  if (!page) { console.error(JSON.stringify({ error: "game page not found" })); process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  await new Promise((r) => (ws.onopen = r));

  const out = await send("Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  ws.close();
  if (out.result.exceptionDetails) {
    const d = out.result.exceptionDetails;
    console.log(JSON.stringify({ jsError: (d.exception && d.exception.description) || d.text }));
    process.exit(0);
  }
  const r = out.result.result;
  console.log(JSON.stringify(r.value !== undefined ? r.value : r.description));
  process.exit(0);
}
main().catch(e => {
  console.log(JSON.stringify({ error: String(e && e.cause ? e.cause.code || e.cause : e.message || e) }));
  process.exit(0);
});
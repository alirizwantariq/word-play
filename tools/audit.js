// On-device UI audit: checks the ACTIVE screen for clipped content,
// off-screen controls and truncated text. Returns a problems[] array.
// Run: node tools/cdp.mjs "$(node tools/audit.js)"  -- or embed directly.
(function () {
  var problems = [];
  var vw = window.innerWidth, vh = window.innerHeight;
  if (document.documentElement.scrollWidth > vw + 2)
    problems.push("H-OVERFLOW page " + document.documentElement.scrollWidth + " > " + vw);
  document.querySelectorAll(".screen.active").forEach(function (s) {
    if (s.scrollHeight > s.clientHeight + 4)
      problems.push("V-CLIP " + s.id + " " + s.scrollHeight + " > " + s.clientHeight);
    if (s.scrollWidth > s.clientWidth + 4)
      problems.push("H-CLIP " + s.id + " " + s.scrollWidth + " > " + s.clientWidth);
  });
  document.querySelectorAll(".screen.active button, .screen.active input, .screen.active .tile, .screen.active .chip, .screen.active .hunt-cell").forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.right > vw + 2 || r.left < -2 || r.bottom > vh + 2 || r.top < -2)
      problems.push("OFFSCREEN " + (el.id || el.className.split(" ")[0] || el.tagName) +
        " [" + Math.round(r.left) + "," + Math.round(r.top) + "," + Math.round(r.right) + "," + Math.round(r.bottom) + "]" +
        " vw" + vw + " vh" + vh);
  });
  document.querySelectorAll(".screen.active .btn, .screen.active .stat-chip, .screen.active .chip, .screen.active .ov-title, .screen.active .duel-h").forEach(function (el) {
    var st = getComputedStyle(el);
    if (st.textOverflow === "ellipsis" || st.overflow === "hidden") return;
    if (el.scrollWidth > el.clientWidth + 3)
      problems.push("TEXT-CLIP " + (el.id || el.className.split(" ")[0]) + ": " + el.scrollWidth + " > " + el.clientWidth + ' ["' + el.textContent.trim().slice(0, 24) + '"]');
  });
  return problems;
})()
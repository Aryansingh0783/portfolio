/*
 * Phone performance. Idempotent. Measured on a throttled phone profile: the WebGL waves background kept the
 * main thread ~45% busy at idle and the worst scroll frame at 50 ms; without it, 3% and 17 ms.
 *
 *  - home: load hero-waves.js only on non-touch screens wider than 900px (phones get a static CSS dot pattern)
 *  - lenis-smooth.js: not on touch screens (native scrolling is smoother and cheaper)
 *  - cyberpunk-core.css: no full-screen animated scanline sweep on phones
 */
const fs = require("fs");
const path = require("path");
const SITE = path.join(__dirname, "..", "site");
const log = [];

// 1. home page loader + fallback
{
  const f = path.join(SITE, "index.html");
  let h = fs.readFileSync(f, "utf8");
  const tag = '<script src="/js/hero-waves.js"></script>';
  const loader = '<script id="waves-loader">(function(){var m=window.matchMedia,coarse=m&&m("(pointer: coarse)").matches,reduce=m&&m("(prefers-reduced-motion: reduce)").matches;if(coarse||reduce||window.innerWidth<=900){document.documentElement.classList.add("no-waves");return}var s=document.createElement("script");s.src="/js/hero-waves.js";s.async=true;document.body.appendChild(s)})();</script>';
  if (h.includes(tag)) { h = h.replace(tag, loader); log.push("home: waves now loaded only on desktop"); } else log.push("home: waves loader already in place");
  const css = '<style id="perf-phone">html.no-waves #hero-waves{background-color:#050609;background-image:linear-gradient(rgba(5,6,9,0) 55%,#050609 100%),radial-gradient(rgba(232,217,200,.30) 1px,transparent 1.7px),radial-gradient(120% 60% at 85% 0%,rgba(232,217,200,.07),transparent 60%),radial-gradient(90% 50% at 0% 100%,rgba(249,65,55,.10),transparent 70%);background-size:100% 100%,9px 9px,100% 100%,100% 100%}</style>';
  h = h.replace(/<style id="perf-phone">[\s\S]*?<\/style>/, "");
  h = h.replace('<style id="no-xscroll">', css + '<style id="no-xscroll">'); log.push("home: static dot-pattern fallback written");
  fs.writeFileSync(f, h);
}

// 2. Lenis: skip on touch screens
{
  const f = path.join(SITE, "js", "lenis-smooth.js");
  let s = fs.readFileSync(f, "utf8");
  const guard = "/*phone-perf*/";
  if (!s.includes(guard)) {
    s = guard + 'if(!(window.matchMedia&&matchMedia("(pointer: coarse)").matches)){' + s + "\n}\n";
    fs.writeFileSync(f, s); log.push("lenis: disabled on touch screens");
  } else log.push("lenis: already guarded");
}

// 3. scanline sweep
{
  const f = path.join(SITE, "css", "cyberpunk-core.css");
  let s = fs.readFileSync(f, "utf8");
  const mark = "/*phone-perf*/";
  if (!s.includes(mark)) {
    s += "\n" + mark + "\n@media (max-width: 900px), (pointer: coarse) { .cp-scanlines::after { display: none; } }\n";
    fs.writeFileSync(f, s); log.push("css: scanline sweep off on phones");
  } else log.push("css: already patched");
}
console.log(log.join("\n"));

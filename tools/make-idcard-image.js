/*
 * Renders the ID card (from the /hero/ mirror) once into a small transparent WebP, for phones.
 * Phones then animate that image with CSS instead of loading a second Framer app.
 *
 *   node tools/make-idcard-image.js     (needs the local server on http://localhost:4191 and Playwright)
 *
 * Writes site/assets/id-card.webp
 */
const fs = require("fs");
const path = require("path");
const PW = process.env.PLAYWRIGHT_PATH || "playwright";
const { chromium } = require(PW);
const OUT = path.join(__dirname, "..", "site", "assets", "id-card.webp");
(async () => {
  const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const ctx = await b.newContext({ viewport: { width: 810, height: 560 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto("http://localhost:4191/hero/", { waitUntil: "load" });
  await p.waitForTimeout(6500); // let the drop-in animation settle
  const png = await p.screenshot({ omitBackground: true });
  // find the card's bounding box (non-transparent pixels) and re-encode it as WebP in the browser
  const q = await ctx.newPage();
  await q.setContent("<canvas id=c></canvas>");
  const res = await q.evaluate(async (b64) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.getElementById("c"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const pad = 8; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(c.width - 1, x1 + pad); y1 = Math.min(c.height - 1, y1 + pad);
    const o = document.createElement("canvas"); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
    o.getContext("2d").drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
    const blob = await new Promise((r) => o.toBlob(r, "image/webp", 0.86));
    const buf = new Uint8Array(await blob.arrayBuffer()); let s = ""; for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode.apply(null, buf.subarray(i, i + 8192));
    return { b64: btoa(s), w: o.width, h: o.height, box: [x0, y0, x1, y1] };
  }, png.toString("base64"));
  fs.writeFileSync(OUT, Buffer.from(res.b64, "base64"));
  console.log("wrote", OUT, res.w + "x" + res.h, "px,", Math.round(fs.statSync(OUT).size / 1024) + "KB, box", res.box.join(","));
  await b.close();
})();

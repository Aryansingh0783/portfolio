/*
 * Replaces the ID-card block in site/index.html with the version in tools/idcard-snippet.html
 * (desktop: hover; phone: tap button + one-time peek, lazy-loaded iframe). Idempotent.
 */
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "site", "index.html");
const snippet = fs.readFileSync(path.join(__dirname, "idcard-snippet.html"), "utf8").trim();
let h = fs.readFileSync(file, "utf8");
const startCandidates = ['<style id="id-card-css">', '<iframe id="id-card"'].map((s) => h.indexOf(s)).filter((i) => i >= 0);
const start = Math.min(...startCandidates);
const peek = h.indexOf('<script id="id-card-peek">');
const end = h.indexOf("</script>", peek) + "</script>".length;
if (!isFinite(start) || peek < 0) throw new Error("id-card block not found");
h = h.slice(0, start) + snippet + h.slice(end);
// the old rule that hid the card on small screens
h = h.replace("@media (max-width:900px){#id-card,#id-card-zone{display:none!important}}", "");
fs.writeFileSync(file, h);
console.log("id-card block replaced");

// Syntax-checks every .mjs/.js file in site/ (the minified Framer chunks are edited by string replacement).
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const SITE = path.join(__dirname, "..", "site");
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === "hero") continue; // separate mirrored build
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(mjs|js)$/.test(e.name)) files.push(p);
  }
})(SITE);
let bad = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) { bad++; console.log("SYNTAX ERROR:", path.relative(SITE, f), (r.stderr || "").split("\n").slice(0, 4).join(" | ")); }
}
console.log(files.length + " files checked, " + bad + " with errors");
process.exit(bad ? 1 : 0);

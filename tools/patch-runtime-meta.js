/*
 * One-time patch of the Framer runtime files so they stop injecting the template's metadata:
 *  - siteCanonicalURL pointed at the template's domain (runtime wrote a canonical link to it)
 *  - the shared metadata (title, description, favicon, social image) was the template's
 * Safe to re-run.
 */
const fs = require("fs");
const path = require("path");
const D = path.join(__dirname, "..", "site", "assets", "framerusercontent.com", "sites", "7dNy1JQ0or7rHX3NIw4PIx");
const rd = (f) => fs.readFileSync(path.join(D, f), "utf8");
const wr = (f, s) => fs.writeFileSync(path.join(D, f), s);

let a = rd("script_main.f9EtaUn0.mjs");
const from = "siteCanonicalURL:`https://spector.framer.website`";
console.log("siteCanonicalURL occurrences:", a.split(from).length - 1);
wr("script_main.f9EtaUn0.mjs", a.split(from).join("siteCanonicalURL:void 0"));

let s = rd("shared-lib.mcl3f2QE.mjs");
s = s.replace(/description:`Spector is a Framer[^`]*`/, "description:`Aryan Singh is an AI engineer in Delhi who builds and tests AI tools, desktop apps and web apps. See real projects: Superposition, Refract, ReBackUp and more.`")
  .replace("favicon:`/assets/framerusercontent.com/assets/bAC9hJA7mQZ1Wim6guKXq3u3qE.png`", "favicon:`/favicon-32.png`")
  .replace("socialImage:`/assets/framerusercontent.com/assets/pQXIGVTD1Q9poSuKQ0LDesGXcA8.jpg`", "socialImage:`/og-image.jpg`")
  .replace("title:`Aryan Singh | AI Solutions Engineer`", "title:`Aryan Singh | AI Engineer in Delhi`");
wr("shared-lib.mcl3f2QE.mjs", s);
console.log(s.slice(80, 520));

const vf = fs.readdirSync(D).find((n) => n.startsWith("V-e4DQ8R8hTQJqqy"));
if (vf) wr(vf, rd(vf).replace("Aryan Singh | AI Solutions Engineer", "Aryan Singh"));

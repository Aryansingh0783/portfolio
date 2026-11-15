/*
 * Phone layout of the home "Selected projects" grid (the template's Project Grid component).
 * Its phone mode (container narrower than 640px) rendered only the first 3 projects as 16:9 crops,
 * which cut the tiles. This shows all 6 at the tiles' own proportions with no hover label on top.
 * Idempotent. Also run by `npm run build` through tools/seo.js is NOT needed: this edits a source chunk once.
 */
const fs = require("fs");
const path = require("path");
const D = path.join(__dirname, "..", "site", "assets", "framerusercontent.com", "sites", "7dNy1JQ0or7rHX3NIw4PIx");
const f = fs.readdirSync(D).find((n) => n.startsWith("2HlTQD4jnEvrt58WsKHaXnJkOlssVT97zOw8nxNW2lY"));
let c = fs.readFileSync(path.join(D, f), "utf8");
const i = c.indexOf("function Tr({items:e,gap:t,radius:n,...r}){");
if (i < 0) throw new Error("Tr not found");
const j = c.indexOf("function Er(", i);
let seg = c.slice(i, j);
const before = seg;
seg = seg.replace("e.slice(0,3)", "e.slice(0,6)")
  .replace("paddingBottom:`56.25%`", "paddingBottom:`91%`")
  .replace("brand:e.brand,title:e.title,radius:n,hovered:!1,textAlwaysVisible:!0", "brand:``,title:``,radius:n,hovered:!1,textAlwaysVisible:!0")
  // already patched once with the title kept: drop it too (the tile art carries the title; the scrim darkened it)
  .replace("brand:``,title:e.title,radius:n,hovered:!1,textAlwaysVisible:!0", "brand:``,title:``,radius:n,hovered:!1,textAlwaysVisible:!0");
console.log(seg === before ? "already patched" : "Tr patched: 6 items, 91% tiles, no brand label");
c = c.slice(0, i) + seg + c.slice(j);
fs.writeFileSync(path.join(D, f), c);

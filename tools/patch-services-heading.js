/*
 * Home "Services" headline: the template splits its first word onto its own line ("I" / "BUILD SYSTEMS.").
 * Merge them so it reads "I BUILD SYSTEMS." on one line. Idempotent.
 */
const fs = require("fs");
const path = require("path");
const D = path.join(__dirname, "..", "site", "assets", "framerusercontent.com", "sites", "7dNy1JQ0or7rHX3NIw4PIx");
const f = path.join(D, fs.readdirSync(D).find((n) => n.startsWith("2HlTQD4jnEvrt58WsKHaXnJkOlssVT97zOw8nxNW2lY")));
let c = fs.readFileSync(f, "utf8");
const a = "gGSyT6Vkr:`I`,hcdC4KSfz:`BUILD SYSTEMS. `";
const b = "gGSyT6Vkr:``,hcdC4KSfz:`I BUILD SYSTEMS. `";
console.log("occurrences:", c.split(a).length - 1);
c = c.split(a).join(b);
fs.writeFileSync(f, c);

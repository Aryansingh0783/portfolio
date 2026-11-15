/*
 * Phone footer of the Framer pages: the template's icon row linked to the template author's X and a
 * generic YouTube. Replace with this site's GitHub, WhatsApp, LinkedIn and Instagram. Idempotent.
 */
const fs = require("fs");
const path = require("path");
const D = path.join(__dirname, "..", "site", "assets", "framerusercontent.com", "sites", "7dNy1JQ0or7rHX3NIw4PIx");
const file = path.join(D, fs.readdirSync(D).find((n) => n.startsWith("script_main.")));
let c = fs.readFileSync(file, "utf8");

const swaps = [
  ["name:`Social Icon 1`,url:`https://x.com/tamasbodo`", "name:`Social Icon 1`,url:`https://github.com/Aryansingh0783`"],
  ["name:`Social Icon 2`,url:`https://youtube.com`", "name:`Social Icon 2`,url:`https://wa.me/919821391991`"],
  ["name:`Social Icon 3`,url:`https://linkedin.com`", "name:`Social Icon 3`,url:`https://linkedin.com/in/aryansingh0783`"],
  ["name:`Social Icon 4`,url:`https:/instagram.com`", "name:`Social Icon 4`,url:`https://www.instagram.com/aryansinghxoxo/`"],
];
for (const [a, b] of swaps) { console.log(a.slice(0, 30), c.split(a).length - 1); c = c.split(a).join(b); }

// icon names: the first two icons are twitter and youtube inside the "Social Icon 1/2" blocks
for (const [name, from, to] of [["Social Icon 1", "twitter", "github"], ["Social Icon 2", "youtube", "whatsapp"]]) {
  const i = c.indexOf("name:`" + name + "`,nodeId:");
  const j = c.indexOf("iconLibrary:`" + from + "`", i);
  if (i > 0 && j > 0 && j - i < 900) { c = c.slice(0, j) + "iconLibrary:`" + to + "`" + c.slice(j + ("iconLibrary:`" + from + "`").length); console.log(name, "icon", from, "->", to); }
  else console.log(name, "icon: nothing to change");
}
fs.writeFileSync(file, c);

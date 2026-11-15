/*
 * SEO stamping for the portfolio. Idempotent: run it as often as you like.
 *
 *   node tools/seo.js                       (uses siteUrl from site.config.json)
 *   SITE_URL=https://example.com node tools/seo.js
 *
 * It (re)writes, for every indexable page: <title>, meta description, robots, canonical, Open Graph,
 * Twitter card, icons, JSON-LD. It also (re)writes sitemap.xml and robots.txt, builds the static
 * All Projects and legal pages, and creates 404.html.
 * Until a siteUrl is set, canonical / og:url / sitemap are skipped (a wrong canonical is worse than none).
 * The public contact address is read from the site's own contact page (or SITE_EMAIL), never hard-coded here.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "site");
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
// Address precedence: SITE_URL env, then site.config.json, then Vercel's own production address
// (VERCEL_PROJECT_PRODUCTION_URL is your custom domain if one is attached, otherwise the .vercel.app address).
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || "";
const SITE_URL = (process.env.SITE_URL || cfg.siteUrl || (vercelHost ? "https://" + vercelHost : "")).replace(/\/+$/, "");
const abs = (p) => (SITE_URL ? SITE_URL + p : p);
const read = (p) => fs.readFileSync(path.join(SITE, p), "utf8");
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(SITE, p)), { recursive: true }); fs.writeFileSync(path.join(SITE, p), s); };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const log = [];

// public contact address: already published on the site's contact page
const EMAIL = process.env.SITE_EMAIL || ((/mailto:([^"?\s<>]+)/.exec(read("contact/index.html")) || [])[1]) || "";
if (!EMAIL) throw new Error("No contact address found (set SITE_EMAIL).");
const MAIL_RE = EMAIL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---- projects data (shared with the All Projects page) ----
const ctx = { window: {} };
vm.runInNewContext(read("all-projects/projects-data.js"), ctx);
const PROJECTS = ctx.window.PROJECTS;

const P = cfg.person;

// ---- page definitions ----
const PAGES = [
  { path: "/", file: "index.html", title: "Aryan Singh | AI Engineer in Delhi",
    desc: "Aryan Singh is an AI engineer in Delhi who builds and tests AI tools, desktop apps and web apps. See real projects: Superposition, Refract, ReBackUp and more.",
    kind: "home", priority: "1.0" },
  { path: "/about/", file: "about/index.html", title: "About Aryan Singh | AI Engineer, Delhi",
    desc: "How Aryan Singh builds software: spec it, build it, then try to break it. B.Tech CSE 2026, 10+ Coursera certifications, Python, TypeScript, Rust, PySpark.",
    kind: "about", priority: "0.8" },
  { path: "/contact/", file: "contact/index.html", title: "Contact Aryan Singh | Hire an AI Engineer",
    desc: "Get in touch with Aryan Singh about full-time roles, freelance projects or collaborations. Open to work, based in Delhi, replies within a day or two.",
    kind: "contact", priority: "0.8" },
  { path: "/all-projects/", file: "all-projects/index.html", title: "Projects | Aryan Singh",
    desc: PROJECTS.length + " projects by Aryan Singh: Superposition, Refract, ReBackUp, RestoreForge AI, ezCLI and more. AI tools, desktop apps and web apps with live links.",
    kind: "projects", priority: "0.9" },
  { path: "/resume/", file: "resume/index.html", title: "Resume | Aryan Singh, AI Solutions Engineer",
    desc: "Resume of Aryan Singh, AI solutions engineer in Delhi: AI landing pages, ad creatives and video, agentic tools, ML pipelines in PySpark, and well-tested apps. Download the PDF.",
    kind: "resume", priority: "0.9" },
  { path: "/privacy-policy/", file: "privacy-policy/index.html", title: "Privacy Policy | Aryan Singh",
    desc: "This site sets no cookies and runs no analytics or ads. Here is exactly what data is, and is not, collected.", kind: "legal", priority: "0.3" },
  { path: "/terms-of-service/", file: "terms-of-service/index.html", title: "Terms of Service | Aryan Singh",
    desc: "Terms for using the Aryan Singh portfolio site: content ownership, open-source projects, external links and liability.", kind: "legal", priority: "0.3" },
  { path: "/disclaimer/", file: "disclaimer/index.html", title: "Disclaimer | Aryan Singh",
    desc: "Disclaimer for the Aryan Singh portfolio: information is provided as is, projects are shown for demonstration, external sites are not controlled by me.", kind: "legal", priority: "0.3" },
];

// ---- JSON-LD ----
function personNode() {
  const n = {
    "@type": "Person", "@id": abs("/") + "#person", name: P.name, jobTitle: P.jobTitle,
    description: P.description, email: "mailto:" + EMAIL,
    address: { "@type": "PostalAddress", addressLocality: P.city, addressCountry: P.country },
    knowsAbout: P.knowsAbout, sameAs: P.sameAs,
  };
  if (P.worksFor) n.worksFor = { "@type": "Organization", name: P.worksFor };
  if (P.alumniOf) n.alumniOf = { "@type": "CollegeOrUniversity", name: P.alumniOf };
  if (P.credentials) n.hasCredential = P.credentials.map((c) => ({ "@type": "EducationalOccupationalCredential", name: c }));
  if (SITE_URL) { n.url = SITE_URL + "/"; n.image = SITE_URL + "/og-image.jpg"; }
  return n;
}
function jsonld(page) {
  const g = [];
  const siteNode = { "@type": "WebSite", "@id": abs("/") + "#website", name: P.name + " | Portfolio", inLanguage: "en" };
  if (SITE_URL) siteNode.url = SITE_URL + "/";
  if (page.kind === "home") g.push(personNode(), siteNode);
  else {
    const label = { about: "About", contact: "Contact", projects: "Projects", resume: "Resume" }[page.kind] || page.title.split(" | ")[0];
    const crumb = { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
      { "@type": "ListItem", position: 2, name: label, item: abs(page.path) } ] };
    if (page.kind === "resume") g.push({ "@type": "ProfilePage", "@id": abs(page.path) + "#page", name: page.title, description: page.desc, mainEntity: personNode(), breadcrumb: crumb,
      associatedMedia: { "@type": "MediaObject", contentUrl: abs("/assets/Aryan-Singh-Resume.pdf"), encodingFormat: "application/pdf", name: "Aryan Singh resume (PDF)" } });
    else if (page.kind === "about") g.push({ "@type": "ProfilePage", "@id": abs(page.path) + "#page", name: page.title, description: page.desc, mainEntity: personNode(), breadcrumb: crumb });
    else if (page.kind === "contact") g.push({ "@type": "ContactPage", "@id": abs(page.path) + "#page", name: page.title, description: page.desc, about: { "@id": abs("/") + "#person" }, breadcrumb: crumb }, personNode());
    else if (page.kind === "projects") {
      g.push({ "@type": "CollectionPage", "@id": abs(page.path) + "#page", name: page.title, description: page.desc, breadcrumb: crumb, author: { "@id": abs("/") + "#person" },
        mainEntity: { "@type": "ItemList", numberOfItems: PROJECTS.length,
          itemListElement: PROJECTS.map((p, i) => ({ "@type": "ListItem", position: i + 1, item: {
            "@type": "SoftwareApplication", name: p.title, description: p.desc, applicationCategory: p.kind,
            keywords: p.tags.join(", "), url: p.links[0][1], author: { "@id": abs("/") + "#person" }, sameAs: p.links.map((l) => l[1]) } })) } }, personNode());
    } else g.push({ "@type": "WebPage", "@id": abs(page.path) + "#page", name: page.title, description: page.desc, breadcrumb: crumb });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": g });
}

// ---- head block ----
const OG_IMG = abs("/og-image.jpg");
function headBlock(page) {
  const t = esc(page.title), d = esc(page.desc);
  const L = [];
  L.push("<!--seo:start-->");
  L.push("<title>" + t + "</title>");
  L.push('<meta name="description" content="' + d + '">');
  L.push('<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">');
  L.push('<meta name="author" content="' + esc(P.name) + '">');
  L.push('<meta name="theme-color" content="#050609">');
  if (SITE_URL) L.push('<link rel="canonical" href="' + abs(page.path) + '">');
  L.push('<meta property="og:type" content="' + (page.kind === "about" ? "profile" : "website") + '">');
  L.push('<meta property="og:site_name" content="' + esc(P.name) + '">');
  L.push('<meta property="og:locale" content="en_IN">');
  L.push('<meta property="og:title" content="' + t + '">');
  L.push('<meta property="og:description" content="' + d + '">');
  if (SITE_URL) L.push('<meta property="og:url" content="' + abs(page.path) + '">');
  L.push('<meta property="og:image" content="' + OG_IMG + '">');
  L.push('<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">');
  L.push('<meta property="og:image:alt" content="Aryan Singh, AI Engineer in Delhi">');
  L.push('<meta name="twitter:card" content="summary_large_image">');
  L.push('<meta name="twitter:title" content="' + t + '">');
  L.push('<meta name="twitter:description" content="' + d + '">');
  L.push('<meta name="twitter:image" content="' + OG_IMG + '">');
  L.push('<meta name="twitter:image:alt" content="Aryan Singh, AI Engineer in Delhi">');
  L.push('<link rel="icon" href="/favicon.svg" type="image/svg+xml">');
  L.push('<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">');
  L.push('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');
  L.push('<link rel="manifest" href="/site.webmanifest">');
  if (["home", "about", "contact"].includes(page.kind)) L.push('<script src="/js/page-meta.js"></script>');
  L.push('<script type="application/ld+json">' + jsonld(page).replace(/</g, "\\u003c") + "</script>");
  L.push("<!--seo:end-->");
  return L.join("\n");
}
function stripHead(h) {
  h = h.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/g, "");
  h = h.replace(/<title>[\s\S]*?<\/title>/g, "");
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  h = h.replace(/<link[^>]*rel="(canonical|icon|apple-touch-icon|manifest|alternate)"[^>]*>/g, "");
  h = h.replace(/<link[^>]*href="[^"]*"[^>]*rel="(icon|apple-touch-icon|canonical)"[^>]*>/g, "");
  h = h.replace(/<meta[^>]*(name="(description|robots|author|theme-color|twitter:[a-z:]+)"|property="(og:[a-z:_]+)")[^>]*>/g, "");
  h = h.replace(/<script[^>]*events\.framer\.com\/script\.js[^>]*><\/script>/g, "");
  return h;
}
function stampHead(h, page) {
  h = stripHead(h).replace("</head>", headBlock(page) + "\n</head>");
  // Framer pages: the runtime renders "./x" links; a root base makes them resolve from the site root on every page
  if (["home", "about", "contact"].includes(page.kind) && !/<base /.test(h)) h = h.replace(/<head>/, '<head><base href="/">');
  return h;
}

// ---- text patches: raw HTML must say what the rendered page says ----
const TEXT = [
  ["WE ARE <span", "I AM <span"],
  ["We shape the brand.", "I build the product."], ["Then build the world around it.", "Then test it until it holds."],
  ["Strategy, design, and build stay in the same room on purpose.", "Design, code and testing stay in one head on purpose."],
  ["Brand shapes product, product shapes the web, and the web redefines how the brand lands.", "A tool is only as good as the edge case it survives, so I look for the edge cases first."],
  ["Once those parts become separated, something almost always gets lost in translation.", "Most bugs live in the gaps between the parts, and that is where I spend my time."],
  [">Courses Taken<", ">AI &amp; ML Projects<"],
  ["We don&#x27;t start with answers.", "I don&#x27;t start with code."], ["We don't start with answers.", "I don't start with code."],
  ["We start with the right questions.", "I start with the problem."],
  ["The problem on the brief is rarely the real problem. We dig until we find it — then we build the solution around that, not around what looked good in the pitch.", "The first description of a problem is rarely the real one. I dig until I find it, then build around that, not around what looked good on day one."],
  ["Speed is easy. Getting it right takes longer. We&#x27;d rather take the time upfront than spend twice as long fixing it after.", "Speed is easy. Getting it right takes longer. I would rather spend the time upfront than twice as long fixing it after."],
  ["Strategy, design, and build stay in the same room. When they don&#x27;t, something always gets lost between the idea and the thing that ships.", "Design, code and tests stay together. When they split apart, something always gets lost between the idea and the thing that ships."],
  ["WE DON&#x27;T SEPARATE THE STRATEGY FROM THE MAKING.", "I DON&#x27;T SEPARATE THE BUILDING FROM THE TESTING."],
  ["WE DON'T SEPARATE THE STRATEGY FROM THE MAKING.", "I DON'T SEPARATE THE BUILDING FROM THE TESTING."],
  [">Content &amp; Messaging<", ">Research &amp; Copy<"], [">Motion &amp; Interaction<", ">Frontend &amp; Testing<"], [">D&amp;AD Awards<", ">Coursera<"],
  ["<span >Python</span> <span >Identity</span>", "<span >Data Analysis</span> <span >with Python</span>"],
  [">View Project<", ">View Profile<"],
  [">Identity<", ">Software<"],
  [">Lab<", ">Resume<"], [">Lab (Blog)<", ">Resume<"],
  // phone footer icon row (template author's accounts -> this site's)
  ['href="https://x.com/tamasbodo"', 'href="https://github.com/Aryansingh0783"'],
  ['href="https://youtube.com"', 'href="https://wa.me/919821391991"'],
  ['href="https://linkedin.com"', 'href="https://linkedin.com/in/aryansingh0783"'],
  ['href="https:/instagram.com"', 'href="https://www.instagram.com/aryansinghxoxo/"'],
  ["and test them until they hold.", "then test them until they hold, from the first prototype to the last release."],
  ["Speed is easy. Getting it right takes longer. We'd rather take the time upfront than spend twice as long fixing it after.", "Speed is easy. Getting it right takes longer. I would rather spend the time upfront than twice as long fixing it after."],
  ["Strategy, design, and build stay in the same room. When they don't, something always gets lost between the idea and the thing that ships.", "Design, code and tests stay together. When they split apart, something always gets lost between the idea and the thing that ships."],
  ['aria-label="Enable JavaScript to submit this form."', 'aria-label="Enable JavaScript to use this form, or email ' + EMAIL + '"'],
];
function removeDivByClass(h, cls) {
  const m = new RegExp('<div[^>]*class="(?:[^"]*\\s)?' + cls + '(?:\\s[^"]*)?"[^>]*>').exec(h);
  if (!m) return h;
  let depth = 1; const re = /<(\/?)div\b[^>]*>/g; re.lastIndex = m.index + m[0].length; let t;
  while ((t = re.exec(h))) { depth += t[1] ? -1 : 1; if (depth === 0) return h.slice(0, m.index) + h.slice(t.index + t[0].length); }
  return h;
}
// Some headings are rendered letter by letter (one <span> per character). Match them on their plain text
// and swap the whole element's content. [stale text, new text, new tag or null to keep the tag]
const PHRASES = [
  ["SOME BRANDS JUST REFUSE TO BE FORGOTTEN.", "SOME CODE JUST REFUSES TO BREAK.", "h2"], // only one <h1> per page
  ["WE DON'T SEPARATE THE STRATEGY FROM THE MAKING.", "I DON'T SEPARATE THE BUILDING FROM THE TESTING.", null],
  ["WE SHAPE THE BRAND. THEN BUILD THE WORLD AROUND IT.", "I BUILD THE PRODUCT. THEN TEST IT UNTIL IT HOLDS.", null],
];
function patchPhrases(h) {
  const dec = (s) => s.replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().toUpperCase();
  return h.replace(/<(h[1-6]|p)\b([^>]*)>((?:(?!<\/\1>)[\s\S])*?)<\/\1>/g, (all, tag, attrs, inner) => {
    const text = dec(inner.replace(/<[^>]+>/g, ""));
    for (const [from, to, newTag] of PHRASES) if (text === from) { const t = newTag || tag; return "<" + t + attrs + ">" + to + "</" + t + ">"; }
    return all;
  });
}
function patchSSR(h, page) {
  for (const [a, b] of TEXT) if (a !== b) h = h.split(a).join(b);
  h = removeDivByClass(h, "framer-1bzxyt1"); // "Get Template" badge from the template
  h = patchPhrases(h);
  // The template writes internal links as "./page" (relative to the current folder), which crawlers resolve
  // wrongly on subpages (/about/projects). Point them at the real, final URLs.
  const LINKS = { "./": "/", "./about": "/about/", "./contact": "/contact/", "./projects": "/all-projects/", "./lab": "/resume/",
    "./privacy-policy": "/privacy-policy/", "./terms-of-service": "/terms-of-service/", "./disclaimer": "/disclaimer/", "./#services": "/#services" };
  h = h.replace(/href="(\.\/[^"]*)"/g, (all, v) => (LINKS[v] ? 'href="' + LINKS[v] + '"' : all));
  if (page.kind === "contact" && !h.includes('id="seo-h1"')) h = h.replace('<div id="main"', '<h1 id="seo-h1" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap">Contact Aryan Singh</h1><div id="main"');
  return h;
}

// ---- per-route metadata for the Framer app: it rewrites <title>/canonical on load and on in-app navigation ----
{
  const meta = {};
  for (const p of PAGES.filter((x) => ["home", "about", "contact"].includes(x.kind)))
    meta[p.path.replace(/\/+$/, "") || "/"] = { title: p.title, description: p.desc, url: SITE_URL ? SITE_URL + p.path : "" };
  write("js/page-meta.js", "/* generated by tools/seo.js */\nwindow.__PAGE_META = " + JSON.stringify(meta, null, 1) + ";\n");
  log.push("wrote js/page-meta.js");
}

// ---- framer pages ----
for (const page of PAGES.filter((p) => ["home", "about", "contact"].includes(p.kind))) {
  let h = read(page.file);
  h = patchSSR(stampHead(h, page), page);
  write(page.file, h);
  log.push("stamped " + page.file);
}

// ---- shared chrome for static pages ----
const NAV = `<header class="nav">
    <a class="logo" href="/">ARYAN SINGH</a>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/all-projects/"{{PROJ}}>Projects</a></li>
      <li><a href="/resume/"{{RES}}>Resume</a></li>
      <li><a href="/about/">About</a></li>
      <li><a href="/contact/">Contact</a></li>
    </ul>
  </header>`;
const FOOT = `<footer class="foot">
      <span>&copy; 2026 Aryan Singh. Made in Delhi.</span>
      <span><a href="https://github.com/Aryansingh0783" target="_blank" rel="noopener">GitHub</a> &nbsp;/&nbsp; <a href="https://linkedin.com/in/aryansingh0783" target="_blank" rel="noopener">LinkedIn</a> &nbsp;/&nbsp; <a href="mailto:${EMAIL}">Email</a></span>
      <span class="legal"><a href="/privacy-policy/">Privacy</a> &nbsp;/&nbsp; <a href="/terms-of-service/">Terms</a> &nbsp;/&nbsp; <a href="/disclaimer/">Disclaimer</a></span>
    </footer>`;
function shell(page, bodyInner, scripts) {
  const h = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/css/cyberpunk-core.css">
  <link rel="stylesheet" href="/all-projects/projects.css">
</head>
<body class="cp-scanlines">
  <div id="cpScrollProgress"></div>
  ${NAV.replace("{{PROJ}}", page.kind === "projects" ? ' aria-current="page"' : "").replace("{{RES}}", page.kind === "resume" ? ' aria-current="page"' : "")}
  <main class="wrap">
${bodyInner}
    ${FOOT}
  </main>
${scripts}
</body>
</html>
`;
  return stampHead(h, page);
}
const COMMON_SCRIPTS = `  <script src="/js/lenis-smooth.js"></script>
  <script src="/js/cyberpunk-fx.js"></script>`;

// ---- All Projects (static HTML so crawlers need no JavaScript) ----
{
  const page = PAGES.find((p) => p.kind === "projects");
  const rows = PROJECTS.map((p) => `      <article class="row" id="${esc(p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))}">
        <div class="n">.${esc(p.n)}</div>
        <div><h2 class="t">${esc(p.title)}</h2><div class="k">${esc(p.kind)}</div></div>
        <div class="dw"><p class="d">${esc(p.desc)}</p><div class="s">${p.tags.map(esc).join(" / ")}</div></div>
        <div class="l">${p.links.map((l) => `<a href="${esc(l[1])}" target="_blank" rel="noopener">${esc(l[0])} &#8599;</a>`).join("")}</div>
      </article>`).join("\n");
  const body = `    <section class="head">
      <div class="eyebrow">+ All projects</div>
      <h1>Built, tested, <em>shipped.</em></h1>
      <p>Every project I have put on GitHub: AI tools, desktop apps, web apps and bots. Live links where they exist.</p>
    </section>
    <section class="list" id="grid" aria-label="Projects">
${rows}
    </section>`;
  write(page.file, shell(page, body, COMMON_SCRIPTS));
  log.push("built all-projects (" + PROJECTS.length + " rows)");
}

// ---- Resume page: the resume as real HTML (searchable, readable) plus the PDF ----
{
  const page = PAGES.find((p) => p.kind === "resume");
  const job = (org, loc, role, dates, bullets) => `
      <div class="job"><div class="jh"><h3>${esc(org)}</h3><span class="loc">${esc(loc)}</span></div>
        <div class="jr"><em>${esc(role)}</em><span class="dt">${esc(dates)}</span></div>
        <ul>${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>`;
  const proj = (name, what, stack, bullets) => `
      <div class="job"><div class="jh"><h3>${esc(name)}</h3></div>
        <div class="jr"><em>${esc(what)}</em></div><p class="stack">${esc(stack)}</p>
        <ul>${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>`;
  const skill = (k, v) => `<div class="sk"><span>${esc(k)}</span><p>${esc(v)}</p></div>`;
  const body = `    <article class="prose resume">
      <div class="eyebrow">+ Resume</div>
      <h1>Aryan Singh</h1>
      <p class="lede">AI Solutions Engineer. Delhi, India.</p>
      <div class="cta-row">
        <a class="btn" href="/assets/Aryan-Singh-Resume.pdf" download>Download PDF &#8595;</a>
        <a class="btn ghost" href="/assets/Aryan-Singh-Resume.pdf" target="_blank" rel="noopener">Open in new tab &#8599;</a>
        <a class="btn ghost" href="mailto:${EMAIL}">Email me</a>
      </div>
      <p class="meta"><a href="https://github.com/Aryansingh0783" target="_blank" rel="noopener">GitHub</a> &nbsp;/&nbsp; <a href="https://linkedin.com/in/aryansingh0783" target="_blank" rel="noopener">LinkedIn</a> &nbsp;/&nbsp; <a href="mailto:${EMAIL}">${EMAIL}</a></p>

      <h2>Summary</h2>
      <p>AI Solutions Engineer and B.Tech Computer Science graduate who builds AI-driven products end to end. Currently shipping AI-powered landing pages, ad creatives, AI video and agentic coding tools for clients at a performance marketing agency. Proficient in Python, SQL and TypeScript, with hands-on experience building ML pipelines, big-data workflows in PySpark, and well-tested applications across web, desktop and cloud.</p>

      <h2>Experience</h2>${job("The Growth Engine", "Delhi, India", "AI Solutions Engineer", "Sep 2026 – Present", [
        "Deliver AI-driven work for a performance marketing agency's clients, reporting directly to the founder: UI/UX design, landing pages, ad creatives and AI-generated video.",
        "Built conversion landing pages and wrote Meta ad video scripts for a healthcare clinic's campaign, following a research, analysis, copy and page workflow, and produced AI avatar videos with HeyGen.",
        "Producing a multi-asset series of brand-affinity social posts and short-form videos for a women's campus-safety app.",
        "Build agentic coding tools and a reusable client production kit that speed up how the team researches, writes and ships client deliverables."])}${job("Reduced Debts Financial Services", "Noida, Uttar Pradesh, India", "Junior Analyst (Internship)", "Aug 2025 – May 2026", [
        "Collected, cleaned and validated datasets to extract insights and ensure accuracy for ongoing projects.",
        "Built dashboards and reports with Excel and SQL, and supported market research and client outreach."])}

      <h2>Education</h2>
      <div class="job"><div class="jh"><h3>Bennett University</h3><span class="loc">Greater Noida, India</span></div>
        <div class="jr"><em>B.Tech in Computer Science and Engineering</em><span class="dt">2022 – 2026</span></div></div>
      <div class="job"><div class="jh"><h3>National Victor Public School</h3><span class="loc">New Delhi, India</span></div>
        <div class="jr"><em>CBSE Board</em><span class="dt">Passed: 2021</span></div></div>

      <h2>Projects</h2>${proj("Superposition", "Departure-time prediction app", "TypeScript, React, Cloudflare Workers, D1, Python, LightGBM", [
        "Built a full-stack app that predicts the latest safe departure time to arrive on schedule, modeling travel time in log-space with an Ornstein–Uhlenbeck variance curve and conformal calibration for honest, horizon-aware quantile estimates.",
        "Architected a monorepo: a dependency-free TypeScript math package, a Cloudflare Worker API with a 10-minute cron pipeline (routing, weather, Web Push), a Vite/React PWA, and a weekly Python LightGBM training job.",
        "Verified the engine with 200+ automated tests (SDE-simulation checks of the variance model, conformal-coverage tests) and deployed the entire stack on a $0 free-tier footprint."])}${proj("Fake News Detection", "Scalable ML pipeline", "Python, PySpark MLlib, TF-IDF, Scikit-learn, NLTK", [
        "Built a scalable big-data ML pipeline in PySpark to classify news articles as real or fake on a Kaggle dataset of article text and metadata.",
        "Engineered TF-IDF features with word/character counts and sentiment scores, then trained and compared Logistic Regression, Naive Bayes and Random Forest classifiers with hyperparameter tuning.",
        "Evaluated models on accuracy, precision, recall, F1-score and ROC-AUC, surfacing fake-news patterns via word clouds, confusion matrices and ROC curves."])}${proj("SteamOS NVIDIA USB Installer", "Windows desktop utility", "Electron, TypeScript, Node.js, WSL2, Vite", [
        "Built a Windows desktop app that converts an official SteamOS recovery image into a bootable USB installer with the NVIDIA open driver baked in, orchestrating an isolated WSL2 Arch build without modifying the source image.",
        "Implemented safe raw USB flashing with layered safeguards (system-disk exclusion, removable-only, capacity and identity re-verification, multi-factor confirmation) plus post-write verification.",
        "Covered all decision logic with 113 unit tests under strict TypeScript, shipping a signed-workflow NSIS installer built and released via GitHub Actions."])}${proj("Accela", "Modular Discord bot suite", "Python, discord.py, SQLite, Docker, Steam API", [
        "Developed a multi-module gaming-community bot (moderation, onboarding, analytics, recommendations, trading) plus a one-command server builder that idempotently provisions 24 roles, 40 channels and AutoMod rules.",
        "Built a heuristic moderation engine and a content-based game recommender with feedback learning; persisted state in SQLite (aiosqlite), integrated the Steam API, and containerized with Docker Compose."])}${proj("Devbhoomi Realtors", "Live real estate website", "HTML, CSS, JavaScript, Responsive Design, SEO", [
        "Designed and shipped a live, bilingual (English/Hindi) multi-page website for a Uttarakhand land-and-cottage business, with property listings, area guides and a turnkey-cottage section.",
        "Built an interactive land-unit converter (nali/gaj/sq ft/sq m), a land-valuation lead-capture flow and WhatsApp deep-link inquiries, with SEO metadata, Open Graph tags and a responsive layout."])}${proj("Pricely", "Offline pricing and profit analytics PWA", "JavaScript, HTML, Service Workers", [
        "Built a single-file offline PWA with a rate-based pricing engine (contribution per hour, effective material cost, integer-paise money) and dashboards for revenue and per-job profitability.",
        "Backed the pricing engine with 144 automated property and regression tests covering pricing invariants and every UI control."])}
      <p class="more"><a href="/all-projects/">See all ${PROJECTS.length} projects with live links &#8594;</a></p>

      <h2>Technical skills</h2>
      <div class="skills">${skill("Languages", "Python, SQL, TypeScript, JavaScript")}${skill("Data & ML", "PySpark (MLlib), Scikit-learn, LightGBM, Pandas, NumPy, NLTK, TF-IDF, Matplotlib, Seaborn")}${skill("Concepts", "Regression, Classification, Clustering, Feature Engineering, Time Series Forecasting, NLP, Quantile & Conformal Prediction")}${skill("Web & App", "React, Vite, Node.js, Electron, discord.py, aiohttp, Progressive Web Apps (Service Workers)")}${skill("Cloud & Tools", "Cloudflare Workers/D1, Netlify, Docker, WSL2, Git & GitHub, GitHub Actions, Jupyter, VS Code, Excel")}${skill("AI tools", "Claude, OpenAI, Codex, Gemini, HeyGen, llama.cpp")}${skill("Databases", "SQLite, D1, MySQL, Supabase")}${skill("OS", "Windows, Linux, macOS")}</div>

      <h2>Certifications</h2>
      <ul class="certs">${P.credentials.map((c) => `<li>${esc(c.replace(": ", " – "))}</li>`).join("")}<li>C++ Programming Certification (self-paced)</li></ul>
      <p class="stamp">Resume last updated: November 2026</p>
    </article>`;
  write(page.file, shell(page, body, COMMON_SCRIPTS));
  log.push("built resume page");
}

// ---- legal pages ----
const UPDATED = "November 2026";
const MAIL = `<a href="mailto:${EMAIL}">${EMAIL}</a>`;
const LEGAL = {
  "/privacy-policy/": { h1: "Privacy Policy", body: `
      <p class="lede">Short version: this site does not track you.</p>
      <h2>Who I am</h2>
      <p>This is the personal portfolio of Aryan Singh, based in Delhi, India. You can reach me at ${MAIL}.</p>
      <h2>What this site collects</h2>
      <p>Nothing. There are no cookies, no analytics, no advertising, no tracking pixels and no user accounts. I do not run any scripts that profile visitors.</p>
      <h2>The contact form</h2>
      <p>The form on the contact page does not send your message to a server. When you press Submit, it opens your own email app with a draft addressed to me. Nothing leaves your device until you send that email yourself. Your email address and message then reach me the same way any email does.</p>
      <h2>Hosting and logs</h2>
      <p>The site is served by a hosting provider. Like every web host, it may keep standard technical logs (IP address, browser, time of request) for security and reliability. I do not use these logs to identify visitors.</p>
      <h2>Links to other sites</h2>
      <p>Pages link to GitHub, LinkedIn, Instagram, WhatsApp and to live project sites. Those services have their own privacy policies and I do not control them.</p>
      <h2>Your rights</h2>
      <p>If you have emailed me and want your messages deleted, write to me and I will delete them.</p>
      <h2>Changes</h2>
      <p>If this changes, I will update this page and the date below.</p>
      <p class="stamp">Last updated: ${UPDATED}</p>` },
  "/terms-of-service/": { h1: "Terms of Service", body: `
      <p class="lede">Plain terms for using this portfolio site.</p>
      <h2>Using the site</h2>
      <p>You may browse and link to this site for personal or professional reference. Do not misuse it, attempt to break it, or scrape it in a way that harms its availability.</p>
      <h2>Content and ownership</h2>
      <p>The text, design and images on this site are by Aryan Singh unless noted otherwise. Do not republish them as your own. The projects listed here are open source or source-available under the licence shown in each GitHub repository, and that licence, not this page, governs how you may use their code.</p>
      <h2>Third-party material</h2>
      <p>Some visuals are built with open frameworks and components. Names and logos of other companies and products mentioned (for example NVIDIA, Claude Code, SteamOS) belong to their owners and are used only to describe compatibility.</p>
      <h2>No warranty</h2>
      <p>The site and the demos linked from it are provided as is, without warranty of any kind. Projects may change, break or go offline.</p>
      <h2>Liability</h2>
      <p>To the fullest extent allowed by law, I am not liable for any loss arising from your use of this site or of the linked projects.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India.</p>
      <h2>Contact</h2>
      <p>Questions: ${MAIL}.</p>
      <p class="stamp">Last updated: ${UPDATED}</p>` },
  "/disclaimer/": { h1: "Disclaimer", body: `
      <p class="lede">What you read here is my own work and opinion.</p>
      <h2>Information</h2>
      <p>Everything on this site is provided in good faith and for general information about my skills and projects. I try to keep it accurate, but I make no guarantee that it is complete or current.</p>
      <h2>Projects and demos</h2>
      <p>Projects are shown for demonstration. Test counts, figures and descriptions reflect the state of each repository when written and may have changed since. Check the linked GitHub repository for the current status.</p>
      <h2>External links</h2>
      <p>I am not responsible for the content or availability of external sites that I link to.</p>
      <h2>Views</h2>
      <p>Views expressed are my own and not those of any employer, university or other organisation.</p>
      <h2>Availability</h2>
      <p>Statements such as "open to work" describe my situation when the page was last updated.</p>
      <p class="stamp">Last updated: ${UPDATED}</p>` },
};
for (const page of PAGES.filter((p) => p.kind === "legal")) {
  const L = LEGAL[page.path];
  const body = `    <article class="prose">
      <div class="eyebrow">+ Legal</div>
      <h1>${esc(L.h1)}</h1>${L.body}
    </article>`;
  write(page.file, shell(page, body, COMMON_SCRIPTS));
  log.push("built " + page.file);
}

// ---- 404.html: same app shell, so Framer's router renders its not-found page; never indexed ----
{
  let h = read("index.html");
  h = h.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, "");
  h = h.replace(/<title>[\s\S]*?<\/title>/, "");
  const nf = '<!--seo:start-->\n<title>Page not found | Aryan Singh</title>\n<meta name="robots" content="noindex,follow">\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<!--seo:end-->';
  h = h.replace("</head>", nf + "\n</head>");
  // hydrate as the template's 404 route (webPageId of the footer "404" link) instead of the home route
  h = h.replace(/(routeId&quot;:&quot;)[A-Za-z0-9_]+/, "$1jl8v0JWPZ");
  write("404.html", h);
  log.push("built 404.html (noindex)");
}

// ---- retired template pages: noindex + redirect, never in the sitemap ----
function retire(dir) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : (e.name === "index.html" ? [path.join(d, e.name)] : []));
  if (!fs.existsSync(path.join(SITE, dir))) return;
  for (const f of walk(path.join(SITE, dir))) {
    const rel = path.relative(SITE, f).replace(/\\/g, "/");
    const target = rel.startsWith("lab") ? "/" : "/all-projects/";
    const stub = `<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><title>Moved | Aryan Singh</title><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url=${target}"><script>location.replace("${target}")</script></head><body><p>This page moved. <a href="${target}">Continue</a>.</p></body></html>\n`;
    fs.writeFileSync(f, stub);
    log.push("retired " + rel + " -> " + target);
  }
}
// Remove the template's old pages instead of leaving stubs: files shadow host redirects, and the hosts'
// 301 rules (vercel.json, netlify.toml) send /projects/* and /lab/* to the right pages.
for (const d of ["lab", "projects"]) {
  if (fs.existsSync(path.join(SITE, d))) { fs.rmSync(path.join(SITE, d), { recursive: true, force: true }); log.push("removed retired " + d + "/"); }
}

// ---- webmanifest, robots, sitemap ----
write("site.webmanifest", JSON.stringify({ name: "Aryan Singh | Portfolio", short_name: "Aryan Singh", start_url: "/", display: "standalone", background_color: "#050609", theme_color: "#050609",
  icons: [{ src: "/favicon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }] }, null, 2) + "\n");
write("robots.txt", "User-agent: *\nAllow: /\nDisallow: /404.html\n" + (SITE_URL ? "\nSitemap: " + SITE_URL + "/sitemap.xml\n" : "\n# The Sitemap line is added when siteUrl is set in site.config.json\n"));
if (SITE_URL) {
  const today = new Date().toISOString().slice(0, 10);
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    PAGES.map((p) => `  <url><loc>${SITE_URL}${p.path}</loc><lastmod>${today}</lastmod><changefreq>${p.kind === "legal" ? "yearly" : "monthly"}</changefreq><priority>${p.priority}</priority></url>`).join("\n") + `\n</urlset>\n`);
  log.push("sitemap.xml written for " + SITE_URL);
} else {
  if (fs.existsSync(path.join(SITE, "sitemap.xml"))) fs.unlinkSync(path.join(SITE, "sitemap.xml"));
  log.push("NO siteUrl set: canonical, og:url and sitemap.xml skipped");
}
console.log(log.join("\n"));

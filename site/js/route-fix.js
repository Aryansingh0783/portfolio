/*
 * Site routing tweaks for the Framer app pages (home, about, contact):
 *  - Projects and the legal pages are real static files, so links to them force a full page load
 *  - the nav "Contact" button (which has no href in the template) goes to /contact/
 *  - template leftovers (Lab blog, Pricing anchor, Framer badge link, /404 link) are hidden
 */
(function () {
  var norm = function (p) { return p.replace(/\/+$/, '') || '/'; };
  // The template writes internal links as "./page" meaning "from the site root", on every page.
  var pathOf = function (a) {
    var h = a.getAttribute('href') || '';
    try {
      if (/^\.\//.test(h) || /^[^\/#:?.]+(\/|$)/.test(h)) h = '/' + h.replace(/^\.\//, '');
      return norm(new URL(h, location.origin).pathname);
    } catch (e) { return ''; }
  };

  var STATIC = { '/projects': '/all-projects/', '/all-projects': '/all-projects/', '/lab': '/resume/', '/resume': '/resume/', '/privacy-policy': '/privacy-policy/', '/terms-of-service': '/terms-of-service/', '/disclaimer': '/disclaimer/' };

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    // nav "Contact" has no href in the template
    if (a.getAttribute('name') === 'Contact' && !a.getAttribute('href')) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (norm(location.pathname) !== '/contact') location.href = '/contact/';
      return;
    }
    if (!a.getAttribute('href') || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    var dest = STATIC[pathOf(a)];
    if (dest) { e.preventDefault(); e.stopImmediatePropagation(); location.href = dest; }
  }, true);

  var style = document.createElement('style');
  style.textContent =
    'a[href$="#pricing"],*:has(> a[href$="#pricing"]):not(body):not(html):not(nav):not(footer){display:none!important}' +
    'a[href$="/404"],a[href^="https://www.framer.com"]{display:none!important}' +
    // phone footer: the AS monogram was cut off at the right edge
    '@media (max-width:809.98px){.framer-1qryuji{font-size:28px!important;white-space:nowrap;transform:translateX(-18px)}}' +
    // phone: text boxes the template sized for its own copy cut off the last line / descenders of ours.
    // Let them show their text (only on phones; desktop is untouched).
    '@media (max-width:809.98px){' +
      'svg:has(foreignObject){overflow:visible}' +
      // decorative full-screen noise canvases (multiply-blended) are costly on phones and add nothing visible
      'canvas{display:none!important}' +
      '.framer-text{word-break:normal!important;overflow-wrap:break-word!important;hyphens:none!important}' +
      '.framer-b20o2j,.framer-vu1qqr,.framer-11p5kdg,.framer-r9rknz,.framer-oyfhc1,.framer-1f6qdu0,.framer-1d050d4,.framer-11wzu55,.framer-fcwmu0,.framer-ax6hht,.framer-1sxw03i,.framer-w0x6hk{overflow:visible!important}' +
      '.framer-b20o2j{height:auto!important;min-height:0!important}' +
      '.framer-1cnmkew,.framer-1cnmkew *,.framer-q925fc{overflow:visible!important}' +
      '.framer-9pammg-container,.framer-SmcJv.framer-zd7D0{height:auto!important;min-height:0!important;overflow:visible!important}' +
    '}' +
    // very narrow phones: the About headline would run off the screen
    '@media (max-width:360px){h1.framer-styles-preset-14ih7zs,h1.framer-styles-preset-14ih7zs *,.framer-styles-preset-7dwwu,.framer-styles-preset-7dwwu *{font-size:9.4vw!important}}';
  document.head.appendChild(style);

  // The Framer runtime rewrites <title> and the canonical link on load and on every in-app navigation.
  // Re-assert this site's own metadata for the current route (tools/seo.js generates page-meta.js).
  function setMeta(sel, attr, val) {
    var el = document.querySelector(sel);
    if (el && el.getAttribute(attr) !== val) el.setAttribute(attr, val);
  }
  function applyMeta() {
    var all = window.__PAGE_META;
    if (!all) return;
    var m = all[norm(location.pathname)];
    if (!m) return;
    if (document.title !== m.title) document.title = m.title;
    setMeta('meta[name="description"]', 'content', m.description);
    setMeta('meta[property="og:title"]', 'content', m.title);
    setMeta('meta[property="og:description"]', 'content', m.description);
    setMeta('meta[name="twitter:title"]', 'content', m.title);
    setMeta('meta[name="twitter:description"]', 'content', m.description);
    var links = document.querySelectorAll('link[rel="canonical"]');
    if (!m.url) { links.forEach(function (l) { l.remove(); }); setMeta('meta[property="og:url"]', 'content', ''); return; }
    if (!links.length) { var l = document.createElement('link'); l.rel = 'canonical'; document.head.appendChild(l); links = [l]; }
    links.forEach(function (l, i) { if (i) l.remove(); else if (l.href !== m.url) l.href = m.url; });
    setMeta('meta[property="og:url"]', 'content', m.url);
  }
  applyMeta();
  setInterval(applyMeta, 250);

  // client-side navigation can land on retired template routes: send those to real pages
  setInterval(function () {
    var p = norm(location.pathname);
    if (p === '/projects' || p.indexOf('/projects/') === 0) location.replace('/all-projects/');
    else if (p === '/lab' || p.indexOf('/lab/') === 0) location.replace('/resume/');
  }, 250);
})();

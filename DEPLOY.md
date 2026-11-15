# Deploying and indexing the portfolio

The site is plain static files in `site/`. Any static host works.

## 1. Pick the address, then stamp it (one command)

Search engines need to know the real address. Until `siteUrl` is set, the pages ship without
`canonical`, `og:url` and `sitemap.xml` (a wrong canonical hurts more than none).

```
set SITE_URL=https://your-real-domain.com
node tools/seo.js
```

Or put it in `site.config.json` as `"siteUrl"` and run `node tools/seo.js`. The script is safe to
re-run any time. It writes, for every page: title, description, robots, canonical, Open Graph,
Twitter card, JSON-LD (Person, WebSite, ProfilePage, ContactPage, project ItemList), favicons,
`sitemap.xml`, `robots.txt`, `404.html`, and the static Projects and legal pages.

## 2. Host

* **Vercel**: import the repo, no build command. `vercel.json` sets the output folder, trailing
  slashes and 301 redirects for the retired template URLs (`/projects/*`, `/lab/*`).
* **Netlify**: `netlify.toml` does the same (publish folder `site`).
* **GitHub Pages**: publish the contents of `site/`. It serves `404.html` automatically. Redirects
  are handled by the small `noindex` stub pages the script writes.

`404.html` is served for unknown URLs by all three hosts and shows the styled 404 page.

## 3. Tell Google

1. Open Google Search Console, add the site, verify it (DNS record or HTML file).
2. Submit `https://your-real-domain.com/sitemap.xml`.
3. In URL Inspection, request indexing for `/`, `/about/`, `/contact/`, `/all-projects/`.
4. Do the same in Bing Webmaster Tools (it can import from Search Console).

## 4. Check

* `https://your-real-domain.com/robots.txt` lists the sitemap.
* Rich results test: https://search.google.com/test/rich-results on the home page (Person) and
  `/all-projects/` (project list).
* Share the home URL in LinkedIn or WhatsApp to see the preview card (`og-image.jpg`).

## Local preview

Double-click `start.bat` (or `PORT=4191 node server.mjs`). It only runs while that window is open.

## What counts as indexable

`/`, `/about/`, `/contact/`, `/all-projects/`, and the three legal pages. `404.html` and the
retired template routes are `noindex`.

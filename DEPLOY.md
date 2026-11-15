# Deploying to Vercel from GitHub

Everything is already configured. You do three things: push to GitHub, import in Vercel, submit the sitemap.

## 1. Push to GitHub

The repo is already committed locally on branch `main`. Create an empty repository on GitHub
(no README, no .gitignore, no licence), then:

```
git remote add origin https://github.com/Aryansingh0783/<repo-name>.git
git push -u origin main
```

## 2. Import in Vercel

1. vercel.com → Add New → Project → pick the repo.
2. Leave every setting as is. `vercel.json` already sets: no framework, build command
   `node tools/seo.js`, output folder `site`, trailing slashes, 301 redirects for the retired
   template URLs.
3. Deploy.

The build stamps the SEO tags using Vercel's own address (`VERCEL_PROJECT_PRODUCTION_URL`):
your custom domain if you attach one under Settings → Domains and make it the production
domain, otherwise `<project>.vercel.app`. Canonical links, `og:url`, `sitemap.xml` and the
`Sitemap:` line in `robots.txt` all follow it automatically. If you add a custom domain later,
redeploy once so they pick it up.

## 3. Tell Google (after the first deploy)

1. Search Console → add the site → verify (Vercel DNS makes the DNS record easy).
2. Submit `https://<your-address>/sitemap.xml`.
3. URL Inspection → request indexing for `/`, `/about/`, `/contact/`, `/all-projects/`.
4. Same in Bing Webmaster Tools (it can import from Search Console).

## Checks

* `https://<your-address>/robots.txt` lists the sitemap; `/sitemap.xml` lists 7 URLs.
* Rich results test on the home page (Person) and `/all-projects/` (project list).
* Paste the home URL into LinkedIn or WhatsApp to see the preview card.
* A made-up URL such as `/nope` shows the styled 404 page.

## Local preview

Double-click `start.bat` (or `PORT=4191 node server.mjs`); it only runs while that window is open.

## Changing things

* Copy that appears in search results: edit `PAGES` in `tools/seo.js`.
* Projects: edit `site/all-projects/projects-data.js` (the page and the list schema rebuild on deploy).
* `node tools/check-js.js` syntax-checks the edited Framer chunks before you push.
* A fixed address instead of Vercel's: set `siteUrl` in `site.config.json`.

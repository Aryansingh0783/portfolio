import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, 'site');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};
const port = process.env.PORT || 4173;

// Framer CMS collections request byte ranges through a `range=from-to,from-to`
// query parameter (inclusive bounds). The response body is the concatenation
// of those slices.
function parseRanges(value) {
  const ranges = [];
  for (const part of value.split(',')) {
    const m = /^(\d+)-(\d+)$/.exec(part.trim());
    if (!m) continue;
    const from = Number(m[1]);
    const to = Number(m[2]);
    if (to >= from) ranges.push({ from, to });
  }
  ranges.sort((a, b) => a.from - b.from);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.from <= last.to + 1) last.to = Math.max(last.to, r.to);
    else merged.push({ ...r });
  }
  return merged;
}

http.createServer((req, res) => {
  let parsed;
  try {
    parsed = new URL(req.url || '/', 'http://localhost');
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }
  let urlPath;
  try {
    urlPath = decodeURIComponent(parsed.pathname);
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  let file = path.join(root, urlPath);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) && path.extname(urlPath) === '') file = path.join(root, urlPath, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found: ' + urlPath);
  }

  const rangeParam = parsed.searchParams.get('range');
  if (rangeParam) {
    const ranges = parseRanges(rangeParam);
    if (ranges.length > 0) {
      const buffer = fs.readFileSync(file);
      const chunks = [];
      for (const r of ranges) {
        if (r.from >= buffer.length) continue;
        chunks.push(buffer.subarray(r.from, Math.min(r.to + 1, buffer.length)));
      }
      const body = Buffer.concat(chunks);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': body.length,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      });
      return req.method === 'HEAD' ? res.end() : res.end(body);
    }
  }

  const ext = path.extname(file).toLowerCase();
  res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Spector clone running at http://localhost:${port}`));

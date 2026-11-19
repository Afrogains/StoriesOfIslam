#!/usr/bin/env node
/**
 * Static web preview with same-origin The Names audio proxy.
 * Muslim Central blocks browser Referer from third-party hosts; this proxy
 * streams allowlisted MP3s so in-app web playback works during demos.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../mobile/dist');
const PORT = Number(process.env.PORT || 8081);
const ALLOWED_HOSTS = new Set(['podcasts.muslimcentral.com', 'rss.muslimcentral.com']);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

async function proxyAudio(req, res, targetUrl) {
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return send(res, 400, 'invalid url');
  }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return send(res, 403, 'host not allowed');
  }
  if (!parsed.pathname.toLowerCase().endsWith('.mp3')) {
    return send(res, 400, 'only mp3 allowed');
  }

  const headers = {
    'User-Agent': 'StoriesOfIslam-Preview/1.0',
    Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
  };
  if (req.headers.range) headers.Range = req.headers.range;

  const upstream = await fetch(parsed.toString(), { headers, redirect: 'follow' });
  if (!(upstream.ok || upstream.status === 206)) {
    return send(res, 502, 'upstream unavailable');
  }

  const outHeaders = {
    'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg',
    'Cache-Control': 'public,max-age=3600',
    'Accept-Ranges': upstream.headers.get('accept-ranges') || 'bytes',
  };
  const contentLength = upstream.headers.get('content-length');
  if (contentLength) outHeaders['Content-Length'] = contentLength;
  const contentRange = upstream.headers.get('content-range');
  if (contentRange) outHeaders['Content-Range'] = contentRange;

  res.writeHead(upstream.status, outHeaders);
  if (!upstream.body) {
    res.end();
    return;
  }
  Readable.fromWeb(upstream.body).pipe(res);
}

function safeStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const cleaned = decoded === '/' ? '/index.html' : decoded;
  const full = path.normalize(path.join(ROOT, cleaned));
  if (!full.startsWith(ROOT)) return null;
  return full;
}

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host || `127.0.0.1:${PORT}`;
    const url = new URL(req.url || '/', `http://${host}`);

    if (url.pathname === '/v1/media/the-names-audio') {
      const target = url.searchParams.get('url');
      if (!target) return send(res, 400, 'missing url');
      return void (await proxyAudio(req, res, target));
    }

    let filePath = safeStaticPath(url.pathname);
    if (!filePath) return send(res, 403, 'forbidden');

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      // SPA fallback
      filePath = path.join(ROOT, 'index.html');
    }
    if (!fs.existsSync(filePath)) return send(res, 404, 'not found');

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) send(res, 500, 'server error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Preview server listening on http://127.0.0.1:${PORT}`);
});

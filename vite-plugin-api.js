// =============================================================================
// GOATED — Local /api parity plugin
// -----------------------------------------------------------------------------
// In production Vercel turns every file in /api into a serverless function.
// The plain Vite dev server knows nothing about that, so `fetch('/api/leads')`
// on localhost used to fall through to the SPA rewrite, return index.html, blow
// up on res.json(), and silently drop the app into its synthetic-data fallback.
// That's why local "worked" while showing fake data.
//
// This plugin loads the same handler modules Vercel would run and gives them a
// Vercel-shaped (req, res). One codebase, one behaviour, both environments.
//
// Files prefixed with `_` are shared libs, not routes — Vercel excludes them
// and so do we.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const API_DIR = path.resolve(process.cwd(), 'api');

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(undefined);
      const ct = req.headers['content-type'] || '';
      if (ct.includes('application/json')) {
        try { return resolve(JSON.parse(raw)); } catch { return resolve(raw); }
      }
      resolve(raw);
    });
    req.on('error', () => resolve(undefined));
  });
}

// Minimal Vercel-compatible response shim over the raw Node ServerResponse.
function decorate(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
    return res;
  };
  res.send = (body) => {
    if (typeof body === 'object' && body !== null) return res.json(body);
    res.end(String(body ?? ''));
    return res;
  };
  return res;
}

export default function apiPlugin() {
  return {
    name: 'goated-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        const url = new URL(req.url, 'http://localhost');
        const route = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');

        // Block traversal and shared-lib access the same way Vercel does.
        if (!route || route.includes('..') || route.split('/').some(seg => seg.startsWith('_'))) {
          return next();
        }

        const file = path.join(API_DIR, `${route}.js`);
        if (!fs.existsSync(file)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: `No API route /api/${route}` }));
        }

        try {
          // Cache-bust so edits to handlers are picked up without a restart.
          const mod = await server.ssrLoadModule(pathToFileURL(file).pathname);
          const handler = mod.default;
          if (typeof handler !== 'function') {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: `${route}.js has no default export` }));
          }

          req.query = Object.fromEntries(url.searchParams.entries());
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            req.body = await readBody(req);
          }

          await handler(req, decorate(res));
        } catch (err) {
          server.config.logger.error(`[goated-api] /api/${route} crashed: ${err.stack || err.message}`);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Local API handler threw', message: err.message }));
          }
        }
      });
    },
  };
}

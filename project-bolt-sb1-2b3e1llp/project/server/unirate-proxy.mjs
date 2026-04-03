#!/usr/bin/env node
/**
 * 独立 UniRate 代理（生产 / Docker / 与静态站分域部署时使用）
 * 用法: UNIRATE_API_KEY=xxx node server/unirate-proxy.mjs
 * 默认端口 8787，可用环境变量 UNIRATE_PROXY_PORT 修改
 */
import http from 'http';
import { resolveUnirateUpstreamUrl } from '../unirate-proxy-core.mjs';

const PORT = parseInt(process.env.UNIRATE_PROXY_PORT || '8787', 10);
const API_KEY = process.env.UNIRATE_API_KEY;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!API_KEY) {
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'UNIRATE_API_KEY is not set on the server' }));
    return;
  }

  const u = new URL(req.url || '/', 'http://127.0.0.1');
  const upstream = resolveUnirateUpstreamUrl(u.pathname, u.search, API_KEY);

  if (!upstream) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  try {
    const r = await fetch(upstream, {
      headers: { Accept: 'application/json' },
    });
    const ct = r.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.statusCode = r.status;
    const buf = Buffer.from(await r.arrayBuffer());
    res.end(buf);
  } catch (e) {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Upstream fetch failed' }));
  }
});

server.listen(PORT, () => {
  console.log(`UniRate proxy listening on http://127.0.0.1:${PORT}`);
});

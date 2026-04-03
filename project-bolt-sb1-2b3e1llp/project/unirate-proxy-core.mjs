/**
 * UniRate 代理：白名单路径 + 拼接上游 URL（密钥仅在后端使用）
 * 供 Vite 中间件与独立 Node 服务共用。
 */

const UPSTREAM = 'https://api.unirateapi.com/api';

/** @type {ReadonlySet<string>} */
const ALLOWED_PATHS = new Set(['/rates', '/historical/timeseries', '/currencies']);

/**
 * @param {string} pathname 如 /api/unirate/rates
 * @param {string} search 含 ? 的 query 或空串
 * @param {string} apiKey
 * @returns {string | null}
 */
export function resolveUnirateUpstreamUrl(pathname, search, apiKey) {
  const prefix = '/api/unirate';
  if (!pathname.startsWith(prefix)) return null;

  let pathOnly = pathname.slice(prefix.length);
  if (pathOnly === '' || pathOnly === '/') return null;
  if (!ALLOWED_PATHS.has(pathOnly)) return null;

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.set('api_key', apiKey);
  return `${UPSTREAM}${pathOnly}?${params.toString()}`;
}

/**
 * Security helpers for Elevate Your Smoke.
 * Protects the API and admin surface. Client HTML/JS is always downloadable
 * by the browser — do not put secrets in the frontend.
 */
const crypto = require('crypto');

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
    .slice(0, 128);
}

/** Constant-time string compare (length-safe). */
function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  const ha = crypto.createHash('sha256').update(left).digest();
  const hb = crypto.createHash('sha256').update(right).digest();
  return crypto.timingSafeEqual(ha, hb) && left.length === right.length;
}

function makeLimiter({ windowMs, max }) {
  const hits = new Map();
  return function allowed(key) {
    const now = Date.now();
    let row = hits.get(key);
    if (!row || now > row.resetAt) {
      row = { count: 0, resetAt: now + windowMs };
      hits.set(key, row);
    }
    row.count += 1;
    // Opportunistic cleanup
    if (hits.size > 5000) {
      for (const [k, v] of hits) {
        if (now > v.resetAt) hits.delete(k);
      }
    }
    return row.count <= max;
  };
}

const pinAllowed = makeLimiter({ windowMs: 15 * 60 * 1000, max: 12 });
const loginAllowed = makeLimiter({ windowMs: 15 * 60 * 1000, max: 8 });
const apiWriteAllowed = makeLimiter({ windowMs: 60 * 1000, max: 120 });
const visitIncrementAllowed = makeLimiter({ windowMs: 30 * 60 * 1000, max: 1 });

/** Member card PIN: 4–8 digits, no spaces. */
function normalizePin(pin) {
  const s = String(pin || '').replace(/\s+/g, '');
  if (!/^\d{4,8}$/.test(s)) return null;
  return s;
}

function hashPin(pin) {
  const n = normalizePin(pin);
  if (!n) return null;
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(n, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return 'scrypt$' + salt.toString('base64') + '$' + hash.toString('base64');
}

function verifyPin(pin, stored) {
  const n = normalizePin(pin);
  const raw = String(stored || '');
  const parts = raw.split('$');
  if (!n || parts.length !== 3 || parts[0] !== 'scrypt') {
    try {
      crypto.scryptSync('0000', Buffer.alloc(16), 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    } catch (e) {}
    return false;
  }
  let salt;
  let expected;
  try {
    salt = Buffer.from(parts[1], 'base64');
    expected = Buffer.from(parts[2], 'base64');
  } catch (e) {
    return false;
  }
  if (!salt.length || !expected.length) return false;
  const hash = crypto.scryptSync(n, salt, expected.length, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  if (hash.length !== expected.length) return false;
  return crypto.timingSafeEqual(hash, expected);
}

function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  // Dev-only: Impeccable live picker (localhost:8400). Never ships when NODE_ENV=production.
  const liveDev =
    process.env.NODE_ENV !== 'production' ? ' http://localhost:8400 http://127.0.0.1:8400' : '';
  // Moderate CSP — inline scripts/styles are required by the HTML app architecture
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      `script-src 'self' 'unsafe-inline'${liveDev}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      `connect-src 'self'${liveDev}`,
      "worker-src 'self'",
      "manifest-src 'self'",
    ].join('; ')
  );
  // Railway terminates TLS — tell browsers to prefer HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

function corsOriginAllowed(origin) {
  if (!origin) return true; // same-origin / curl / mobile webviews
  try {
    const u = new URL(origin);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const host = u.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host.endsWith('.railway.app')) return true;
    const allow = String(process.env.PUBLIC_ORIGIN || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (allow.includes(origin)) return true;
  } catch (e) {
    return false;
  }
  return false;
}

function apiWriteGuard(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  if (!String(req.path || '').startsWith('/api')) return next();
  const ip = clientIp(req);
  if (!apiWriteAllowed(ip)) {
    return res.status(429).json({ ok: false, error: 'too many requests' });
  }
  next();
}

module.exports = {
  clientIp,
  safeEqual,
  pinAllowed,
  loginAllowed,
  visitIncrementAllowed,
  securityHeaders,
  corsOriginAllowed,
  apiWriteGuard,
  normalizePin,
  hashPin,
  verifyPin,
};

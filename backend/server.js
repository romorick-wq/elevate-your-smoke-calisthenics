const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');
const sms = require('./sms');
const { scoringExplain } = require('./score');

const PORT = process.env.PORT || 3000;
const ORGANIZER_CODE = process.env.ORGANIZER_CODE || '1234';
const APP_DIR = path.join(__dirname, '..', 'app');

const app = express();
app.use(cors());
app.use(express.json({ type: ['application/json', 'text/plain'], limit: '64kb' }));
app.use(express.text({ type: 'text/plain' }));

/** Simple in-memory pin attempt limiter (per IP). */
const pinAttempts = new Map();
function pinAllowed(ip) {
  const now = Date.now();
  let row = pinAttempts.get(ip);
  if (!row || now > row.resetAt) {
    row = { count: 0, resetAt: now + 15 * 60 * 1000 };
    pinAttempts.set(ip, row);
  }
  row.count += 1;
  return row.count <= 30;
}
function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function requireOrganizer(req, res, pin) {
  const ip = clientIp(req);
  if (!pinAllowed(ip)) {
    res.status(429).json({ ok: false, error: 'too many attempts' });
    return false;
  }
  if (String(pin || '') !== String(ORGANIZER_CODE)) {
    res.json({ ok: false, error: 'bad pin' });
    return false;
  }
  return true;
}

async function handleSync(req, res) {
  try {
    const body = parseBody(req);
    if (!body) return res.status(400).json({ ok: false, error: 'bad request' });
    const result = await db.upsertParticipant(body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
}

async function handleRoster(req, res) {
  try {
    const pin = String(req.query.pin || '');
    if (!requireOrganizer(req, res, pin)) return;
    const challenge = String(req.query.challenge || '');
    const result = await db.getRoster(challenge);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
}

async function handleDelete(req, res) {
  try {
    const body = parseBody(req) || {};
    const pin = String(body.pin || req.query.pin || '');
    if (!requireOrganizer(req, res, pin)) return;
    const challenge = String(body.challenge || req.query.challenge || '');
    const name = String(body.name || req.query.name || '');
    const result = await db.deleteParticipant(challenge, name);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
}

async function handleUpdate(req, res) {
  try {
    const body = parseBody(req) || {};
    const pin = String(body.pin || '');
    if (!requireOrganizer(req, res, pin)) return;
    const challenge = String(body.challenge || '');
    const name = String(body.name || '');
    const result = await db.updateParticipantDetails(challenge, name, {
      phone: body.phone,
      startingWeight: body.startingWeight,
      currentWeight: body.currentWeight,
      dateStarted: body.dateStarted,
      league: body.league,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
}

async function handleLeaderboard(req, res) {
  try {
    const challenge = String(req.query.challenge || '');
    const result = await db.getLeaderboard(challenge);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
}

async function handleSms(req, res) {
  try {
    const body = parseBody(req) || {};
    const pin = String(body.pin || '');
    if (!requireOrganizer(req, res, pin)) return;
    if (!sms.smsConfigured()) {
      return res.json({
        ok: false,
        error: 'sms not configured',
        hint: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER on Railway.',
      });
    }
    const challenge = String(body.challenge || '');
    const message = String(body.message || '');
    let people = Array.isArray(body.people) ? body.people : null;

    if ((!people || !people.length) && body.name) {
      const roster = await db.getRoster(challenge);
      const want = String(body.name).trim().toLowerCase();
      const match = (roster.people || []).find(
        (p) => String(p.name || '').trim().toLowerCase() === want
      );
      if (!match) return res.json({ ok: false, error: 'not found' });
      people = [{ name: match.name, phone: match.phone }];
    }

    if (!people || !people.length) {
      const roster = await db.getRoster(challenge);
      let list = roster.people || [];
      const league = String(body.league || '').toLowerCase();
      if (league === 'brothers' || league === 'ladies') {
        list = list.filter((p) => (p.league || '') === league);
      }
      people = list.map((p) => ({ name: p.name, phone: p.phone }));
    }

    const result = await sms.sendSms(people, message);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
}

async function handleMeDelete(req, res) {
  try {
    const body = parseBody(req) || {};
    const result = await db.deleteOwnParticipant(body.challenge, body.id, body.name);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
}

async function handleMeUpdate(req, res) {
  try {
    const body = parseBody(req) || {};
    const result = await db.updateOwnParticipant(body.challenge, body.id, {
      name: body.name,
      league: body.league,
      startingWeight: body.startingWeight,
      currentWeight: body.currentWeight,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
}

let dbReady = false;
let dbError = null;

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    alive: true,
    dbReady,
    dbError: dbError ? String(dbError.message || dbError) : null,
    sms: sms.smsConfigured(),
    scoring: scoringExplain(),
  });
});

app.get('/api/scoring', (_req, res) => {
  res.json({ ok: true, scoring: scoringExplain() });
});

app.post('/api', handleSync);
app.post('/api/sync', handleSync);

app.get('/api', async (req, res) => {
  if (req.query.action === 'roster') return handleRoster(req, res);
  if (req.query.action === 'leaderboard') return handleLeaderboard(req, res);
  if (req.query.action === 'scoring') return res.json({ ok: true, scoring: scoringExplain() });
  res.json({ ok: true, alive: true, dbReady });
});

app.get('/api/roster', handleRoster);
app.delete('/api/roster', handleDelete);
app.post('/api/roster/delete', handleDelete);
app.post('/api/roster/update', handleUpdate);
app.post('/api/roster/sms', handleSms);
app.get('/api/leaderboard', handleLeaderboard);
app.post('/api/me/delete', handleMeDelete);
app.post('/api/me/update', handleMeUpdate);

app.get(['/admin', '/admin/'], (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.sendFile(path.join(APP_DIR, 'admin.html'));
});

app.get(['/leaderboard', '/board', '/manual', '/card', '/privacy', '/progress'], (req, res) => {
  const map = {
    '/leaderboard': 'board',
    '/board': 'board',
    '/manual': 'manual',
    '/card': 'card',
    '/privacy': 'privacy',
    '/progress': 'progress',
  };
  res.redirect(302, '/#' + (map[req.path] || 'board'));
});

app.get('/manifest.webmanifest', (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(APP_DIR, 'manifest.webmanifest'));
});

app.use(
  express.static(APP_DIR, {
    extensions: ['html'],
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
      if (filePath.includes(`${path.sep}admin`)) {
        res.setHeader('Cache-Control', 'no-cache, no-store');
      }
    },
  })
);

app.get('*', (req, res) => {
  // Do not SPA-fallback media/API misses — return a real 404
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/exercises/') ||
    /\.(jpg|jpeg|png|mp4|webm|vtt|webp|svg|ico)$/i.test(req.path)
  ) {
    return res.status(404).type('text/plain').send('Not found');
  }
  res.sendFile(path.join(APP_DIR, 'index.html'));
});

async function start() {
  // Bind port before DB init so Railway health + static landing are not blocked on Postgres.
  await new Promise((resolve) => {
    app.listen(PORT, () => {
      console.log(`Elevate Your Smoke listening on :${PORT}`);
      resolve();
    });
  });
  try {
    await db.init();
    dbReady = true;
    console.log('Postgres ready');
  } catch (err) {
    dbError = err;
    console.error('Postgres init failed (static app still up):', err);
  }
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

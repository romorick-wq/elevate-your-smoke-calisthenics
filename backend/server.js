const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');

const PORT = process.env.PORT || 3000;
const ORGANIZER_CODE = process.env.ORGANIZER_CODE || '1234';
const APP_DIR = path.join(__dirname, '..', 'app');

const app = express();
app.use(cors());
app.use(express.json({ type: ['application/json', 'text/plain'] }));
app.use(express.text({ type: 'text/plain' }));

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

async function handleSync(req, res) {
  try {
    const body = parseBody(req);
    if (!body) return res.status(400).json({ ok: false, error: 'bad request' });
    const result = await db.upsertParticipant(body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
}

async function handleRoster(req, res) {
  try {
    const pin = String(req.query.pin || '');
    if (pin !== String(ORGANIZER_CODE)) {
      return res.json({ ok: false, error: 'bad pin' });
    }
    const challenge = String(req.query.challenge || '');
    const result = await db.getRoster(challenge);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
}

async function handleDelete(req, res) {
  try {
    const body = parseBody(req) || {};
    const pin = String(body.pin || req.query.pin || '');
    if (pin !== String(ORGANIZER_CODE)) {
      return res.json({ ok: false, error: 'bad pin' });
    }
    const challenge = String(body.challenge || req.query.challenge || '');
    const name = String(body.name || req.query.name || '');
    const result = await db.deleteParticipant(challenge, name);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
}

async function handleUpdate(req, res) {
  try {
    const body = parseBody(req) || {};
    const pin = String(body.pin || '');
    if (pin !== String(ORGANIZER_CODE)) {
      return res.json({ ok: false, error: 'bad pin' });
    }
    const challenge = String(body.challenge || '');
    const name = String(body.name || '');
    const result = await db.updateParticipantDetails(challenge, name, {
      phone: body.phone,
      startingWeight: body.startingWeight,
      currentWeight: body.currentWeight,
      dateStarted: body.dateStarted,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
}

async function handleLeaderboard(req, res) {
  try {
    const challenge = String(req.query.challenge || '');
    const result = await db.getLeaderboard(challenge);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, alive: true });
});

app.post('/api', handleSync);
app.post('/api/sync', handleSync);

app.get('/api', async (req, res) => {
  if (req.query.action === 'roster') return handleRoster(req, res);
  if (req.query.action === 'leaderboard') return handleLeaderboard(req, res);
  res.json({ ok: true, alive: true });
});

app.get('/api/roster', handleRoster);
app.delete('/api/roster', handleDelete);
app.post('/api/roster/delete', handleDelete);
app.post('/api/roster/update', handleUpdate);
app.get('/api/leaderboard', handleLeaderboard);

app.get(['/admin', '/admin/'], (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(APP_DIR, 'admin.html'));
});

app.use(express.static(APP_DIR, {
  extensions: ['html'],
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

app.get('*', (_req, res) => {
  res.sendFile(path.join(APP_DIR, 'index.html'));
});

async function start() {
  await db.init();
  app.listen(PORT, () => {
    console.log(`Elevate Your Smoke listening on :${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

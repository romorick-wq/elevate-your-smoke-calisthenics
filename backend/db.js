const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set. Add a Postgres database on Railway.');
    }
    pool = new Pool({
      connectionString: url,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function init() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT NOT NULL,
      challenge TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      joined TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sessions INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      streak INTEGER NOT NULL DEFAULT 0,
      day INTEGER NOT NULL DEFAULT 0,
      per_week INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (id, challenge)
    );
  `);
  await db.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''`);
  await db.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS starting_weight REAL`);
  await db.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS date_started DATE`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id BIGSERIAL PRIMARY KEY,
      when_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      participant_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      challenge TEXT NOT NULL,
      day INTEGER NOT NULL DEFAULT 0,
      sessions_after INTEGER NOT NULL DEFAULT 0
    );
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS sessions_challenge_idx ON sessions (challenge, when_at DESC);
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS participants_challenge_idx ON participants (challenge, last_active DESC);
  `);
}

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

async function upsertParticipant(body) {
  const db = getPool();
  const id = String(body.id || '').slice(0, 64);
  const challenge = String(body.challenge || '').slice(0, 64);
  const name = String(body.name || '').slice(0, 64);
  if (!id || !challenge) {
    return { ok: false, error: 'bad request' };
  }

  await db.query(
    `INSERT INTO participants
       (id, challenge, name, joined, last_active, sessions, total, streak, day, per_week)
     VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, $6, $7, $8)
     ON CONFLICT (id, challenge) DO UPDATE SET
       name = EXCLUDED.name,
       last_active = NOW(),
       sessions = EXCLUDED.sessions,
       total = EXCLUDED.total,
       streak = EXCLUDED.streak,
       day = EXCLUDED.day,
       per_week = EXCLUDED.per_week`,
    [id, challenge, name, n(body.sessions), n(body.total), n(body.streak), n(body.day), n(body.perWeek)]
  );

  if (body.action === 'log') {
    await db.query(
      `INSERT INTO sessions (participant_id, name, challenge, day, sessions_after)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, name, challenge, n(body.day), n(body.sessions)]
    );
  }

  return { ok: true };
}

function dateOnly(v) {
  if (!v) return '';
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  const s = String(v);
  const m = s.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

async function getRoster(challenge) {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT id, name, challenge, joined, last_active, sessions, total, streak, day, per_week,
            phone, starting_weight, date_started
     FROM participants
     WHERE ($1 = '' OR challenge = $1)
     ORDER BY last_active DESC`,
    [challenge || '']
  );

  // One line per person even if they reinstalled (merge by name within challenge)
  const byKey = new Map();
  for (const r of rows) {
    const started = dateOnly(r.date_started) || dateOnly(r.joined) || new Date(r.joined).toISOString().slice(0, 10);
    const person = {
      name: r.name,
      joined: new Date(r.joined).getTime(),
      lastActive: new Date(r.last_active).getTime(),
      sessions: n(r.sessions),
      total: n(r.total),
      streak: n(r.streak),
      day: n(r.day),
      perWeek: n(r.per_week),
      phone: r.phone || '',
      startingWeight: r.starting_weight == null ? '' : Number(r.starting_weight),
      dateStarted: started,
    };
    const key = `${r.challenge}::${String(person.name).toLowerCase().trim()}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, person);
    } else {
      const keepProgress = person.sessions >= prev.sessions;
      const base = keepProgress ? person : prev;
      const other = keepProgress ? prev : person;
      byKey.set(key, {
        ...base,
        name: prev.joined <= person.joined ? prev.name : person.name,
        joined: Math.min(prev.joined, person.joined),
        phone: base.phone || other.phone || '',
        startingWeight: base.startingWeight !== '' ? base.startingWeight : other.startingWeight,
        dateStarted: base.dateStarted || other.dateStarted,
      });
    }
  }

  return { ok: true, people: Array.from(byKey.values()) };
}

async function updateParticipantDetails(challenge, name, details) {
  const db = getPool();
  const c = String(challenge || '').slice(0, 64);
  const personName = String(name || '').trim().slice(0, 64);
  if (!c || !personName) return { ok: false, error: 'bad request' };

  const phone = String(details.phone || '').trim().slice(0, 32);
  let startingWeight = null;
  if (details.startingWeight !== '' && details.startingWeight != null) {
    const w = Number(details.startingWeight);
    if (!Number.isFinite(w) || w <= 0 || w > 1000) {
      return { ok: false, error: 'bad weight' };
    }
    startingWeight = w;
  }
  let dateStarted = null;
  if (details.dateStarted) {
    const raw = String(details.dateStarted).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return { ok: false, error: 'bad date' };
    }
    dateStarted = raw;
  }

  const { rowCount } = await db.query(
    `UPDATE participants
     SET phone = $3,
         starting_weight = $4,
         date_started = COALESCE($5::date, date_started, joined::date)
     WHERE challenge = $1 AND lower(trim(name)) = lower(trim($2))`,
    [c, personName, phone, startingWeight, dateStarted]
  );
  if (!rowCount) return { ok: false, error: 'not found' };
  return { ok: true, updated: rowCount };
}

async function deleteParticipant(challenge, name) {
  const db = getPool();
  const c = String(challenge || '').slice(0, 64);
  const personName = String(name || '').trim().slice(0, 64);
  if (!c || !personName) return { ok: false, error: 'bad request' };

  const { rowCount } = await db.query(
    `DELETE FROM participants
     WHERE challenge = $1 AND lower(trim(name)) = lower(trim($2))`,
    [c, personName]
  );
  await db.query(
    `DELETE FROM sessions
     WHERE challenge = $1 AND lower(trim(name)) = lower(trim($2))`,
    [c, personName]
  );
  return { ok: true, deleted: rowCount };
}

module.exports = {
  init,
  upsertParticipant,
  getRoster,
  updateParticipantDetails,
  deleteParticipant,
};

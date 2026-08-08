const { Pool } = require('pg');

const SESSION_MINUTES = 9;
const PTS_PER_SESSION = 10;
const PTS_PER_5PCT_WEIGHT = 100;
const PTS_PER_5PCT_HOURS = 50;

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
  await db.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS current_weight REAL`);
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

function parseWeight(v) {
  if (v === '' || v == null) return null;
  const w = Number(v);
  if (!Number.isFinite(w) || w <= 0 || w > 1000) return undefined; // invalid
  return w;
}

/** Hours, weight change %, and points from progress fields. */
function scorePerson(p) {
  const sessions = n(p.sessions);
  const total = n(p.total);
  const hours = Math.round((sessions * SESSION_MINUTES) / 60 * 100) / 100;
  const startW = p.startingWeight === '' || p.startingWeight == null ? null : Number(p.startingWeight);
  const curW = p.currentWeight === '' || p.currentWeight == null ? null : Number(p.currentWeight);
  let weightLostPct = null;
  let weightDelta = null;
  if (startW != null && curW != null && startW > 0) {
    weightDelta = Math.round((startW - curW) * 10) / 10;
    weightLostPct = Math.round(((startW - curW) / startW) * 1000) / 10;
  }
  const hoursPct = total > 0 ? (sessions / total) * 100 : 0;
  const weightMilestones = weightLostPct != null && weightLostPct > 0 ? Math.floor(weightLostPct / 5) : 0;
  const hoursMilestones = Math.floor(hoursPct / 5);
  const points =
    sessions * PTS_PER_SESSION +
    weightMilestones * PTS_PER_5PCT_WEIGHT +
    hoursMilestones * PTS_PER_5PCT_HOURS;
  return {
    hours,
    weightDelta,
    weightLostPct,
    weightMilestones,
    hoursMilestones,
    points,
  };
}

function enrich(person) {
  return { ...person, ...scorePerson(person) };
}

async function upsertParticipant(body) {
  const db = getPool();
  const id = String(body.id || '').slice(0, 64);
  const challenge = String(body.challenge || '').slice(0, 64);
  const name = String(body.name || '').slice(0, 64);
  if (!id || !challenge) {
    return { ok: false, error: 'bad request' };
  }

  const startIn = parseWeight(body.startingWeight);
  const curIn = parseWeight(body.currentWeight);
  if (startIn === undefined || curIn === undefined) {
    return { ok: false, error: 'bad weight' };
  }

  await db.query(
    `INSERT INTO participants
       (id, challenge, name, joined, last_active, sessions, total, streak, day, per_week,
        starting_weight, current_weight)
     VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id, challenge) DO UPDATE SET
       name = EXCLUDED.name,
       last_active = NOW(),
       sessions = EXCLUDED.sessions,
       total = EXCLUDED.total,
       streak = EXCLUDED.streak,
       day = EXCLUDED.day,
       per_week = EXCLUDED.per_week,
       starting_weight = COALESCE(EXCLUDED.starting_weight, participants.starting_weight),
       current_weight = COALESCE(EXCLUDED.current_weight, participants.current_weight)`,
    [
      id,
      challenge,
      name,
      n(body.sessions),
      n(body.total),
      n(body.streak),
      n(body.day),
      n(body.perWeek),
      startIn,
      curIn,
    ]
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

function rowToPerson(r) {
  const started = dateOnly(r.date_started) || dateOnly(r.joined) || new Date(r.joined).toISOString().slice(0, 10);
  return {
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
    currentWeight: r.current_weight == null ? '' : Number(r.current_weight),
    dateStarted: started,
  };
}

async function loadPeople(challenge) {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT id, name, challenge, joined, last_active, sessions, total, streak, day, per_week,
            phone, starting_weight, current_weight, date_started
     FROM participants
     WHERE ($1 = '' OR challenge = $1)
     ORDER BY last_active DESC`,
    [challenge || '']
  );

  // One line per person even if they reinstalled (merge by name within challenge)
  const byKey = new Map();
  for (const r of rows) {
    const person = rowToPerson(r);
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
        currentWeight: base.currentWeight !== '' ? base.currentWeight : other.currentWeight,
        dateStarted: base.dateStarted || other.dateStarted,
      });
    }
  }

  return Array.from(byKey.values()).map(enrich);
}

async function getRoster(challenge) {
  return { ok: true, people: await loadPeople(challenge) };
}

/** Public board — no PII beyond callsign + progress. */
async function getLeaderboard(challenge) {
  const people = (await loadPeople(challenge)).map((p) => ({
    name: p.name,
    sessions: p.sessions,
    total: p.total,
    streak: p.streak,
    hours: p.hours,
    weightLostPct: p.weightLostPct,
    weightDelta: p.weightDelta,
    points: p.points,
    weightMilestones: p.weightMilestones,
    hoursMilestones: p.hoursMilestones,
    lastActive: p.lastActive,
  }));
  return { ok: true, people, meta: { sessionMinutes: SESSION_MINUTES } };
}

async function updateParticipantDetails(challenge, name, details) {
  const db = getPool();
  const c = String(challenge || '').slice(0, 64);
  const personName = String(name || '').trim().slice(0, 64);
  if (!c || !personName) return { ok: false, error: 'bad request' };

  const phone = String(details.phone || '').trim().slice(0, 32);
  const startingWeight = parseWeight(details.startingWeight);
  const currentWeight = parseWeight(details.currentWeight);
  if (startingWeight === undefined || currentWeight === undefined) {
    return { ok: false, error: 'bad weight' };
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
         current_weight = $5,
         date_started = COALESCE($6::date, date_started, joined::date)
     WHERE challenge = $1 AND lower(trim(name)) = lower(trim($2))`,
    [c, personName, phone, startingWeight, currentWeight, dateStarted]
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
  getLeaderboard,
  updateParticipantDetails,
  deleteParticipant,
  SESSION_MINUTES,
};

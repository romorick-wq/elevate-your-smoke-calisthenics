const { Pool } = require('pg');
const {
  SESSION_MINUTES,
  scorePerson,
  scoringExplain,
  n,
} = require('./score');
const {
  isFullCompletion,
  MIN_COMPLETE_MS,
  resolveScheduleTotal,
} = require('./workout');

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
  await db.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS league TEXT NOT NULL DEFAULT ''`);
  await db.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT ''`);
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
    CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_per_day_idx
      ON sessions (participant_id, challenge, day)
      WHERE day > 0;
  `);
  await db.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS idempotency_key TEXT`);
  await db.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS elapsed_ms INTEGER`);
  await db.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS credit TEXT NOT NULL DEFAULT 'full'`);
  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS sessions_idempotency_idx
      ON sessions (idempotency_key)
      WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS participants_challenge_idx ON participants (challenge, last_active DESC);
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS site_stats (
      key TEXT PRIMARY KEY,
      value BIGINT NOT NULL DEFAULT 0
    );
  `);
  await db.query(
    `INSERT INTO site_stats (key, value) VALUES ('visits', 0) ON CONFLICT (key) DO NOTHING`
  );
}

function parseWeight(v) {
  if (v === '' || v == null) return null;
  const w = Number(v);
  if (!Number.isFinite(w) || w <= 0 || w > 1000) return undefined; // invalid
  return w;
}

function enrich(person) {
  const total = resolveScheduleTotal(person.total, person.perWeek);
  const scored = scorePerson({ ...person, total });
  return {
    ...person,
    total: total || person.total || 0,
    scheduleUnavailable: !(total > 0),
    ...scored,
  };
}

function parseLeague(v) {
  const s = String(v || '')
    .trim()
    .toLowerCase();
  if (s === 'brothers' || s === 'brother' || s === 'men' || s === 'male' || s === 'm') return 'brothers';
  if (s === 'ladies' || s === 'lady' || s === 'women' || s === 'female' || s === 'f') return 'ladies';
  return '';
}

/** Public board nickname — 2–32 chars, or empty to fall back to callsign. */
function sanitizeDisplayName(v) {
  const s = String(v == null ? '' : v)
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 32);
  if (!s) return '';
  if (s.length < 2) return undefined; // invalid when non-empty but too short
  return s;
}

function publicBoardName(p) {
  const d = String((p && p.displayName) || '').trim();
  if (d) return d;
  return String((p && p.name) || '').trim() || '—';
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
  const leagueIn = parseLeague(body.league);
  let displayIn = null;
  let setDisplay = false;
  if (body.displayName !== undefined) {
    setDisplay = true;
    displayIn = sanitizeDisplayName(body.displayName);
    if (displayIn === undefined) return { ok: false, error: 'bad display name' };
  }
  const isLog = body.action === 'log';
  const day = n(body.day);
  const elapsedMs = n(body.elapsedMs);
  const idem = String(body.idempotencyKey || `${id}::${challenge}::${day}`).slice(0, 160);
  const sessionsIn = n(body.sessions);
  const totalIn = resolveScheduleTotal(n(body.total), n(body.perWeek)) || n(body.total);

  if (isLog && !isFullCompletion(elapsedMs)) {
    return {
      ok: false,
      error: 'incomplete',
      minCompleteMs: MIN_COMPLETE_MS,
      elapsedMs,
      message:
        'Workout was too short for full session credit. Resume and finish the 9-minute card.',
    };
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    if (isLog) {
      if (idem) {
        const { rows: byKey } = await client.query(
          `SELECT id FROM sessions WHERE idempotency_key = $1 LIMIT 1 FOR SHARE`,
          [idem]
        );
        if (byKey.length) {
          await client.query('COMMIT');
          return { ok: true, logged: false, duplicate: true, credit: 'full' };
        }
      }
      if (day > 0) {
        const { rows } = await client.query(
          `SELECT id FROM sessions WHERE participant_id = $1 AND challenge = $2 AND day = $3 LIMIT 1 FOR SHARE`,
          [id, challenge, day]
        );
        if (rows.length) {
          await client.query('COMMIT');
          return { ok: true, logged: false, duplicate: true, credit: 'full' };
        }
      }
    }

    await client.query(
      `INSERT INTO participants
         (id, challenge, name, joined, last_active, sessions, total, streak, day, per_week,
          starting_weight, current_weight, league, display_name)
       VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, $6, $7, $8, $9, $10, $11, $13)
       ON CONFLICT (id, challenge) DO UPDATE SET
         name = EXCLUDED.name,
         last_active = NOW(),
         sessions = CASE
           WHEN $12 THEN participants.sessions + 1
           ELSE participants.sessions
         END,
         total = CASE
           WHEN EXCLUDED.total > 0 THEN GREATEST(participants.total, EXCLUDED.total)
           ELSE participants.total
         END,
         streak = CASE
           WHEN $12 THEN GREATEST(participants.streak, EXCLUDED.streak)
           ELSE participants.streak
         END,
         day = EXCLUDED.day,
         per_week = CASE
           WHEN EXCLUDED.per_week > 0 THEN EXCLUDED.per_week
           ELSE participants.per_week
         END,
         league = CASE
           WHEN EXCLUDED.league <> '' THEN EXCLUDED.league
           ELSE participants.league
         END,
         display_name = CASE
           WHEN $14 THEN EXCLUDED.display_name
           ELSE participants.display_name
         END`,
      [
        id,
        challenge,
        name,
        sessionsIn,
        totalIn,
        n(body.streak),
        day,
        n(body.perWeek),
        startIn,
        curIn,
        leagueIn,
        isLog,
        setDisplay ? displayIn || '' : '',
        setDisplay,
      ]
    );

    let logged = false;
    if (isLog) {
      try {
        await client.query(
          `INSERT INTO sessions (participant_id, name, challenge, day, sessions_after, idempotency_key, elapsed_ms, credit)
           VALUES (
             $1, $2, $3, $4,
             (SELECT sessions FROM participants WHERE id = $1 AND challenge = $3),
             $5, $6, 'full'
           )`,
          [id, name, challenge, day, idem, elapsedMs]
        );
        logged = true;
      } catch (err) {
        await client.query('ROLLBACK');
        return { ok: true, logged: false, duplicate: true, credit: 'full' };
      }
    }

    await client.query('COMMIT');
    return { ok: true, logged, duplicate: false, credit: isLog ? 'full' : undefined };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
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
    displayName: String(r.display_name || '').trim(),
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
    league: parseLeague(r.league) || '',
  };
}

async function loadPeople(challenge) {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT id, name, challenge, joined, last_active, sessions, total, streak, day, per_week,
            phone, starting_weight, current_weight, date_started, league, display_name
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
        displayName: base.displayName || other.displayName || '',
        startingWeight: base.startingWeight !== '' ? base.startingWeight : other.startingWeight,
        currentWeight: base.currentWeight !== '' ? base.currentWeight : other.currentWeight,
        dateStarted: base.dateStarted || other.dateStarted,
        league: base.league || other.league || '',
      });
    }
  }

  return Array.from(byKey.values()).map(enrich);
}

async function getRoster(challenge) {
  return { ok: true, people: await loadPeople(challenge) };
}

/** Public board — display nickname + progress. Real callsign stays CRM-only. */
async function getLeaderboard(challenge) {
  const people = (await loadPeople(challenge)).map((p) => ({
    name: publicBoardName(p),
    league: p.league || '',
    sessions: p.sessions,
    total: p.total,
    perWeek: p.perWeek,
    streak: p.streak,
    hours: p.hours,
    weightLostPct: p.weightLostPct,
    points: p.points,
    weightMilestones: p.weightMilestones,
    hoursMilestones: p.hoursMilestones,
    lastActive: p.lastActive,
  }));
  return {
    ok: true,
    people,
    meta: { sessionMinutes: SESSION_MINUTES, scoring: scoringExplain() },
  };
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
  const league = parseLeague(details.league);
  const displayName = sanitizeDisplayName(details.displayName);
  if (displayName === undefined) return { ok: false, error: 'bad display name' };

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
         date_started = COALESCE($6::date, date_started, joined::date),
         league = $7,
         display_name = $8
     WHERE challenge = $1 AND lower(trim(name)) = lower(trim($2))`,
    [c, personName, phone, startingWeight, currentWeight, dateStarted, league, displayName]
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

/**
 * Organizer reset — wipe workout progress but keep the person on the roster.
 * Clears sessions / streak / day / date_started and deletes logged session rows.
 * Keeps callsign, league, phone, weights, schedule total, and device id.
 */
async function resetParticipantProgress(challenge, name) {
  const db = getPool();
  const c = String(challenge || '').slice(0, 64);
  const personName = String(name || '').trim().slice(0, 64);
  if (!c || !personName) return { ok: false, error: 'bad request' };

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT id FROM participants
       WHERE challenge = $1 AND lower(trim(name)) = lower(trim($2))
       FOR UPDATE`,
      [c, personName]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'not found' };
    }
    const ids = rows.map((r) => r.id);
    const { rowCount } = await client.query(
      `UPDATE participants
       SET sessions = 0,
           streak = 0,
           day = 0,
           date_started = NULL,
           starting_weight = NULL,
           current_weight = NULL,
           last_active = NOW()
       WHERE challenge = $1 AND lower(trim(name)) = lower(trim($2))`,
      [c, personName]
    );
    await client.query(
      `DELETE FROM sessions
       WHERE challenge = $1
         AND (
           lower(trim(name)) = lower(trim($2))
           OR participant_id = ANY($3::text[])
         )`,
      [c, personName, ids]
    );
    await client.query('COMMIT');
    return { ok: true, reset: rowCount, devices: ids.length };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

/** Participant self-delete — requires matching id + callsign. */
async function deleteOwnParticipant(challenge, id, name) {
  const db = getPool();
  const c = String(challenge || '').slice(0, 64);
  const pid = String(id || '').slice(0, 64);
  const personName = String(name || '').trim().slice(0, 64);
  if (!c || !pid || !personName) return { ok: false, error: 'bad request' };
  const { rowCount } = await db.query(
    `DELETE FROM participants
     WHERE challenge = $1 AND id = $2 AND lower(trim(name)) = lower(trim($3))`,
    [c, pid, personName]
  );
  if (!rowCount) return { ok: false, error: 'not found' };
  await db.query(
    `DELETE FROM sessions WHERE challenge = $1 AND participant_id = $2`,
    [c, pid]
  );
  return { ok: true, deleted: rowCount };
}

async function updateOwnParticipant(challenge, id, details) {
  const db = getPool();
  const c = String(challenge || '').slice(0, 64);
  const pid = String(id || '').slice(0, 64);
  if (!c || !pid) return { ok: false, error: 'bad request' };
  const newName = details.name != null ? String(details.name).trim().slice(0, 32) : null;
  if (newName != null && newName.length < 2) return { ok: false, error: 'bad name' };
  const league = details.league != null ? parseLeague(details.league) : '';
  const startIn = details.startingWeight !== undefined ? parseWeight(details.startingWeight) : undefined;
  const curIn = details.currentWeight !== undefined ? parseWeight(details.currentWeight) : undefined;
  if (startIn === undefined || curIn === undefined) {
    if (details.startingWeight !== undefined || details.currentWeight !== undefined) {
      return { ok: false, error: 'bad weight' };
    }
  }
  let displayName = null;
  let setDisplay = false;
  if (details.displayName !== undefined) {
    setDisplay = true;
    displayName = sanitizeDisplayName(details.displayName);
    if (displayName === undefined) return { ok: false, error: 'bad display name' };
  }
  const { rows } = await db.query(
    `SELECT id FROM participants WHERE challenge = $1 AND id = $2 LIMIT 1`,
    [c, pid]
  );
  if (!rows.length) return { ok: false, error: 'not found' };
  await db.query(
    `UPDATE participants SET
       name = COALESCE($3, name),
       league = CASE WHEN $4 <> '' THEN $4 ELSE league END,
       starting_weight = COALESCE($5, starting_weight),
       current_weight = COALESCE($6, current_weight),
       display_name = CASE WHEN $7 THEN $8 ELSE display_name END,
       last_active = NOW()
     WHERE challenge = $1 AND id = $2`,
    [c, pid, newName, league, startIn ?? null, curIn ?? null, setDisplay, displayName || '']
  );
  return { ok: true };
}

async function getVisitCount() {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT value FROM site_stats WHERE key = 'visits' LIMIT 1`
  );
  return rows.length ? Number(rows[0].value) || 0 : 0;
}

/** Atomically increment and return the new visit total. */
async function recordVisit() {
  const db = getPool();
  const { rows } = await db.query(
    `INSERT INTO site_stats (key, value) VALUES ('visits', 1)
     ON CONFLICT (key) DO UPDATE SET value = site_stats.value + 1
     RETURNING value`
  );
  return Number(rows[0].value) || 0;
}

module.exports = {
  init,
  upsertParticipant,
  getRoster,
  getLeaderboard,
  updateParticipantDetails,
  deleteParticipant,
  resetParticipantProgress,
  deleteOwnParticipant,
  updateOwnParticipant,
  getVisitCount,
  recordVisit,
  SESSION_MINUTES,
  scoringExplain,
  scorePerson,
};

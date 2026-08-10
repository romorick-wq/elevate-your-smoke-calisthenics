/**
 * Workout completion rules — shared by API + tests.
 * Full credit requires verified active elapsed time (paused time excluded).
 */
const SESSION_SEC = 540;
const SESSION_MS = SESSION_SEC * 1000;
/** Minimum active elapsed ms for a full session credit (~85% of 9:00). */
const MIN_COMPLETE_MS = Math.floor(SESSION_MS * 0.85);

function sessionTotalsForLevel(level) {
  const lvl = Number(level) || 1;
  const work = lvl <= 1 ? 20 : 25;
  const rest = 30 - work;
  const rounds = 3;
  const warm = 60;
  const cool = 60;
  const fin = 60;
  const circuit = rounds * 4 * (work + rest);
  return { work, rest, rounds, warm, cool, fin, circuit, total: warm + circuit + fin + cool };
}

function assertNineMinutes(level) {
  const t = sessionTotalsForLevel(level);
  if (t.total !== SESSION_SEC) {
    throw new Error(`Level ${level} totals ${t.total}s, expected ${SESSION_SEC}`);
  }
  return t;
}

function isFullCompletion(elapsedMs) {
  const n = Number(elapsedMs);
  return Number.isFinite(n) && n >= MIN_COMPLETE_MS;
}

function idempotencyKey(participantId, challenge, day) {
  return `${String(participantId)}::${String(challenge)}::${Number(day) || 0}`;
}

/** Advance resume state across gaps while running (not paused). */
function advanceResumeState(state, steps, nowMs) {
  if (!state || !steps || !steps.length) return null;
  let si = Math.max(0, Number(state.si) || 0);
  let remainingMs = Math.max(0, Number(state.remainingMs) || 0);
  let elapsedActiveMs = Math.max(0, Number(state.elapsedActiveMs) || 0);
  const paused = !!state.paused;
  const savedAt = Number(state.savedAt) || nowMs;

  if (si >= steps.length) {
    return { ...state, si, remainingMs: 0, elapsedActiveMs, done: true, paused: false };
  }
  if (!remainingMs) remainingMs = Math.round((steps[si].sec || 0) * 1000);

  if (!paused) {
    let gap = Math.max(0, nowMs - savedAt);
    while (gap > 0 && si < steps.length) {
      if (gap < remainingMs) {
        remainingMs -= gap;
        elapsedActiveMs += gap;
        gap = 0;
      } else {
        gap -= remainingMs;
        elapsedActiveMs += remainingMs;
        si += 1;
        remainingMs = si < steps.length ? Math.round((steps[si].sec || 0) * 1000) : 0;
      }
    }
  }

  return {
    ...state,
    si,
    remainingMs: Math.round(remainingMs),
    elapsedActiveMs: Math.round(elapsedActiveMs),
    paused,
    savedAt: nowMs,
    done: si >= steps.length,
  };
}

/** Mirror client WEEK map — scheduled train days in a 30-day card. */
const WEEK = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] };
const DAYS = 30;

function expectedSessionsFromPerWeek(perWeek) {
  const days = WEEK[Number(perWeek)];
  if (!days) return 0;
  let n = 0;
  for (let i = 0; i < DAYS; i++) if (days.includes(i % 7)) n++;
  return n;
}

function resolveScheduleTotal(total, perWeek) {
  const t = Number(total) || 0;
  if (t > 0) return t;
  return expectedSessionsFromPerWeek(perWeek) || 0;
}

/** Kickoff — workouts credit only after this instant (America/Chicago). Override with KICKOFF_ISO. */
const KICKOFF_ISO = process.env.KICKOFF_ISO || '2026-08-15T09:00:00-05:00';
const KICKOFF_AT = new Date(KICKOFF_ISO).getTime();

function challengeIsLive(nowMs) {
  const t = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  return Number.isFinite(KICKOFF_AT) && t >= KICKOFF_AT;
}

module.exports = {
  SESSION_SEC,
  SESSION_MS,
  MIN_COMPLETE_MS,
  KICKOFF_ISO,
  KICKOFF_AT,
  challengeIsLive,
  sessionTotalsForLevel,
  assertNineMinutes,
  isFullCompletion,
  idempotencyKey,
  advanceResumeState,
  WEEK,
  DAYS,
  expectedSessionsFromPerWeek,
  resolveScheduleTotal,
};

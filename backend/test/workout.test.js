const assert = require('assert');
const {
  SESSION_SEC,
  MIN_COMPLETE_MS,
  sessionTotalsForLevel,
  assertNineMinutes,
  isFullCompletion,
  advanceResumeState,
  expectedSessionsFromPerWeek,
  resolveScheduleTotal,
  idempotencyKey,
} = require('../workout');

// Exact 540s for every level
for (const lvl of [1, 2, 3, 4]) {
  const t = assertNineMinutes(lvl);
  assert.strictEqual(t.total, SESSION_SEC, `level ${lvl}`);
  if (lvl <= 1) {
    assert.strictEqual(t.work, 20);
    assert.strictEqual(t.rest, 10);
  } else {
    assert.strictEqual(t.work, 25);
    assert.strictEqual(t.rest, 5);
  }
}

assert.strictEqual(MIN_COMPLETE_MS, Math.floor(540000 * 0.85));
assert.strictEqual(isFullCompletion(MIN_COMPLETE_MS), true);
assert.strictEqual(isFullCompletion(MIN_COMPLETE_MS - 1), false);
assert.strictEqual(isFullCompletion(1000), false);
assert.strictEqual(isFullCompletion(NaN), false);

// Schedule targets
assert.strictEqual(expectedSessionsFromPerWeek(3), 13);
assert.strictEqual(expectedSessionsFromPerWeek(4), 18);
assert.strictEqual(expectedSessionsFromPerWeek(5), 22);
assert.strictEqual(expectedSessionsFromPerWeek(6), 26);
assert.strictEqual(expectedSessionsFromPerWeek(0), 0);
assert.strictEqual(resolveScheduleTotal(0, 3), 13);
assert.strictEqual(resolveScheduleTotal(18, 3), 18);

const { challengeIsLive, KICKOFF_AT, KICKOFF_ISO } = require('../workout');
assert.ok(KICKOFF_ISO.includes('2026-08-15'));
assert.strictEqual(challengeIsLive(KICKOFF_AT - 1), false);
assert.strictEqual(challengeIsLive(KICKOFF_AT), true);
assert.strictEqual(challengeIsLive(KICKOFF_AT + 1000), true);
assert.strictEqual(resolveScheduleTotal(0, 0), 0);

assert.strictEqual(idempotencyKey('p1', 'c', 5), 'p1::c::5');

// Resume: 15s remaining on 30s interval stays ~15s after refresh (paused)
{
  const steps = [{ sec: 30 }, { sec: 20 }];
  const savedAt = 1_000_000;
  const paused = advanceResumeState(
    { si: 0, remainingMs: 15000, elapsedActiveMs: 15000, paused: true, savedAt },
    steps,
    savedAt + 60_000
  );
  assert.strictEqual(paused.si, 0);
  assert.ok(Math.abs(paused.remainingMs - 15000) <= 1000);
  assert.strictEqual(paused.elapsedActiveMs, 15000);
  assert.strictEqual(paused.paused, true);
}

// Running hidden-tab advances
{
  const steps = [{ sec: 30 }, { sec: 20 }];
  const savedAt = 1_000_000;
  const run = advanceResumeState(
    { si: 0, remainingMs: 15000, elapsedActiveMs: 15000, paused: false, savedAt },
    steps,
    savedAt + 5_000
  );
  assert.strictEqual(run.si, 0);
  assert.ok(Math.abs(run.remainingMs - 10000) <= 1000);
  assert.ok(Math.abs(run.elapsedActiveMs - 20000) <= 1000);
}

// Cross interval boundary while hidden
{
  const steps = [{ sec: 30 }, { sec: 20 }, { sec: 10 }];
  const savedAt = 1_000_000;
  const cross = advanceResumeState(
    { si: 0, remainingMs: 5000, elapsedActiveMs: 25000, paused: false, savedAt },
    steps,
    savedAt + 12_000 // finish 5s + 7s into next
  );
  assert.strictEqual(cross.si, 1);
  assert.ok(Math.abs(cross.remainingMs - 13000) <= 1000);
  assert.ok(cross.elapsedActiveMs >= 36000);
}

// Multi-interval overshoot
{
  const steps = [{ sec: 10 }, { sec: 10 }, { sec: 10 }];
  const savedAt = 1_000_000;
  const multi = advanceResumeState(
    { si: 0, remainingMs: 10000, elapsedActiveMs: 0, paused: false, savedAt },
    steps,
    savedAt + 25_000
  );
  assert.strictEqual(multi.si, 2);
  assert.ok(Math.abs(multi.remainingMs - 5000) <= 1000);
}

// Paused hidden does not advance
{
  const steps = [{ sec: 30 }];
  const savedAt = 1_000_000;
  const p = advanceResumeState(
    { si: 0, remainingMs: 15000, elapsedActiveMs: 15000, paused: true, savedAt },
    steps,
    savedAt + 999_000
  );
  assert.strictEqual(p.remainingMs, 15000);
  assert.strictEqual(p.elapsedActiveMs, 15000);
}

// Progression block: days 21–30 are indices 20–29 (ten days)
{
  const blockForDayIndex = (i) => Math.floor(i / 10);
  assert.strictEqual(blockForDayIndex(20), 2); // day 21
  assert.strictEqual(blockForDayIndex(29), 2); // day 30
  const daysInFinal = [];
  for (let i = 0; i < 30; i++) if (blockForDayIndex(i) >= 2) daysInFinal.push(i + 1);
  assert.deepStrictEqual(daysInFinal[0], 21);
  assert.deepStrictEqual(daysInFinal[daysInFinal.length - 1], 30);
  assert.strictEqual(daysInFinal.length, 10);
}

console.log('workout.test.js OK');

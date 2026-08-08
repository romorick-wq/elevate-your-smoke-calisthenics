const assert = require('assert');
const {
  scorePerson,
  scoringExplain,
  MAX_WEIGHT_MILESTONES,
} = require('../score');
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

assert.strictEqual(scoringExplain().pointsPerSession, 10);
assert.strictEqual(scoringExplain().sessionMinutes, 9);
assert.strictEqual(scoringExplain().weightMetric, 'loss_only');
assert.ok(scoringExplain().publicFields.includes('weightLostPct'));
assert.ok(scoringExplain().privateFields.includes('startingWeight'));
assert.ok(scoringExplain().privateFields.includes('phone'));

const zero = scorePerson({ sessions: 0, total: 20 });
assert.strictEqual(zero.points, 0);
assert.strictEqual(zero.hours, 0);

const one = scorePerson({ sessions: 1, total: 20 });
assert.strictEqual(one.points, 10 + 50); // 5% of card → 1 hour milestone
assert.strictEqual(one.hours, 0.15);

const wt = scorePerson({
  sessions: 0,
  total: 20,
  startingWeight: 200,
  currentWeight: 180, // 10% loss → 2 milestones
});
assert.strictEqual(wt.weightLostPct, 10);
assert.strictEqual(wt.weightMilestones, 2);
assert.strictEqual(wt.points, 200);

const gain = scorePerson({
  sessions: 0,
  total: 20,
  startingWeight: 200,
  currentWeight: 220, // gain → 0 weight points
});
assert.ok(gain.weightLostPct < 0);
assert.strictEqual(gain.weightMilestones, 0);
assert.strictEqual(gain.points, 0);

const capped = scorePerson({
  sessions: 0,
  total: 20,
  startingWeight: 200,
  currentWeight: 140, // 30% would be 6 milestones → capped
});
assert.strictEqual(capped.weightMilestones, MAX_WEIGHT_MILESTONES);
assert.ok(capped.weightMilestones <= MAX_WEIGHT_MILESTONES);

console.log('score.test.js OK');

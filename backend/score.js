/**
 * Shared scoring constants — single source of truth for API + docs.
 * Points = 10 per session + 50 per 5% of card completed + 100 per 5% BW lost (capped).
 */
const SESSION_MINUTES = 9;
const PTS_PER_SESSION = 10;
const PTS_PER_5PCT_WEIGHT = 100;
const PTS_PER_5PCT_HOURS = 50;
/** Cap weight-loss milestones so scoring never rewards extreme cutting. */
const MAX_WEIGHT_MILESTONES = 4; // 20% BW

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function scorePerson(p) {
  const sessions = n(p.sessions);
  const total = n(p.total);
  const hours = Math.round((sessions * SESSION_MINUTES) / 60 * 100) / 100;
  const startW =
    p.startingWeight === '' || p.startingWeight == null ? null : Number(p.startingWeight);
  const curW =
    p.currentWeight === '' || p.currentWeight == null ? null : Number(p.currentWeight);
  let weightLostPct = null;
  let weightDelta = null;
  if (startW != null && curW != null && startW > 0) {
    weightDelta = Math.round((startW - curW) * 10) / 10;
    weightLostPct = Math.round(((startW - curW) / startW) * 1000) / 10;
  }
  const hoursPct = total > 0 ? (sessions / total) * 100 : 0;
  const rawWeightMilestones =
    weightLostPct != null && weightLostPct > 0 ? Math.floor(weightLostPct / 5) : 0;
  const weightMilestones = Math.min(MAX_WEIGHT_MILESTONES, rawWeightMilestones);
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

function scoringExplain() {
  return {
    sessionMinutes: SESSION_MINUTES,
    pointsPerSession: PTS_PER_SESSION,
    pointsPer5PctCard: PTS_PER_5PCT_HOURS,
    pointsPer5PctWeight: PTS_PER_5PCT_WEIGHT,
    maxWeightMilestones: MAX_WEIGHT_MILESTONES,
    hoursFormula: 'sessions × 9 minutes',
    ties: 'Higher points win; then hours; then recent activity on the board.',
    refresh: 'Live on each board load. No fake delay.',
    publicFields: ['name', 'league', 'sessions', 'streak', 'points', 'hours', 'weightLostPct'],
    privateFields: ['phone', 'startingWeight', 'currentWeight', 'id'],
  };
}

module.exports = {
  SESSION_MINUTES,
  PTS_PER_SESSION,
  PTS_PER_5PCT_WEIGHT,
  PTS_PER_5PCT_HOURS,
  MAX_WEIGHT_MILESTONES,
  scorePerson,
  scoringExplain,
  n,
};

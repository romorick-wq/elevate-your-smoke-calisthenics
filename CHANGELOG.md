# Changelog

## 2026-08-08 — Launch-ready pass

### Product
- Landing: 9-minute card breakdown, 30-day progression, how points work, safety copy, welcome-all line
- Kickoff uses single ISO config + full date/timezone; live state after kickoff
- Demo ends on choice screen (Join / View 9-minute card / Close); play button state while playing
- Signup: league required, callsign validation, privacy acknowledgment, disabled submit until valid
- Dashboard: day, streak/best, hours, points, league, board rank, resume interrupted workout, calendar states
- Player: wake lock, mute/audio cues, vibration, pause on hidden tab, resume after refresh, restart, anti-double-log
- Profile settings: rename/league + self-delete via `/api/me/*`
- Privacy screen; PWA manifest + service worker (static assets only; never caches `/api` or `/admin`)
- Empty leaderboard explanation without fake records

### Backend
- Shared `backend/score.js` with weight-milestone cap
- Duplicate session protection per participant/challenge/day
- Progress upsert uses `GREATEST` (no downward rewrite)
- Public leaderboard omits `weightDelta`/phone/raw weights
- Organizer pin rate limiting; quieter error messages
- `/api/scoring`, `/api/me/update`, `/api/me/delete`

### Docs / tests
- README rewrite; `npm test` / `npm run check`

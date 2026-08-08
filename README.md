# Elevate Your Smoke

The Cigar Society’s **9-minute**, **30-day** calisthenics challenge — HTML workout app + Express/Postgres roster on Railway.

## Quick start

```bash
npm install
npm run install:backend   # if needed
export DATABASE_URL='postgresql://…'
export ORGANIZER_CODE='your-pin'
npm start                 # http://localhost:3000
```

Checks:

```bash
npm test
npm run check
```

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Postgres connection |
| `ORGANIZER_CODE` | Yes (prod) | Admin CRM pin (server-only) |
| `PGSSL` | No | Set `false` for local Postgres without SSL |
| `TWILIO_ACCOUNT_SID` | No | Server SMS |
| `TWILIO_AUTH_TOKEN` | No | Server SMS |
| `TWILIO_FROM_NUMBER` | No | E.164 from-number |
| `PORT` | No | Default `3000` |

Never put `ORGANIZER_CODE` or Twilio secrets in client HTML.

## Kickoff date

Configured once in `app/index.html`:

```js
CONFIG.KICKOFF_ISO = '2026-08-15T09:00:00-05:00'
CONFIG.KICKOFF_LABEL = 'Saturday, August 15, 2026 · 9:00 a.m. CDT (America/Chicago)'
```

Countdown never goes negative; after kickoff it shows **Challenge is live**.

## Scoring (single source of truth)

Implemented in `backend/score.js` (API + `/api/health` + `/api/scoring`):

- **10** points per completed session
- **+50** every 5% of the card completed (`sessions / total`)
- **+100** every 5% bodyweight lost from starting weight, **capped at 4 milestones (20%)**
- **Hours** = `sessions × 9 minutes`
- Duplicate session rows for the same participant/challenge/day are rejected server-side
- Progress fields only move **up** (`GREATEST`) on sync

Public leaderboard fields: callsign, league, sessions, streak, points, hours, weight-lost %. **Not** phone, raw weights, or ids.

## 9-minute structure

Always **540 seconds**:

1. Warm-up 60s (2×30)
2. Circuit 360s (3 rounds × 4 moves × 30s work+rest)
3. Finisher 60s
4. Cool-down 60s

Level 1: 20s work / 10s rest. Level 2+: 25s / 5s.

## Deploy (Railway)

```bash
railway link -p elevate-your-smoke
railway service link app
railway up --detach
railway deployment list --limit 1
curl -s https://elevate-your-smoke.up.railway.app/api/health
```

App URL: **https://elevate-your-smoke.up.railway.app**  
Admin: **https://elevate-your-smoke.up.railway.app/admin**

Keep `app/index.html` and `app/elevate-your-smoke.html` in sync when editing the workout UI.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Workout app |
| `/admin` | Organizer CRM (pin) |
| `/#board` | League boards |
| `/#manual` | Movement manual |
| `/#card` | 9-minute card explainer |
| `/#privacy` | Privacy |
| `/#settings` | Profile / leave |

## Migrations

`backend/db.js` `init()` applies additive schema on boot (`IF NOT EXISTS` columns/indexes), including unique session-per-day index.

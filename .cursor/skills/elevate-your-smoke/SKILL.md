---
name: elevate-your-smoke
description: >-
  Maintain and deploy Elevate Your Smoke military calisthenics (HTML app +
  Express/Postgres roster on Railway). Use when editing the workout UI, exercise
  photos/instructions, admin roster, ORGANIZER_CODE, or deploying to Railway.
---

# Elevate Your Smoke

Military calisthenics 30-day card. Free HTML workout + Railway Express/Postgres roster.

## Canonical layout

```
app/index.html              live workout UI (keep app/elevate-your-smoke.html in sync)
app/admin.html              organizer admin (/admin)
app/exercises/*.mp4         looping photo demos (start↔finish stills); frames/ + *.jpg posters
backend/server.js           Express static + /api
backend/db.js               Postgres participants/sessions
docs/SETUP-roster.md        Railway setup
```

## URLs & secrets

- App: `https://elevate-your-smoke.up.railway.app`
- Admin: `https://elevate-your-smoke.up.railway.app/admin`
- Organizer pin: Railway env `ORGANIZER_CODE` (currently set in Railway Variables)
- Project: Railway `elevate-your-smoke`, service `app`, env `production`

Link locally if needed:

```bash
railway link -p elevate-your-smoke
railway service link app
```

## Deploy workflow

After code changes the user wants live:

1. Keep `app/index.html` and `app/elevate-your-smoke.html` identical when editing the workout.
2. Commit + push `main` if the user asked to commit (or when they said deploy/update Railway as part of shipping).
3. Deploy:

```bash
railway up --detach
```

4. Wait for SUCCESS, then hard-refresh verify:

```bash
railway deployment list --limit 1
curl -sI https://elevate-your-smoke.up.railway.app/admin | head -5
```

## Product rules (do not drift)

- **Theme**: orange accent `#E85D04` (not lime). Military / badass tone. Brand as **The Cigar Society**.
- **Leagues**: Dual boards — **Brothers of the League** (`league: brothers`) and **Ladies of the League** (`league: ladies`). Join picks a league; public `#board` filters by league tabs; admin can edit league.
- **Copy**: PT-standard language — “Standard” cues, “Kill this fault”, mission briefing quiz.
- **Form media**: looping muted `<video>` photo presentations (start↔finish); JPG posters as fallback. Real form shots — no stick figures, no random gym lifestyle shots.
- **Admin roster fields** (per person, editable + Save): league, phone, starting weight, current weight, date started. Trash deletes.
- **Admin CRM** (`/admin`): Find/search by name or phone; league filter (All / Brothers / Ladies); tabs for CRM, Text (SMS), Points, Hours, Weight; tracks hours (`sessions × 9 min`) and points.
- **Points**: 10 per session + 50 every 5% of the card completed + 100 every 5% bodyweight lost (capped at 4 milestones / 20%). Source: `backend/score.js`.
- **Kickoff**: `CONFIG.KICKOFF_ISO` / `CONFIG.KICKOFF_LABEL` in `app/index.html`.
- **Participant self-service**: `POST /api/me/update`, `POST /api/me/delete` (id + callsign).
- **SMS**: Admin Text tab + per-person Text. Device Messages fallback; optional Twilio env vars.
- **Public leaderboard**: `GET /api/leaderboard?challenge=` (no pin) — Brothers / Ladies + Points / Hours / Weight in the app.
- **Admin APIs**:
  - `GET /api/roster?pin=&challenge=`
  - `GET /api/leaderboard?challenge=`
  - `POST /api/roster/update` `{ pin, challenge, name, phone, startingWeight, currentWeight, dateStarted, league }`
  - `POST /api/roster/delete` `{ pin, challenge, name }`
  - `POST /api/roster/sms` `{ pin, challenge, message, people?: [{name,phone}], name?, league? }`
- Participant quiz answers stay on-device; roster gets name + league + progress + weights (participant check-in or admin).

## When editing exercises

1. Update `EX[name].how` (3 cues) and `EX[name].watch` in `app/index.html`.
2. Update matching `M.*.c` one-liner and poses `a`/`b` if form changed.
3. Update `app/exercises/frames/<slug>-a.jpg` / `-b.jpg` (start/finish photos), then `node scripts/generate-exercise-videos.js`.
4. Sync twin HTML file; deploy.

## Admin date gotcha

`node-pg` returns DATE as a JS `Date`. Always format with ISO `YYYY-MM-DD` for `<input type="date">` (see `dateOnly()` in `backend/db.js`).

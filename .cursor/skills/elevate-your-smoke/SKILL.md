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
app/exercises/*.jpg         form photos (male / military-PT matched to the movement)
backend/server.js           Express static + /api
backend/db.js               Postgres participants/sessions
docs/SETUP-roster.md        Railway setup
```

## URLs & secrets

- App: `https://app-production-74bd.up.railway.app`
- Admin: `https://app-production-74bd.up.railway.app/admin`
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
curl -sI https://app-production-74bd.up.railway.app/admin | head -5
```

## Product rules (do not drift)

- **Theme**: orange accent `#E85D04` (not lime). Military / badass tone.
- **Copy**: PT-standard language — “Standard” cues, “Kill this fault”, mission briefing quiz.
- **Images**: male (or military male) doing the **exact** movement. No women. No random gym lifestyle shots.
- **Admin roster fields** (per person, editable + Save): phone, starting weight, date started. Trash deletes.
- **Admin APIs**:
  - `GET /api/roster?pin=&challenge=`
  - `POST /api/roster/update` `{ pin, challenge, name, phone, startingWeight, dateStarted }`
  - `POST /api/roster/delete` `{ pin, challenge, name }`
- Participant quiz answers stay on-device; roster only gets name + progress (+ admin-entered phone/weight/start date).

## When editing exercises

1. Update `EX[name].how` (3 cues) and `EX[name].watch` in `app/index.html`.
2. Update matching `M.*.c` one-liner.
3. Replace `app/exercises/<slug>.jpg` with a matched form photo; compress (~1200px, JPEG ~70).
4. Sync twin HTML file; deploy.

## Admin date gotcha

`node-pg` returns DATE as a JS `Date`. Always format with ISO `YYYY-MM-DD` for `<input type="date">` (see `dateOnly()` in `backend/db.js`).

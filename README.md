# Elevate Your Smoke — Calisthenics

A 30-day bodyweight challenge. Nine minutes a day, guided and timed, with a
looping stick-figure sample for every movement and a Postgres roster so the
organizer can see who is showing up.

The workout UI is plain HTML. The roster runs on **Railway** (Express + Postgres).

---

## What's in the box

```
app/
  index.html                 the workout app (also served by the API)
  elevate-your-smoke.html    identical copy for filing
  icon.png                   home-screen icon (also embedded in the app)
backend/
  server.js                  Express: static host + roster API
  db.js                      Postgres schema + queries
  package.json
  roster-backend.gs          legacy Google Sheets script (optional / unused)
  groundwork.html            earlier 28-day prototype (not the live app)
docs/
  SETUP-roster.md            Railway deploy + roster setup
  SETUP-roster-sheets.md     optional Google Sheets roster setup
railway.toml                 Railway build/start config
README.md
```

## Running locally (workout only)

Double-click `app/index.html`. The plan, timers, and diagrams work. Roster
sync stays off until the app is served over http(s) with a database behind it.

## Running locally (full stack)

```bash
cd backend
npm install
export DATABASE_URL='postgresql://USER:PASS@HOST:PORT/DB'
export ORGANIZER_CODE='your-code'
npm run dev
```

Open `http://localhost:3000`.

## Putting it online (Railway)

Follow [`docs/SETUP-roster.md`](docs/SETUP-roster.md). Short version:

1. Create a Railway project + Postgres.
2. Set `DATABASE_URL` and `ORGANIZER_CODE`.
3. Deploy this repo (GitHub or `railway up`).
4. Generate a public domain and send that link to participants.

`CONFIG.SYNC_URL` is already `'/api'` so same-origin sync works on Railway
with no extra edit.

## What gets collected

- Name (or nickname) they type
- Sessions finished, streak, day, last active
- One attendance row per finished session

Quiz answers never leave the device.

## Editing the workout later

Open `app/index.html` in any text editor.

- **Roster** — `CONFIG` near the top of the `<script>` block (`SYNC_URL`,
  `CHALLENGE`). Organizer pin is the Railway `ORGANIZER_CODE` variable.
- **Exercises** — `const EX=` for diagrams, cues, and “watch for” notes.
  `const M=` for levels and injury swaps.
- **Session shape** — `buildSession` builds the nine minutes.

After editing, redeploy on Railway. Progress lives in each person’s browser
(and in Postgres for the roster), so updates do not wipe cards.

## A note on what this is

The plan scales movements down for age, injuries, and a from-scratch start,
and it never asks anyone to train through pain. It is a structure for showing
up, not medical advice. Anyone with a condition that affects exercise should
clear it with a doctor first — the app says so on the first screen.

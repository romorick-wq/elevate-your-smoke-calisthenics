# Switching on the roster (Railway + Postgres)

About fifteen minutes the first time. After this, every participant who joins
lands in your Postgres database, and the organizer dashboard inside the app
reads from it.

The same Railway service hosts the HTML app and the API — one URL for
everyone.

---

## 1. Create the Railway project

1. Sign in at [railway.app](https://railway.app) and create a new project.
2. Click **Add service → Empty service** (or deploy from a GitHub repo if
   you push this folder).
3. Add a database: **Add → Database → PostgreSQL**.
4. Open the web service → **Variables**.
   - Link `DATABASE_URL` from the Postgres service (Railway’s variable
     reference / “Add variable” → reference the Postgres `DATABASE_URL`).
   - Add `ORGANIZER_CODE` = a code only you know (unlocks the in-app roster).
   - Optional: `PGSSL=false` only if you run Postgres locally without SSL.

## 2. Deploy this folder

**From GitHub (recommended)**

1. Push this project to a GitHub repository.
2. In Railway, connect that repo to the service.
3. Root directory stays the project root (`railway.toml` is already here).
4. Deploy. When it finishes, open **Settings → Networking → Generate domain**.

**From the CLI**

```bash
npm i -g @railway/cli
railway login
railway link   # pick the project + service
railway up
```

Then generate a public domain in the Railway dashboard.

## 3. Point the app at it

[`app/index.html`](../app/index.html) already has:

```js
const CONFIG={
  SYNC_URL:'/api',
  CHALLENGE:'smoke-30'
};
```

That works when people open your Railway domain. Change `CHALLENGE` whenever
you start a new group so rosters stay separate.

If you ever host the HTML somewhere else (Netlify, etc.), set `SYNC_URL` to
the full API URL, e.g. `https://your-app.up.railway.app/api`.

## 4. Check it works

1. Open `https://your-app.up.railway.app`.
2. Join with a test name, finish or skip through a session.
3. Open `/admin` on your Railway URL (or cover/plan → **Organizer**), enter your `ORGANIZER_CODE`.
4. You should see the test name.

Health check: `https://your-app.up.railway.app/api/health` should return
`{"ok":true,"alive":true}`.

---

## What lands in Postgres

**participants** — one row per person per challenge: name, joined, last
active, sessions finished, streak, day, days-per-week.

**sessions** — one row every time somebody finishes a nine-minute session
(attendance log).

## What does not leave the phone

Quiz answers (goal, level, age band, injuries) stay on-device. No email, no
phone number, no login. Anonymous nicknames are fine.

## Local development

```bash
cd backend
npm install
# Use the public DATABASE_URL from Railway Postgres, or a local Postgres
export DATABASE_URL='postgresql://…'
export ORGANIZER_CODE='1234'
npm run dev
```

Open `http://localhost:3000`. Relative `/api` sync works there.

## Replacing the old Google Sheets backend

[`roster-backend.gs`](roster-backend.gs) is the previous Sheets script. You can
ignore it once Railway is live. The app no longer needs Apps Script.

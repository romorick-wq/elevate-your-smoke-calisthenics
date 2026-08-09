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
   - Add `ORGANIZER_CODE` = a strong code only you know (unlocks the organizer CRM). Required in production — never commit it, never put it in HTML.
   - Optional: `PUBLIC_ORIGIN` = your exact site URL if you use a custom domain (comma-separated allowed CORS origins).
   - Optional: `PGSSL=false` only if you run Postgres locally without SSL.

## Security (what is / is not protected)

- **Protected:** organizer pin (server-only), Postgres data, Twilio secrets, admin reset/delete/SMS, rate limits, browser security headers.
- **Not hideable:** the public HTML/CSS/JS app files. Browsers must download them to run the site — that is normal. Do not put secrets in those files.
- Use a long random `ORGANIZER_CODE`. After failed pin attempts, wait before retrying (the API rate-limits by IP).

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
active, sessions finished, streak, day, days-per-week, phone, starting
weight, current weight, date started.

Hours on the boards = `sessions × 9 minutes`. Points = 10 per session,
+50 every 5% of the card completed, +100 every 5% bodyweight lost.

Public leaderboard (no pin): `GET /api/leaderboard?challenge=smoke-30`.

**sessions** — one row every time somebody finishes a nine-minute session
(attendance log).

## Group text (SMS + WhatsApp) — free by default

Admin **Text** tab + per-person **Text** / **WhatsApp** on CRM cards.

**Free Messages:** opens the organizer’s **Messages** app with recipients and
the draft filled in — you tap Send. Uses your normal phone/carrier plan.
Best on iPhone or Mac. Large blasts open in batches of 12.

**Free WhatsApp:** opens [wa.me](https://wa.me) click-to-chat with the draft
filled in — one person per chat (WhatsApp does not support multi-recipient
compose links). Use **Open next** to walk the roster. Same phone numbers as CRM.

**Copy numbers + message** works on desktop if neither app opens.

No Twilio / Meta Business API required for free messaging.

**Optional paid Twilio SMS** (server send): `TWILIO_ACCOUNT_SID`,
`TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`. Skip this for free messaging.

## What does not leave the phone

Quiz answers (goal, level, age band, injuries) stay on-device. No email and no
login. Callsigns and optional organizer-entered phones live on the roster.

## Local development

```bash
cd backend
npm install
# Use the public DATABASE_URL from Railway Postgres, or a local Postgres
export DATABASE_URL='postgresql://…'
export ORGANIZER_CODE='1234'
# optional SMS:
# export TWILIO_ACCOUNT_SID=…
# export TWILIO_AUTH_TOKEN=…
# export TWILIO_FROM_NUMBER=+1…
npm run dev
```

Open `http://localhost:3000`. Relative `/api` sync works there.

## Replacing the old Google Sheets backend

[`roster-backend.gs`](roster-backend.gs) is the previous Sheets script. You can
ignore it once Railway is live. The app no longer needs Apps Script.

---

## Health check (Railway)

`GET /api/health` returns `{ ok, alive, dbReady, sms, scoring }` without requiring organizer auth.
The process binds the HTTP port **before** Postgres init finishes so cold starts can pass Railway health checks and serve the static landing shell while the DB connects.

No browser keep-alive polling is required. Optional: set Railway health check path to `/api/health`.

## Cleanup exact test callsign `QA-Test-0808`

Do **not** add a migration that deletes on every deploy.

1. Organizer UI: open `/admin`, unlock with `ORGANIZER_CODE`, find exact callsign `QA-Test-0808`, Trash.
2. Or CLI (pin required, never commit the pin):

```bash
ORGANIZER_CODE='your-pin' node scripts/cleanup-qa-test-0808.js
```

Deletes only the exact callsign match and its session rows.

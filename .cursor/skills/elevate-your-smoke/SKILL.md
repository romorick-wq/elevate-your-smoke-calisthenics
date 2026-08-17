---
name: elevate-your-smoke
description: >-
  Maintain and deploy Elevate Your Smoke military calisthenics (HTML app +
  Express/Postgres roster on Railway). Use when editing the workout UI, exercise
  photos/instructions, admin roster, ORGANIZER_CODE, scoring, resume/timers,
  privacy, or deploying to Railway.
---

# Elevate Your Smoke

Military calisthenics 30-day card. Free HTML workout + Railway Express/Postgres roster.

Also follow the personal skill **app-production-hardening** for cross-app production rules.

## Canonical layout

```
app/website.html            public marketing site at /
app/index.html              workout SPA at /app (keep elevate-your-smoke.html in sync)
app/admin.html              organizer admin (/admin)
app/exercises/*.mp4         looping photo demos (start↔finish stills); frames/ + *.jpg posters
app/audio/coach/*.mp3       motivational coach cues (edge-tts GuyNeural); regenerate via script
app/sw.js                   cache key must bump on HTML/asset ships (eys-static-vX.Y.Z)
backend/server.js           Express static + /api (listen before DB init; media 404 ≠ SPA)
backend/db.js               Postgres participants/sessions + idempotent log
backend/score.js            weight-LOSS milestones only
backend/workout.js          540s totals, MIN_COMPLETE_MS, resume advance helpers
docs/SETUP-roster.md        Railway setup + QA cleanup
scripts/cleanup-qa-test-0808.js   exact callsign cleanup (needs ORGANIZER_CODE)
```

Public `/` shows live boards + Start now / Go to active → `/app`. CRM stays at `/admin`.

## URLs & secrets

- App: `https://elevate-your-smoke.up.railway.app`
- Admin: `/admin`
- Organizer pin: Railway env `ORGANIZER_CODE` (never print/commit; required in production)
- Optional CORS allowlist: `PUBLIC_ORIGIN` (custom domain)
- Security: `backend/security.js` headers + rate limits + timing-safe pin compare
- Challenge id: `CONFIG.CHALLENGE` = `smoke-30`
- Project: Railway `elevate-your-smoke`, service `app`, env `production`

```bash
railway link -p elevate-your-smoke
railway service link app
```

## Deploy workflow

1. Keep `app/index.html` ≡ `app/elevate-your-smoke.html`.
2. Commit/push only if the user asked (or shipping requires it).
3. `railway up --detach`
4. Wait SUCCESS; verify:

```bash
railway deployment list --limit 1
curl -s https://elevate-your-smoke.up.railway.app/api/health
```

Optional Railway setting: health check path `/api/health`.

## Product rules (do not drift)

- **Theme**: orange `#E85D04`. Brand **The Cigar Society**.
- **Leagues**: Brothers / Ladies — separate boards, same workout standard.
- **Session**: exactly **540s** — warm 60 → circuit 360 → finisher 60 → cool 60. L1 work/rest 20/10; L2+ 25/5.
- **Progression**: `block >= 2` ⇒ human days **21–30** (final **ten** days). Copy must match.
- **Schedule**: 30 calendar days; weekly freq → totals 13/18/22/26 for 3/4/5/6. Never show “0 of 0”.
- **Resume**: `RESUME_VERSION`, deadline/remainingMs/elapsedActiveMs/paused; no auto-pause on hide; Resume restores ±1s.
- **Completion**: server requires `elapsedMs >= MIN_COMPLETE_MS` (~85% of 540s); idempotency key + unique (participant, challenge, day).
- **Points**: 10/session + 50 every 5% card + 100 every 5% **bodyweight lost** (cap 4). Gain = 0 weight pts. Display “X% lost”.
- **Privacy public**: board display name (or callsign), league, sessions, streak, points, hours, weightLostPct. Private/organizer: callsign, phone, raw weights, id, quiz answers.
- **Inclusive onboarding**: no male-only age copy; preserve named league labels only.
- **Kickoff**: `CONFIG.KICKOFF_ISO` / `CONFIG.KICKOFF_LABEL`.
- **Self-service**: `POST /api/me/update`, `POST /api/me/delete`, `POST /api/me/login` (callsign + PIN), `POST /api/me/pin`. PIN is scrypt-hashed; never returned on boards.
- **Messaging (free)**: Admin Text tab + CRM **Text** / **WhatsApp**. Messages uses `sms:` (group); WhatsApp uses `wa.me` (one chat at a time + Open next). Same CRM phones. Twilio optional paid SMS only.
- **User ticker**: Sticky bottom marquee on `/app` (`#userticker`) — public board names/pts from `/api/leaderboard`; tap opens `#board`. Hidden under workout player.

## Tests

```bash
npm test    # score + workout + copy/privacy/delete
npm run check
```

Live smoke: health, leaderboard privacy, incomplete reject, full credit once, concurrent dupes, self-delete, real `Content-Type` on exercise JPGs.

## QA cleanup

Exact callsign only — never substring deletes:

```bash
ORGANIZER_CODE='***' node scripts/cleanup-qa-test-0808.js
```

Or `/admin` → Trash. Note: device localStorage `ping` can recreate a deleted callsign.

## When editing exercises

1. Update `EX[name].how` / `watch` and matching `M.*.c`.
2. Frames → `node scripts/generate-exercise-videos.js`.
3. Slug via `exerciseSlug()` must match `app/exercises/<slug>.jpg|.mp4` (`Child’s pose` → `child-s-pose`).
4. New/renamed moves → add line in `scripts/generate-coach-audio.py`, then `python3 scripts/generate-coach-audio.py`.
5. Sync twin HTML; bump SW cache if needed; deploy.

## Gotchas

- `node-pg` DATE → always ISO `YYYY-MM-DD` for date inputs (`dateOnly()`).
- Missing `/exercises/*` must 404, not return `index.html`.
- Do not auto-pause workout on `visibilitychange` while running.

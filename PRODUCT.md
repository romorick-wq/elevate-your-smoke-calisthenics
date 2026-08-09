# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: members of The Cigar Society leagues — Brothers of the League and Ladies of the League — who join Elevate Your Smoke to train a 30-day calisthenics card on their phone.

Secondary: organizers who run the roster CRM, messaging, and challenge ops at `/admin`.

Situation: members are locking a callsign, picking a league, and stacking nine-minute sessions around real life — not living in a gym app. Job: complete the scheduled card sessions with clear form, fair scoring, and league visibility.

## Product Purpose

Elevate Your Smoke is The Cigar Society’s free 30-day bodyweight calisthenics challenge: a fixed nine-minute daily PT card (540s), dual league boards, and optional weight-loss milestones.

Success for this round (`smoke-30`) prioritizes **sessions completed** — members finish scheduled workouts honestly (including resume and recovery days) over marketing conversion or CRM polish.

## Positioning

Two named leagues, one workout standard. Timed Society PT with exact form demos, dual public boards, and bragging rights — no gym, no subscription, no fluff. A generic fitness tracker cannot truthfully claim Brothers/Ladies of the League or this Society card ritual.

## Operating Context

- Public marketing site `/`, workout SPA `/app`, organizer admin `/admin`.
- Kickoff and challenge identity live in app config (`KICKOFF_*`, `CHALLENGE` = `smoke-30`).
- Hosted on Railway (Express static + Postgres roster API).
- On-device mission brief answers; roster sync when `/api` is available.
- Rituals: lock callsign → mission check → 30-day card → train → optional weight check-in → league boards / live ticker.

## Capabilities and Constraints

Confirmed:

- Session structure exactly 540s: warm 60 → circuit 360 → finisher 60 → cool 60; L1 work/rest 20/10; L2+ 25/5.
- 30 calendar days; weekly frequency → 13/18/22/26 sessions for 3/4/5/6 days/week; never show “0 of 0”.
- Days 21–30 (final ten) step movements up one level (`block >= 2`).
- Points: 10/session + 50 every 5% of card finished + 100 every 5% bodyweight **lost** (cap 4); gain = 0 weight points.
- Completion requires ~85% elapsed (`MIN_COMPLETE_MS`); resume must restore timing faithfully; no auto-pause on hide.
- Public privacy: display name (or callsign), league, sessions, streak, points, hours, weightLostPct only. Private/organizer: callsign, phone, raw weights, id, quiz answers.
- Inclusive onboarding: no male-only age copy; preserve named league labels only.
- Self-service profile update/delete; organizer messaging via Messages/WhatsApp (Twilio optional).
- Keep `app/index.html` ≡ `app/elevate-your-smoke.html`; bump service-worker cache on HTML/asset ships.
- Production requires `ORGANIZER_CODE` (never commit).

Undecided:

- Formal accessibility standard beyond current inclusive copy and focus basics (not set in init).
- Future challenge IDs / seasons beyond `smoke-30`.

## Brand Commitments

- Product name: **Elevate Your Smoke**.
- Parent brand: **The Cigar Society**.
- League names: **Brothers of the League**, **Ladies of the League** — separate boards, same standard.
- Voice: direct, military-PT blunt, Society pride; effort over ego; pain is a stop signal.
- Footer credit: Cigar Society Dev. Team.
- Binding identity cue (do not casually replace): Society orange accent used across the product surfaces.

## Evidence on Hand

- Live product: `https://elevate-your-smoke.up.railway.app`
- Surfaces: `app/website.html`, `app/index.html` (workout), `app/admin.html`
- Exercise demos: `app/exercises/*.mp4` (+ posters/frames); coach audio under `app/audio/coach/`
- Promo/demo assets on the cover flow; leaderboard API for boards/ticker
- Do **not** fabricate testimonials, medical claims, or competitor benchmarks

## Product Principles

1. **Finish the nine minutes** — session clarity, timers, resume, and demos beat decorative chrome.
2. **One standard, two leagues** — never dilute Brothers/Ladies identity or imply different workout rules.
3. **Privacy is part of the product** — public boards stay lean; raw identity and weights stay private.
4. **Honest progress** — recovery days, no double-ups to fake streaks, weight points for loss only.
5. **Ship as one Society card** — keep twins in sync and treat production hardening as product truth, not optional polish.

## Accessibility & Inclusion

Inclusive onboarding copy (no male-only age framing); named leagues preserved as brand labels. Formal WCAG target not yet set — treat readable contrast, visible focus, and usable touch targets as baseline expectations for phone-first web use.

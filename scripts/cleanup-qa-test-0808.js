#!/usr/bin/env node
/**
 * Manual production cleanup for exact callsign QA-Test-0808 only.
 *
 * Requires ORGANIZER_CODE (pin) — do not commit secrets.
 * Usage:
 *   ORGANIZER_CODE='your-pin' node scripts/cleanup-qa-test-0808.js
 *
 * Or in organizer UI (/admin): Find "QA-Test-0808" → Trash → confirm.
 */
const NAME = 'QA-Test-0808';
const BASE = process.env.APP_URL || 'https://elevate-your-smoke.up.railway.app';
const pin = process.env.ORGANIZER_CODE || '';
const challenge = process.env.CHALLENGE || 'smoke-30';

if (!pin) {
  console.error('Set ORGANIZER_CODE to the Railway organizer pin, then re-run.');
  console.error(`Example: ORGANIZER_CODE='****' node scripts/cleanup-qa-test-0808.js`);
  console.error(`Or open ${BASE}/admin → find exact callsign ${NAME} → Trash.`);
  process.exit(2);
}

(async () => {
  const rosterUrl = `${BASE}/api/roster?pin=${encodeURIComponent(pin)}&challenge=${encodeURIComponent(challenge)}`;
  const r = await fetch(rosterUrl);
  const d = await r.json();
  if (!d.ok) {
    console.error('Roster fetch failed', d);
    process.exit(1);
  }
  const matches = (d.people || []).filter(
    (p) => String(p.name || '').trim().toLowerCase() === NAME.toLowerCase()
  );
  console.log('Exact matches:', matches.length, matches.map((p) => ({ name: p.name, sessions: p.sessions })));
  if (!matches.length) {
    console.log('No exact QA-Test-0808 participant found — nothing to delete.');
    process.exit(0);
  }
  const del = await fetch(`${BASE}/api/roster/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, challenge, name: NAME }),
  });
  const out = await del.json();
  console.log('Delete result:', out);
  process.exit(out.ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

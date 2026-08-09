const assert = require('assert');
const fs = require('fs');
const path = require('path');

/**
 * Isolated deletion safety tests — never touch production.
 * Confirms exact callsign matching and that lookalikes are preserved.
 */

function exactCallsignMatch(stored, target) {
  return String(stored || '').trim().toLowerCase() === String(target || '').trim().toLowerCase();
}

const TARGET = 'QA-Test-0808';
assert.strictEqual(exactCallsignMatch('QA-Test-0808', TARGET), true);
assert.strictEqual(exactCallsignMatch('qa-test-0808', TARGET), true);
assert.strictEqual(exactCallsignMatch('QA-Test-0808 ', TARGET), true);
assert.strictEqual(exactCallsignMatch('QA-Test-0809', TARGET), false);
assert.strictEqual(exactCallsignMatch('QA-Test-080', TARGET), false);
assert.strictEqual(exactCallsignMatch('QA Test 0808', TARGET), false);

// Simulate roster filter used by organizer delete
function filterExact(people, name) {
  return people.filter((p) => exactCallsignMatch(p.name, name));
}
const roster = [
  { name: 'QA-Test-0808', id: 'a' },
  { name: 'QA-Test-0808x', id: 'b' },
  { name: 'Marcus R.', id: 'c' },
];
const hit = filterExact(roster, TARGET);
assert.strictEqual(hit.length, 1);
assert.strictEqual(hit[0].id, 'a');

// Inclusive age copy present; male-only age copy absent
const indexHtml = fs.readFileSync(path.join(__dirname, '../../app/index.html'), 'utf8');
assert.ok(indexHtml.includes('Your age helps set recovery and progression'));
assert.ok(!indexHtml.includes('built for grown men'));
assert.ok(indexHtml.includes('Days 21–30'));
assert.ok(indexHtml.includes('Final ten days'));
assert.ok(!indexHtml.includes('Days 22–30'));
assert.ok(indexHtml.includes('% lost') || indexHtml.includes('fmtLossPct'));
assert.ok(indexHtml.includes('weight-loss percent'));
assert.ok(indexHtml.includes('RESUME_VERSION'));
assert.ok(indexHtml.includes('advanceResumeAcrossGap'));
assert.ok(indexHtml.includes('MIN_COMPLETE_MS'));
assert.ok(indexHtml.includes('primaryCtaLabel') || indexHtml.includes('Go to active'));
assert.ok(fs.existsSync(path.join(__dirname, '../../app/website.html')));
const site = fs.readFileSync(path.join(__dirname, '../../app/website.html'), 'utf8');
assert.ok(site.includes('Go to active'));
assert.ok(site.includes('id="boards"'));
assert.ok(site.includes('/admin'));
assert.ok(site.includes('/api/leaderboard'));
assert.ok(site.includes('/api/visits'));
assert.ok(site.includes('id="visit-count"'));
assert.ok(site.includes('trackVisit'));

// Phase cards use stacked flex (no absolute overlap layout)
assert.ok(indexHtml.includes('.phases .ph{background:var(--surface2)'));
assert.ok(indexHtml.includes('flex-direction:column'));

// Desktop widening
assert.ok(indexHtml.includes('@media (min-width:900px)'));
assert.ok(indexHtml.includes('max-width:720px'));

// Organizer reset progress (keep on roster)
const adminHtml = fs.readFileSync(path.join(__dirname, '../../app/admin.html'), 'utf8');
assert.ok(adminHtml.includes('/api/roster/reset'));
assert.ok(adminHtml.includes('data-reset'));
const serverJs = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
assert.ok(serverJs.includes("'/api/roster/reset'"));
assert.ok(serverJs.includes('handleReset'));
assert.ok(serverJs.includes("'/api/visits'"));
const dbJs = fs.readFileSync(path.join(__dirname, '../db.js'), 'utf8');
assert.ok(dbJs.includes('resetParticipantProgress'));
assert.ok(dbJs.includes('participants.sessions + 1'));
assert.ok(dbJs.includes('recordVisit'));
assert.ok(dbJs.includes('site_stats'));
assert.ok(dbJs.includes('display_name'));
assert.ok(dbJs.includes('publicBoardName'));
assert.ok(adminHtml.includes('Display name (public board)'));
assert.ok(indexHtml.includes('Display name (public board)'));
assert.ok(indexHtml.includes('boardNameOf'));
assert.ok(indexHtml.includes('id="userticker"'));
assert.ok(indexHtml.includes('mountUserTicker'));
assert.ok(indexHtml.includes('refreshUserTicker'));

console.log('copy-privacy-delete.test.js OK');

/**
 * ELEVATE YOUR SMOKE — roster backend
 * Paste this into Extensions > Apps Script on a new Google Sheet.
 *
 * It stores one row per participant and one row per finished session.
 * It never receives an email, a phone number, or anything the app
 * asks people about themselves — only the name they typed and their
 * progress through the challenge.
 */

// ---- change this to whatever you want the organizer code to be ----
var ORGANIZER_CODE = '1234';

var PEOPLE = 'participants';
var LOG    = 'sessions';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var b = JSON.parse(e.postData.contents);
    if (!b.id || !b.challenge) return out({ ok: false, error: 'bad request' });

    var sh = sheet(PEOPLE, ['id','name','challenge','joined','lastActive','sessions','total','streak','day','perWeek']);
    var rows = sh.getDataRange().getValues();
    var now = new Date();
    var found = 0;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === b.id) { found = i + 1; break; }
    }
    var record = [b.id, b.name || '', b.challenge, found ? rows[found-1][3] : now, now,
                  n(b.sessions), n(b.total), n(b.streak), n(b.day), n(b.perWeek)];
    if (found) sh.getRange(found, 1, 1, record.length).setValues([record]);
    else       sh.appendRow(record);

    if (b.action === 'log') {
      sheet(LOG, ['when','id','name','challenge','day','sessionsAfter'])
        .appendRow([now, b.id, b.name || '', b.challenge, n(b.day), n(b.sessions)]);
    }
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function doGet(e) {
  var p = e.parameter || {};
  if (p.action !== 'roster') return out({ ok: true, alive: true });
  if (String(p.pin) !== String(ORGANIZER_CODE)) return out({ ok: false, error: 'bad pin' });

  var sh = sheet(PEOPLE, ['id','name','challenge','joined','lastActive','sessions','total','streak','day','perWeek']);
  var rows = sh.getDataRange().getValues();
  var byName = {};
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (p.challenge && r[2] !== p.challenge) continue;
    var person = {
      name: r[1], joined: ms(r[3]), lastActive: ms(r[4]),
      sessions: n(r[5]), total: n(r[6]), streak: n(r[7]), day: n(r[8]), perWeek: n(r[9])
    };
    // one line per person even if they reinstalled on a new phone
    var key = String(person.name).toLowerCase().trim();
    if (!byName[key]) { byName[key] = person; }
    else if (person.sessions > byName[key].sessions) {
      var keptName = byName[key].joined <= person.joined ? byName[key].name : person.name;
      person.name = keptName;
      byName[key] = person;
    }
  }
  var people = [];
  for (var k in byName) people.push(byName[k]);
  return out({ ok: true, people: people });
}

function sheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}
function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
function n(v) { var x = Number(v); return isNaN(x) ? 0 : x; }
function ms(v) { return v instanceof Date ? v.getTime() : (Number(v) || 0); }

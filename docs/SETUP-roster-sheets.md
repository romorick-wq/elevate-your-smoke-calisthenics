# Switching on the roster

Fifteen minutes, once. After this, every participant who joins shows up on a
sheet you own, and the organizer dashboard inside the app reads from it.

Nothing here costs money and there is no server to maintain — a Google Sheet
does the storing, and a short script attached to it does the listening.

---

## 1. Make the sheet listen

1. Create a new Google Sheet. Name it something like **Smoke 30 — Roster**.
2. In the menu: **Extensions → Apps Script**. A code editor opens.
3. Delete whatever sample code is in there. Paste in the whole contents of
   `roster-backend.gs`.
4. Near the top, change `var ORGANIZER_CODE = '1234';` to a code only you know.
   This is what unlocks the dashboard. It is not a password protecting anything
   sensitive — it just keeps participants from browsing the roster.
5. Save (the disk icon).

## 2. Publish it

1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set **Execute as: Me**, and **Who has access: Anyone**.
   - "Anyone" means anyone with the link can send progress to your sheet. It
     does not let anyone read the roster — that still needs your organizer code.
4. Click **Deploy**. Google will ask you to authorize it; the "unverified app"
   warning is normal for your own script. Click through **Advanced → Go to
   (project name)**.
5. Copy the **Web app URL**. It ends in `/exec`.

## 3. Point the app at it

Open `elevate-your-smoke.html` in any text editor. Near the top you will find:

```js
const CONFIG={
  SYNC_URL:'',
  CHALLENGE:'smoke-30'
};
```

Paste your URL between the quotes on the `SYNC_URL` line. Change `CHALLENGE`
whenever you start a new group — each tag keeps its own roster, so your January
group and your March group do not mix.

Save the file, upload it to your host, and you are live.

## 4. Check it works

Open the app, join with a test name, finish a session (the skip button moves
through it fast). Then go back to the cover screen, tap **Organizer**, enter
your code. You should see yourself.

---

## What lands on the sheet

Two tabs appear automatically.

**participants** — one row per person: the name they typed, when they joined,
when they were last active, sessions finished, current streak, which day they
are on.

**sessions** — one row every time somebody finishes a nine-minute session, with
a timestamp. This is your attendance record.

## What does not land on the sheet

Their answers to the six questions — goal, level, age band, injuries — never
leave their phone. Those shape their plan locally and are never transmitted. No
email, no phone number, no login. If somebody wants to be anonymous on your
roster, they can type any name they like and everything still works.

## Things worth knowing

- **A quiet participant still shows up.** Anyone who opens the app pings the
  roster, so you can tell "opened it, did not train" apart from "gone".
- **Offline is fine.** If a session finishes with no signal, the app holds the
  report and sends it next time it opens.
- **New phone, same person.** The roster merges rows by name, so someone who
  reinstalls appears once, not twice. Ask people to keep their name spelling
  consistent.
- **Changing the script later.** Edit it, then **Deploy → Manage deployments →
  edit (pencil) → Version: New version → Deploy**. The URL stays the same. If
  you create a whole new deployment instead, the URL changes and you would have
  to reissue the app.

/**
 * Twilio SMS helper. Uses env:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER  (E.164, e.g. +15551234567)
 */

function smsConfigured() {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );
}

/** Normalize to E.164 for US numbers; return '' if unusable. */
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (String(raw || '').trim().startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return '+' + digits;
  }
  return '';
}

async function sendOne(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data.message || data.error_message || `Twilio HTTP ${r.status}`;
    return { ok: false, to, error: msg };
  }
  return { ok: true, to, sid: data.sid || '' };
}

/**
 * @param {Array<{name?: string, phone?: string}>} people
 * @param {string} message
 */
async function sendSms(people, message) {
  if (!smsConfigured()) {
    return { ok: false, error: 'sms not configured' };
  }
  const text = String(message || '').trim();
  if (!text) return { ok: false, error: 'empty message' };
  if (text.length > 1500) return { ok: false, error: 'message too long' };

  const targets = [];
  const seen = new Set();
  const skipped = [];
  for (const p of people || []) {
    const name = String(p.name || '').trim() || '—';
    const to = normalizePhone(p.phone);
    if (!to) {
      skipped.push({ name, phone: p.phone || '', reason: 'no phone' });
      continue;
    }
    if (seen.has(to)) {
      skipped.push({ name, phone: to, reason: 'duplicate' });
      continue;
    }
    seen.add(to);
    targets.push({ name, to });
  }

  if (!targets.length) {
    return { ok: false, error: 'no phones', skipped, sent: [], failed: [] };
  }

  const sent = [];
  const failed = [];
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    try {
      const result = await sendOne(t.to, text);
      if (result.ok) sent.push({ name: t.name, to: t.to, sid: result.sid });
      else failed.push({ name: t.name, to: t.to, error: result.error });
    } catch (err) {
      failed.push({ name: t.name, to: t.to, error: String(err.message || err) });
    }
    if (i < targets.length - 1) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  return {
    ok: failed.length === 0,
    sent,
    failed,
    skipped,
    meta: { total: targets.length, sent: sent.length, failed: failed.length, skipped: skipped.length },
  };
}

module.exports = { smsConfigured, normalizePhone, sendSms };

/**
 * Twilio SMS helper. Env (Railway):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER              (E.164, e.g. +15551234567)
 *   OR TWILIO_MESSAGING_SERVICE_SID  (alternative to From)
 */

function env(name) {
  const v = process.env[name];
  return v != null && String(v).trim() ? String(v).trim() : '';
}

function smsMissing() {
  const missing = [];
  if (!env('TWILIO_ACCOUNT_SID')) missing.push('TWILIO_ACCOUNT_SID');
  if (!env('TWILIO_AUTH_TOKEN')) missing.push('TWILIO_AUTH_TOKEN');
  if (!env('TWILIO_FROM_NUMBER') && !env('TWILIO_MESSAGING_SERVICE_SID')) {
    missing.push('TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID');
  }
  return missing;
}

function smsConfigured() {
  return smsMissing().length === 0;
}

function smsStatus() {
  const missing = smsMissing();
  return {
    configured: missing.length === 0,
    missing,
    fromMode: env('TWILIO_MESSAGING_SERVICE_SID')
      ? 'messaging_service'
      : env('TWILIO_FROM_NUMBER')
        ? 'from_number'
        : 'none',
  };
}

/** Normalize to E.164 for US numbers; return '' if unusable. */
function normalizePhone(raw) {
  const trimmed = String(raw || '').trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (trimmed.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return '+' + digits;
  }
  // Allow already-international without leading + if 11–15 digits
  if (digits.length >= 11 && digits.length <= 15) return '+' + digits;
  return '';
}

async function sendOne(to, body) {
  const sid = env('TWILIO_ACCOUNT_SID');
  const token = env('TWILIO_AUTH_TOKEN');
  const from = env('TWILIO_FROM_NUMBER');
  const messagingSid = env('TWILIO_MESSAGING_SERVICE_SID');
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const params = new URLSearchParams({ To: to, Body: body });
  if (messagingSid) params.set('MessagingServiceSid', messagingSid);
  else params.set('From', from);

  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 20000) : null;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: ctrl ? ctrl.signal : undefined,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = data.message || data.error_message || `Twilio HTTP ${r.status}`;
      return { ok: false, to, error: msg, code: data.code };
    }
    return { ok: true, to, sid: data.sid || '' };
  } catch (err) {
    return { ok: false, to, error: String(err.message || err) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * @param {Array<{name?: string, phone?: string}>} people
 * @param {string} message
 */
async function sendSms(people, message) {
  if (!smsConfigured()) {
    return {
      ok: false,
      error: 'sms not configured',
      hint: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER (or TWILIO_MESSAGING_SERVICE_SID) on Railway.',
      missing: smsMissing(),
    };
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

module.exports = {
  smsConfigured,
  smsMissing,
  smsStatus,
  normalizePhone,
  sendSms,
};

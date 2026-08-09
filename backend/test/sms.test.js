const assert = require('assert');
const { normalizePhone, smsConfigured, smsMissing, smsStatus } = require('../sms');

assert.strictEqual(normalizePhone('5551234567'), '+15551234567');
assert.strictEqual(normalizePhone('(555) 123-4567'), '+15551234567');
assert.strictEqual(normalizePhone('1-555-123-4567'), '+15551234567');
assert.strictEqual(normalizePhone('+44 7700 900123'), '+447700900123');
assert.strictEqual(normalizePhone(''), '');
assert.strictEqual(normalizePhone('123'), '');

// Without Twilio env, not configured
delete process.env.TWILIO_ACCOUNT_SID;
delete process.env.TWILIO_AUTH_TOKEN;
delete process.env.TWILIO_FROM_NUMBER;
delete process.env.TWILIO_MESSAGING_SERVICE_SID;
assert.strictEqual(smsConfigured(), false);
assert.ok(smsMissing().length >= 2);
assert.strictEqual(smsStatus().configured, false);

process.env.TWILIO_ACCOUNT_SID = 'ACtest';
process.env.TWILIO_AUTH_TOKEN = 'token';
process.env.TWILIO_FROM_NUMBER = '+15551234567';
assert.strictEqual(smsConfigured(), true);
assert.deepStrictEqual(smsMissing(), []);
assert.strictEqual(smsStatus().fromMode, 'from_number');

delete process.env.TWILIO_FROM_NUMBER;
process.env.TWILIO_MESSAGING_SERVICE_SID = 'MGtest';
assert.strictEqual(smsConfigured(), true);
assert.strictEqual(smsStatus().fromMode, 'messaging_service');

console.log('sms.test.js OK');

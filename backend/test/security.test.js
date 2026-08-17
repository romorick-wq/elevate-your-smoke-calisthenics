const assert = require('assert');
const {
  safeEqual,
  corsOriginAllowed,
  pinAllowed,
  loginAllowed,
  visitIncrementAllowed,
  normalizePin,
  hashPin,
  verifyPin,
} = require('../security');

assert.strictEqual(safeEqual('abc', 'abc'), true);
assert.strictEqual(safeEqual('abc', 'abd'), false);
assert.strictEqual(safeEqual('abc', 'abcd'), false);
assert.strictEqual(safeEqual('', 'x'), false);

assert.strictEqual(corsOriginAllowed(undefined), true);
assert.strictEqual(corsOriginAllowed('http://localhost:3000'), true);
assert.strictEqual(corsOriginAllowed('https://elevate-your-smoke.up.railway.app'), true);
assert.strictEqual(corsOriginAllowed('https://evil.example'), false);
assert.strictEqual(corsOriginAllowed('javascript:alert(1)'), false);

const ip = 'test-ip-' + Date.now();
assert.strictEqual(visitIncrementAllowed(ip), true);
assert.strictEqual(visitIncrementAllowed(ip), false);

const pinIp = 'pin-ip-' + Date.now();
for (let i = 0; i < 12; i++) assert.strictEqual(pinAllowed(pinIp), true);
assert.strictEqual(pinAllowed(pinIp), false);

const loginIp = 'login-ip-' + Date.now();
for (let i = 0; i < 8; i++) assert.strictEqual(loginAllowed(loginIp), true);
assert.strictEqual(loginAllowed(loginIp), false);

assert.strictEqual(normalizePin('4821'), '4821');
assert.strictEqual(normalizePin(' 12 3456 '), '123456');
assert.strictEqual(normalizePin('12'), null);
assert.strictEqual(normalizePin('abcdefgh'), null);
const hashed = hashPin('4821');
assert.ok(hashed && hashed.startsWith('scrypt$'));
assert.strictEqual(verifyPin('4821', hashed), true);
assert.strictEqual(verifyPin('4822', hashed), false);
assert.strictEqual(verifyPin('4821', ''), false);

const fs = require('fs');
const path = require('path');
const server = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
assert.ok(server.includes('securityHeaders'));
assert.ok(server.includes('safeEqual'));
assert.ok(server.includes("disable('x-powered-by')"));
assert.ok(!server.includes("ORGANIZER_CODE || '1234'"));
assert.ok(server.includes('loginAllowed'));
assert.ok(server.includes("'/api/me/login'"));

console.log('security.test.js OK');

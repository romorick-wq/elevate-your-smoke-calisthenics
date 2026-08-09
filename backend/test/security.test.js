const assert = require('assert');
const {
  safeEqual,
  corsOriginAllowed,
  pinAllowed,
  visitIncrementAllowed,
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

const fs = require('fs');
const path = require('path');
const server = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
assert.ok(server.includes('securityHeaders'));
assert.ok(server.includes('safeEqual'));
assert.ok(server.includes("disable('x-powered-by')"));
assert.ok(!server.includes("ORGANIZER_CODE || '1234'"));

console.log('security.test.js OK');

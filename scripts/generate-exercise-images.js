#!/usr/bin/env node
/** Regenerate app/exercises/*.svg start→finish form cards from EX poses in app/index.html */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SEG = { sp: 24, hd: 9, hr: 5.5, ua: 11, fa: 10, th: 15, sn: 15, ft: 6 };
const P = (o) => Object.assign({ x: 60, y: 44, t: 180, s: [0, 0], e: [0, 0], h: [0, 0], k: [0, 0], f: [95, 95] }, o);
const pt = (x, y, a, l) => {
  const r = (a * Math.PI) / 180;
  return [x + l * Math.sin(r), y + l * Math.cos(r)];
};
function joints(p) {
  const pel = [p.x, p.y];
  const nk = pt(p.x, p.y, p.t, SEG.sp);
  const hd = pt(nk[0], nk[1], p.t, SEG.hd);
  const arms = [0, 1].map((i) => {
    const e = pt(nk[0], nk[1], p.s[i], SEG.ua);
    return [e, pt(e[0], e[1], p.e[i], SEG.fa)];
  });
  const legs = [0, 1].map((i) => {
    const k = pt(pel[0], pel[1], p.h[i], SEG.th);
    const f = pt(k[0], k[1], p.k[i], SEG.sn);
    return [k, f, pt(f[0], f[1], p.f[i], SEG.ft)];
  });
  return { pel, nk, hd, arms, legs };
}
function bodySVG(p) {
  const J = joints(p);
  const L = (A, B, w, o) =>
    `<line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}" stroke="#181B16" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`;
  let s = '';
  s += L(J.nk, J.arms[1][0], 3, 0.32) + L(J.arms[1][0], J.arms[1][1], 3, 0.32);
  s += L(J.pel, J.legs[1][0], 3.2, 0.32) + L(J.legs[1][0], J.legs[1][1], 3.2, 0.32) + L(J.legs[1][1], J.legs[1][2], 2.4, 0.32);
  s += L(J.pel, J.nk, 4.6, 1);
  s += `<circle cx="${J.hd[0].toFixed(1)}" cy="${J.hd[1].toFixed(1)}" r="${SEG.hr}" fill="none" stroke="#181B16" stroke-width="3"/>`;
  s += L(J.nk, J.arms[0][0], 3.4, 1) + L(J.arms[0][0], J.arms[0][1], 3.4, 1);
  s += L(J.pel, J.legs[0][0], 3.8, 1) + L(J.legs[0][0], J.legs[0][1], 3.8, 1) + L(J.legs[0][1], J.legs[0][2], 2.6, 1);
  return s;
}
const PR = {
  floor:
    '<line x1="4" y1="75" x2="116" y2="75" stroke="#181B16" stroke-width="1.6" opacity=".45"/>' +
    [10, 26, 42, 58, 74, 90, 106].map((x) => `<line x1="${x}" y1="75" x2="${x - 4}" y2="80" stroke="#181B16" stroke-width="1" opacity=".25"/>`).join(''),
  wall:
    '<line x1="94" y1="4" x2="94" y2="76" stroke="#181B16" stroke-width="1.6" opacity=".45"/>' +
    [10, 24, 38, 52, 66].map((y) => `<line x1="94" y1="${y}" x2="99" y2="${y - 4}" stroke="#181B16" stroke-width="1" opacity=".25"/>`).join(''),
  frame:
    '<line x1="88" y1="2" x2="88" y2="76" stroke="#181B16" stroke-width="1.6" opacity=".45"/><line x1="93" y1="2" x2="93" y2="76" stroke="#181B16" stroke-width="1.6" opacity=".3"/>',
  box: '<rect x="54" y="68" width="54" height="8" fill="none" stroke="#181B16" stroke-width="1.6" opacity=".45"/>',
  chair:
    '<line x1="70" y1="57" x2="110" y2="57" stroke="#181B16" stroke-width="1.6" opacity=".45"/><line x1="106" y1="57" x2="106" y2="28" stroke="#181B16" stroke-width="1.6" opacity=".45"/><line x1="74" y1="57" x2="74" y2="75" stroke="#181B16" stroke-width="1.4" opacity=".35"/><line x1="106" y1="57" x2="106" y2="75" stroke="#181B16" stroke-width="1.4" opacity=".35"/>',
  table:
    '<line x1="24" y1="46" x2="110" y2="46" stroke="#181B16" stroke-width="2" opacity=".45"/><line x1="30" y1="46" x2="30" y2="75" stroke="#181B16" stroke-width="1.4" opacity=".3"/><line x1="104" y1="46" x2="104" y2="75" stroke="#181B16" stroke-width="1.4" opacity=".3"/>',
  bar: '<line x1="24" y1="10" x2="106" y2="10" stroke="#181B16" stroke-width="2.4" opacity=".5"/><line x1="30" y1="10" x2="30" y2="3" stroke="#181B16" stroke-width="1.6" opacity=".35"/><line x1="100" y1="10" x2="100" y2="3" stroke="#181B16" stroke-width="1.6" opacity=".35"/>',
};
const propsSVG = (list) => (list || []).map((k) => PR[k] || '').join('');

const html = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
const exStart = html.indexOf('const EX={');
const exEnd = html.indexOf('};\n\n/* ---------- figure renderer');
const exLiteral = html.slice(exStart + 'const EX='.length, exEnd + 1);
const EX = vm.runInContext('(' + exLiteral + ')', vm.createContext({ P }));

function slug(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
function escXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const outDir = path.join(ROOT, 'app', 'exercises');
fs.mkdirSync(outDir, { recursive: true });
const map = {};
for (const [name, ex] of Object.entries(EX)) {
  const id = slug(name);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 130" role="img" aria-label="${escXml(name)} demonstration">
  <rect width="280" height="130" fill="#E9E4D6"/>
  <text x="66" y="14" text-anchor="middle" font-family="IBM Plex Mono, Menlo, monospace" font-size="8" letter-spacing="1.2" fill="#6C7062">START</text>
  <text x="214" y="14" text-anchor="middle" font-family="IBM Plex Mono, Menlo, monospace" font-size="8" letter-spacing="1.2" fill="#6C7062">FINISH</text>
  <g transform="translate(6,18)">
    <rect x="0" y="0" width="120" height="84" fill="#DFD9C6" stroke="#181B16" stroke-width="1.5"/>
    ${propsSVG(ex.props)}
    ${bodySVG(ex.a)}
  </g>
  <g transform="translate(154,18)">
    <rect x="0" y="0" width="120" height="84" fill="#DFD9C6" stroke="#181B16" stroke-width="1.5"/>
    ${propsSVG(ex.props)}
    ${bodySVG(ex.b)}
  </g>
  <path d="M134 58 L146 58" stroke="#47573A" stroke-width="2" stroke-linecap="round"/>
  <path d="M142 54 L148 58 L142 62" fill="none" stroke="#47573A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="140" y="122" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-size="11" font-weight="700" letter-spacing="0.5" fill="#181B16">${escXml(name.toUpperCase())}</text>
</svg>`;
  fs.writeFileSync(path.join(outDir, id + '.svg'), svg);
  map[name] = 'exercises/' + id + '.svg';
}
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(map, null, 2));
console.log('Wrote', Object.keys(map).length, 'exercise images to app/exercises/');

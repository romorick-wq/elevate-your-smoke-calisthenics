#!/usr/bin/env node
/**
 * Build short looping photo-presentation MP4s from exercise form stills.
 * Uses app/exercises/frames/<slug>-a.jpg + <slug>-b.jpg when both exist;
 * otherwise falls back to app/exercises/<slug>.jpg with a subtle zoom pulse.
 *
 * Requires: ffmpeg on PATH
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const EX = path.join(ROOT, 'app', 'exercises');
const FRAMES = path.join(EX, 'frames');
const TMP = path.join(ROOT, 'scripts', '.video-frames');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

const W = 720;
const H = 540;
const HOLD = 1.15; // seconds per still
const XFADE = 0.35;

function slugFromJpg(file) {
  return path.basename(file, '.jpg');
}

function listExercises() {
  return fs
    .readdirSync(EX)
    .filter((f) => f.endsWith('.jpg') && !f.includes('/'))
    .map(slugFromJpg)
    .filter((s) => fs.statSync(path.join(EX, s + '.jpg')).isFile())
    .sort();
}

function pairFor(slug) {
  const a = path.join(FRAMES, slug + '-a.jpg');
  const b = path.join(FRAMES, slug + '-b.jpg');
  const main = path.join(EX, slug + '.jpg');
  if (fs.existsSync(a) && fs.existsSync(b)) return { a, b, mode: 'pair' };
  if (fs.existsSync(a)) return { a, b: main, mode: 'pair' };
  return { a: main, b: main, mode: 'solo' };
}

function encodePair(a, b, outMp4) {
  // Seamless loop: A → B → A with crossfades
  const filter = [
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=30,format=yuv420p,setpts=PTS-STARTPTS[v0]`,
    `[1:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=30,format=yuv420p,setpts=PTS-STARTPTS[v1]`,
    `[2:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=30,format=yuv420p,setpts=PTS-STARTPTS[v2]`,
    `[v0][v1]xfade=transition=fade:duration=${XFADE}:offset=${HOLD}[vx]`,
    `[vx][v2]xfade=transition=fade:duration=${XFADE}:offset=${HOLD * 2}[vout]`,
  ].join(';');

  execFileSync(
    FFMPEG,
    [
      '-y',
      '-loop', '1', '-t', String(HOLD + XFADE + 0.05), '-i', a,
      '-loop', '1', '-t', String(HOLD + XFADE + 0.05), '-i', b,
      '-loop', '1', '-t', String(HOLD + 0.05), '-i', a,
      '-filter_complex', filter,
      '-map', '[vout]',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', '26',
      '-preset', 'medium',
      '-movflags', '+faststart',
      '-an',
      outMp4,
    ],
    { stdio: 'pipe' }
  );
}

function encodeSolo(img, outMp4) {
  // Slow zoom pulse on the single form photo (start feel → closer finish feel)
  const dur = 2.4;
  const filter =
    `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,` +
    `crop=${W * 2}:${H * 2},` +
    `zoompan=z='1.0+0.08*sin(2*PI*on/${Math.round(dur * 30)})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(dur * 30)}:s=${W}x${H}:fps=30,` +
    `format=yuv420p`;

  execFileSync(
    FFMPEG,
    [
      '-y',
      '-loop', '1',
      '-i', img,
      '-vf', filter,
      '-t', String(dur),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', '26',
      '-preset', 'medium',
      '-movflags', '+faststart',
      '-an',
      outMp4,
    ],
    { stdio: 'pipe' }
  );
}

const only = process.argv.slice(2);
const slugs = listExercises().filter(
  (s) => !only.length || only.includes(s)
);

fs.mkdirSync(TMP, { recursive: true });

let bytes = 0;
for (const slug of slugs) {
  const pair = pairFor(slug);
  const outMp4 = path.join(EX, slug + '.mp4');
  if (pair.mode === 'pair') encodePair(pair.a, pair.b, outMp4);
  else encodeSolo(pair.a, outMp4);
  const size = fs.statSync(outMp4).size;
  bytes += size;
  console.log('✓', slug + '.mp4', (size / 1024).toFixed(1) + ' KB', '(' + pair.mode + ')');
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log('Wrote', slugs.length, 'videos ·', (bytes / 1024 / 1024).toFixed(2), 'MB total');

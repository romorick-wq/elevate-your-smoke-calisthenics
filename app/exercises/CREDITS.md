# Exercise media credits

Elevate Your Smoke — Military Calisthenics form demos.

- `*.mp4` — short looping photo presentations (start ↔ finish stills with crossfade) from `scripts/generate-exercise-videos.js`
- `frames/<slug>-a.jpg` / `frames/<slug>-b.jpg` — local start/finish form photos used to rebuild demos (not deployed)
- `push-up.jpg` — Wikimedia Commons / U.S. military public domain (poster + frame source)
- Remaining `*.jpg` — custom male military-PT form stills used as posters and finish frames

Regenerate videos after updating frame pairs:

```bash
node scripts/generate-exercise-videos.js
```

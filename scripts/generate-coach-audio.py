#!/usr/bin/env python3
"""Generate motivational coach voice clips for Elevate Your Smoke.

Uses Microsoft Edge neural TTS (free) — warmer / more live than browser beeps
or classic macOS say. Re-run when exercise names or cue copy change.

  python3 scripts/generate-coach-audio.py
"""
from __future__ import annotations

import asyncio
import json
import re
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("Install edge-tts: python3 -m pip install --user edge-tts", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "app" / "audio" / "coach"
VOICE = "en-US-GuyNeural"  # Passion — motivational coach energy
RATE = "+6%"
PITCH = "+0Hz"

# Fixed workout cues (filename slug → spoken line)
CUES = {
    "cues-on": "Cues on. Let's elevate.",
    "three": "Three.",
    "two": "Two.",
    "one": "One.",
    "go": "Go!",
    "rest": "Rest. Breathe. Stay sharp.",
    "work": "Work.",
    "complete": "Done. Keep moving.",
    "paused": "Paused.",
    "resumed": "Resumed. Back at it.",
    "warm": "Warm-up. Loosen up. Elevate.",
    "circuit": "Circuit. Stay locked in.",
    "finisher": "Finisher. Empty the tank.",
    "cool": "Cool-down. Recover with control.",
    "last": "Last one. Finish strong.",
    "session-done": "Session complete. You elevated.",
    "session-partial": "Session ended early. Not credited.",
    "session-logged": "Session logged. Keep elevating.",
    "demo-done": "Demo finished.",
    "next": "Next up.",
}

# Motivational wrappers for each movement — short so they cut cleanly between intervals
EXERCISE_LINES = {
    "March in place": "March in place. Find your cadence.",
    "Arm circles": "Arm circles. Open those shoulders.",
    "Hip openers": "Hip openers. Controlled and clean.",
    "Shoulder rolls": "Shoulder rolls. Big circles.",
    "Standing side bend": "Standing side bend. Open the ribs.",
    "Wall push-up": "Wall push-up. Strong plank line.",
    "Incline push-up": "Incline push-up. Chest to the edge.",
    "Push-up": "Push-ups. Drive every rep.",
    "Diamond push-up": "Diamond push-ups. Elbows tight.",
    "Doorway row": "Doorway rows. Pull with the back.",
    "Table row": "Table rows. Chest to the edge.",
    "Table row, legs out": "Table rows, legs out. Hold the plank.",
    "Pull-up": "Pull-ups. Chin over the bar.",
    "Sit-to-stand": "Sit to stand. Drive through the heels.",
    "Box squat": "Box squats. Control the sit.",
    "Bodyweight squat": "Bodyweight squats. Depth and drive.",
    "Split squat": "Split squats. Own the balance.",
    "Glute bridge": "Glute bridges. Squeeze at the top.",
    "Glute bridge march": "Glute bridge march. Hips stay high.",
    "Hip hinge reach": "Hip hinge reach. Soft knees, long spine.",
    "Single-leg bridge": "Single-leg bridge. Squeeze and hold.",
    "Dead bug": "Dead bug. Slow and locked.",
    "Bird dog": "Bird dog. Reach long. Steady.",
    "Forearm plank": "Forearm plank. Brace hard.",
    "Hollow hold": "Hollow hold. Press the low back down.",
    "Fast march": "Fast march. Pick up the pace.",
    "Step-back lunge": "Step-back lunges. Soft landings.",
    "Mountain climber": "Mountain climbers. Stay light.",
    "Burpee": "Burpees. Full reset every rep.",
    "Chest doorway stretch": "Chest doorway stretch. Breathe into it.",
    "Standing hamstring stretch": "Hamstring stretch. Ease into the length.",
    "Figure-four stretch": "Figure-four stretch. Soften the hip.",
    "Child's pose": "Child's pose. Settle and breathe.",
}


def slug(name: str) -> str:
    s = name.normalize("NFKD") if hasattr(name, "normalize") else name
    # Match app exerciseSlug()
    import unicodedata

    s = unicodedata.normalize("NFKD", name)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


async def write_clip(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp.mp3")
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(str(tmp))
    tmp.replace(path)


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = []
    manifest = {"voice": VOICE, "rate": RATE, "cues": {}, "exercises": {}}

    for key, text in CUES.items():
        path = OUT / f"{key}.mp3"
        jobs.append(write_clip(path, text))
        manifest["cues"][key] = f"audio/coach/{key}.mp3"

    for name, text in EXERCISE_LINES.items():
        key = slug(name)
        # Child's pose curly apostrophe in HTML → child-s-pose
        path = OUT / f"ex-{key}.mp3"
        jobs.append(write_clip(path, text))
        manifest["exercises"][name] = f"audio/coach/ex-{key}.mp3"
        # Also map curly apostrophe variant used in HTML source
        if name == "Child's pose":
            manifest["exercises"]["Child\u2019s pose"] = f"audio/coach/ex-{key}.mp3"

    print(f"Generating {len(jobs)} clips with {VOICE}…")
    # Bound concurrency so Edge doesn't rate-limit
    sem = asyncio.Semaphore(4)

    async def guarded(coro):
        async with sem:
            await coro

    await asyncio.gather(*(guarded(j) for j in jobs))
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    total = sum(p.stat().st_size for p in OUT.glob("*.mp3"))
    print(f"Wrote {len(list(OUT.glob('*.mp3')))} mp3s ({total/1024:.0f} KB) → {OUT}")


if __name__ == "__main__":
    asyncio.run(main())

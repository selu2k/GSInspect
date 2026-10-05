"""Assemble CDP screencast frames (variable timing) into a constant-30fps H.264 clip.

usage: python3 assemble_recording.py <frames_dir> <out.mp4> <markers_out.json>
Each frame is held until the next frame's wall-clock timestamp, so the
recording plays back in real time. Markers are written relative to frame 0.
"""
import json, subprocess, sys, os

fdir, out, mout = sys.argv[1:4]
data = json.load(open(os.path.join(fdir, "frames.json")))
frames, markers = data["frames"], data["markers"]
t0 = frames[0]["t"]
lst = os.path.join(fdir, "concat.txt")
with open(lst, "w") as f:
    for a, b in zip(frames, frames[1:]):
        f.write(f"file '{a['file']}'\nduration {max(0.001, b['t'] - a['t']):.4f}\n")
    f.write(f"file '{frames[-1]['file']}'\nduration 0.5\nfile '{frames[-1]['file']}'\n")
json.dump([{"label": m["label"], "t": round(m["t"] - t0, 3)} for m in markers], open(mout, "w"), indent=1)
subprocess.run([
    "ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
    "-vf", "fps=30,scale=1920:1080:flags=lanczos,format=yuv420p",
    "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-r", "30", "-an", out,
], check=True)
print("wrote", out)

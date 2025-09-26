#!/usr/bin/env python3
import argparse, os, cv2
from wm_utils import embed_text_into_image

def main():
    ap = argparse.ArgumentParser(description="Embed text watermark into video (per-frame).")
    ap.add_argument("--input", required=True, help="Input video (mp4/avi)")
    ap.add_argument("--output", required=True, help="Output video path (.mp4 preferred)")
    ap.add_argument("--text", required=True, help="Watermark text")
    ap.add_argument("--key", required=True, help="Secret key/password")
    ap.add_argument("--q", type=float, default=12.0, help="Strength (default 12)")
    ap.add_argument("--every", type=int, default=5, help="Embed every Nth frame (default 5)")
    args = ap.parse_args()

    cap = cv2.VideoCapture(args.input)
    if not cap.isOpened():
        raise SystemExit(f"Failed to open input video: {args.input}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    w   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(args.output, fourcc, fps, (w, h))
    if not out.isOpened():
        fourcc = cv2.VideoWriter_fourcc(*"XVID")
        alt = os.path.splitext(args.output)[0] + ".avi"
        out = cv2.VideoWriter(alt, fourcc, fps, (w, h))
        if not out.isOpened():
            raise SystemExit(f"Failed to open output for write: {args.output} (and fallback {alt})")
        print(f"[warn] mp4v not available; writing AVI: {alt}")
        args.output = alt

    i = 0
    written = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if args.every > 0 and (i % args.every == 0):
            try:
                frame = embed_text_into_image(frame, args.text, args.key, q=args.q)
            except Exception:
                pass
        out.write(frame)
        written += 1
        i += 1

    cap.release()
    out.release()
    print(f"[OK] wrote {args.output} frames={written} fps={fps:.2f} size={w}x{h}")

if __name__ == "__main__":
    main()

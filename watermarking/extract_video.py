#!/usr/bin/env python3
import argparse, cv2, collections
from wm_utils import extract_text_from_image

def main():
    ap = argparse.ArgumentParser(description="Extract watermark from video by sampling frames.")
    ap.add_argument("--input", required=True, help="Watermarked video (mp4/avi)")
    ap.add_argument("--key", required=True, help="Secret key used during embedding")
    ap.add_argument("--q", type=float, default=12.0, help="Strength (must match embedding; default 12)")
    ap.add_argument("--every", type=int, default=5, help="Frames were embedded every Nth frame (default 5)")
    ap.add_argument("--max_samples", type=int, default=60, help="Max frames to sample (default 60)")
    args = ap.parse_args()

    cap = cv2.VideoCapture(args.input)
    if not cap.isOpened():
        raise SystemExit(f"Failed to open video: {args.input}")

    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
    hits = collections.Counter()
    taken = 0

    # Sample frames aligned with embedding cadence
    step = max(1, args.every)
    frame_idx = 0
    while taken < args.max_samples:
        if total and frame_idx >= total:
            break
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            break

        s = extract_text_from_image(frame, args.key, q=args.q) or ""
        if s:
            hits[s] += 1
        taken += 1
        frame_idx += step

    cap.release()

    if hits:
        text, count = hits.most_common(1)[0]
        print(text)
    else:
        print("No watermark found")

if __name__ == "__main__":
    main()

#"C:\Users\Souvik\Desktop\18th January, 2019 Presentation-2.mp4"
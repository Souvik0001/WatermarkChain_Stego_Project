#!/usr/bin/env python3
import argparse
import cv2
from wm_utils import extract_text_from_image, _debug_extract

def main():
    ap = argparse.ArgumentParser(description="Extract invisible text watermark")
    ap.add_argument("--input", required=True, help="Watermarked image (PNG recommended)")
    ap.add_argument("--key",   required=True, help="Secret key used during embedding")
    ap.add_argument("--q",     type=float, default=8.0, help="Quantization step used during embedding")
    ap.add_argument("--debug", action="store_true", help="Print header bits and decoded length")
    args = ap.parse_args()

    img = cv2.imread(args.input, cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit(f"Failed to read input image: {args.input}")

    if args.debug:
        text, hdr, n = _debug_extract(img, args.key, q=args.q)
        if hdr.size:
            print(f"[DEBUG] header bits: {''.join(map(str, hdr.tolist()))}")
            print(f"[DEBUG] decoded length: {n}")
        print(text if text else "No watermark found")
    else:
        text = extract_text_from_image(img, args.key, q=args.q)
        print(text if text else "No watermark found")

if __name__ == "__main__":
    main()

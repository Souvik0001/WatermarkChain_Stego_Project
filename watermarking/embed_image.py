#!/usr/bin/env python3
import argparse
import os
import cv2
import numpy as np

from wm_utils import embed_text_into_image, psnr


def upscale_if_small(img_bgr: np.ndarray, min_size: int, interp: str) -> np.ndarray:
    """
    If the shortest side of the image is smaller than `min_size`,
    upscale proportionally using the chosen interpolation.
    """
    if min_size <= 0:
        return img_bgr

    h, w = img_bgr.shape[:2]
    s = min(h, w)
    if s >= min_size:
        return img_bgr

    scale = float(min_size) / float(s)
    new_w = int(round(w * scale))
    new_h = int(round(h * scale))

    inter_map = {
        "nearest": cv2.INTER_NEAREST,
        "linear":  cv2.INTER_LINEAR,
        "cubic":   cv2.INTER_CUBIC,
        "lanczos": cv2.INTER_LANCZOS4,
    }
    inter = inter_map.get(interp, cv2.INTER_CUBIC)

    return cv2.resize(img_bgr, (new_w, new_h), interpolation=inter)


def main():
    ap = argparse.ArgumentParser(description="Embed invisible text watermark (DCT+QIM).")
    ap.add_argument("--input", required=True, help="Input image (png/jpg, any size)")
    ap.add_argument("--output", required=True, help="Output path (will be PNG)")
    ap.add_argument("--text", required=True, help="Watermark text (UTF-8)")
    ap.add_argument("--key", required=True, help="Secret key/password")
    ap.add_argument("--q", type=float, default=8.0, help="Strength (try 8–14 for small images)")
    # NEW: helpers for tiny images
    ap.add_argument("--min_size", type=int, default=512,
                    help="Upscale shortest side to at least this many px (0 disables). Default: 512")
    ap.add_argument("--interp", choices=["nearest", "linear", "cubic", "lanczos"],
                    default="cubic", help="Upscale interpolation (default: cubic)")
    args = ap.parse_args()

    # Load
    img = cv2.imread(args.input, cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit(f"Failed to read input image: {args.input}")

    # Optional upsample for small images
    img_in = upscale_if_small(img, args.min_size, args.interp)

    # Embed (uses your existing wm_utils implementation)
    wm = embed_text_into_image(img_in, args.text, args.key, q=args.q)

    # Always save PNG (lossless keeps watermark stronger)
    root, _ext = os.path.splitext(args.output)
    out_path = root + ".png"

    ok = cv2.imwrite(out_path, wm, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    if not ok:
        raise SystemExit(f"Failed to write output image: {out_path}")

    # PSNR vs (possibly upscaled) input
    print(f"[OK] wrote {out_path}")
    print(f"PSNR(dB): {psnr(img_in, wm):.2f}")


if __name__ == "__main__":
    main()

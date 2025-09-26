# wm_utils.py
# Robust invisible watermark:
# - 8x8 block DCT on Y channel
# - FIXED mid-frequency coefficient (u,v) = (3,2) per block
# - One deterministic permutation of all blocks from SHA-256(key)
# - Centered, symmetric QIM (no bias) + redundancy REPEAT=9 with majority vote

import cv2
import numpy as np
import hashlib
import math
from typing import Tuple

REPEAT = 9            # redundancy (majority vote on extract)
HEADER_BITS = 16      # 2-byte big-endian length
UV = (3, 2)           # fixed mid-frequency tap per 8x8 block


# ------------------------------ utilities ------------------------------

def psnr(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float64)
    b = b.astype(np.float64)
    mse = np.mean((a - b) ** 2)
    if mse == 0:
        return 99.0
    return 20.0 * math.log10(255.0 / math.sqrt(mse))

def _to_bits_with_len_prefix(text: str) -> np.ndarray:
    data = text.encode("utf-8")
    n = len(data)
    if n > 65535:
        raise ValueError("Watermark text too long (max 65535 bytes).")
    hdr = n.to_bytes(2, "big")
    payload = hdr + data
    return np.unpackbits(np.frombuffer(payload, dtype=np.uint8), bitorder="big").astype(np.uint8)

def _from_bits_with_len_prefix(bits: np.ndarray) -> str:
    if bits.size < HEADER_BITS:
        return ""
    first2 = np.packbits(bits[:HEADER_BITS], bitorder="big").tobytes()
    n = int.from_bytes(first2, "big")
    need = HEADER_BITS + n * 8
    if n < 0 or need > bits.size:
        return ""
    body = np.packbits(bits[HEADER_BITS:need], bitorder="big").tobytes()
    try:
        return body.decode("utf-8")
    except Exception:
        return ""

def _seed_from_key32(key: str) -> int:
    return int.from_bytes(hashlib.sha256(key.encode("utf-8")).digest()[:4], "big")

def _perm_of_blocks(num_blocks: int, key: str) -> np.ndarray:
    """Deterministic permutation [0..num_blocks-1] using a 32-bit seed."""
    seed = _seed_from_key32(key)
    rng = np.random.RandomState(seed)
    return rng.permutation(num_blocks).astype(np.int64)

# -------- Centered, symmetric QIM (fixes 'all 1s' bias) --------

def _qim_embed(coeff: float, bit: int, q: float) -> float:
    """
    Centered QIM:
      - Quantize coefficient to nearest multiple of q (k * q)
      - Ensure parity(k) == bit by nudging k by ±1 toward the sign of coeff
    This is symmetric around 0 and avoids bias.
    """
    k = int(np.rint(coeff / q))         # nearest integer index
    if (k & 1) != int(bit):
        k += 1 if coeff >= 0 else -1    # move one bin toward the sign
    return float(k * q)

def _qim_decode(coeff: float, q: float) -> int:
    """Decode bit from the parity of the nearest quantization index."""
    k = int(np.rint(coeff / q))
    return k & 1


# ------------------------------ core API ------------------------------

def embed_text_into_image(img_bgr: np.ndarray, text: str, key: str, q: float = 8.0) -> np.ndarray:
    if img_bgr.ndim != 3 or img_bgr.shape[2] != 3:
        raise ValueError("Expected BGR image (H,W,3).")

    h, w = img_bgr.shape[:2]
    ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
    y = ycrcb[:, :, 0].astype(np.float32)

    # pad to multiple of 8
    ph = (8 - (h % 8)) % 8
    pw = (8 - (w % 8)) % 8
    if ph or pw:
        y = cv2.copyMakeBorder(y, 0, ph, 0, pw, cv2.BORDER_REPLICATE)
    H, W = y.shape

    bits = _to_bits_with_len_prefix(text)
    total_writes = int(bits.size) * REPEAT

    num_blocks = (H // 8) * (W // 8)
    if num_blocks == 0:
        raise ValueError("Image too small to embed watermark.")
    if total_writes > num_blocks:
        raise ValueError(f"Message too large: need {total_writes} blocks, have {num_blocks}.")

    perm = _perm_of_blocks(num_blocks, key)
    coords = [(i, j) for i in range(0, H, 8) for j in range(0, W, 8)]

    Y = y.copy()
    q = float(q)
    u, v = UV

    pos = 0
    for b in bits:
        for _ in range(REPEAT):
            bidx = int(perm[pos]); pos += 1
            bi, bj = coords[bidx]
            blk = Y[bi:bi + 8, bj:bj + 8]
            dct = cv2.dct(blk)
            dct[u, v] = _qim_embed(float(dct[u, v]), int(b), q)
            Y[bi:bi + 8, bj:bj + 8] = cv2.idct(dct)

    Y = Y[:h, :w]
    ycrcb[:, :, 0] = np.clip(Y, 0, 255).astype(np.uint8)
    return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)

def extract_text_from_image(img_bgr: np.ndarray, key: str, bit_count_hint: int = 4096, q: float = 8.0) -> str:
    text, _hdr, _n = _extract_core(img_bgr, key, q)
    return text

# Debug helper (optional): returns (text, header_bits, decoded_length)
def _debug_extract(img_bgr: np.ndarray, key: str, q: float = 8.0) -> Tuple[str, np.ndarray, int]:
    return _extract_core(img_bgr, key, q)

# Always returns a tuple so callers never get a plain string on error
def _extract_core(img_bgr: np.ndarray, key: str, q: float) -> Tuple[str, np.ndarray, int]:
    if img_bgr.ndim != 3 or img_bgr.shape[2] != 3:
        return ("", np.zeros(0, dtype=np.uint8), -1)

    h, w = img_bgr.shape[:2]
    ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
    y = ycrcb[:, :, 0].astype(np.float32)

    ph = (8 - (h % 8)) % 8
    pw = (8 - (w % 8)) % 8
    if ph or pw:
        y = cv2.copyMakeBorder(y, 0, ph, 0, pw, cv2.BORDER_REPLICATE)
    H, W = y.shape

    num_blocks = (H // 8) * (W // 8)
    if num_blocks == 0:
        return ("", np.zeros(0, dtype=np.uint8), -1)

    perm = _perm_of_blocks(num_blocks, key)
    coords = [(i, j) for i in range(0, H, 8) for j in range(0, W, 8)]
    q = float(q); u, v = UV

    def read_bits(n_bits: int, start_pos: int) -> np.ndarray:
        if start_pos + n_bits * REPEAT > len(perm):
            return np.array([], dtype=np.uint8)
        raw = np.empty((n_bits, REPEAT), dtype=np.uint8)
        pos = start_pos
        for bi in range(n_bits):
            for r in range(REPEAT):
                bidx = int(perm[pos]); pos += 1
                pi, pj = coords[bidx]
                dct = cv2.dct(y[pi:pi + 8, pj:pj + 8])
                raw[bi, r] = _qim_decode(float(dct[u, v]), q)
        return (raw.sum(axis=1) >= (REPEAT // 2 + 1)).astype(np.uint8)

    # 1) header
    header_bits = read_bits(HEADER_BITS, 0)
    if header_bits.size != HEADER_BITS:
        return ("", header_bits, -1)
    first2 = np.packbits(header_bits, bitorder="big").tobytes()
    n = int.from_bytes(first2, "big")
    if n < 0 or n > 65535:
        return ("", header_bits, n)

    # 2) payload
    start_payload = HEADER_BITS * REPEAT
    payload_bits = read_bits(8 * n, start_pos=start_payload)
    if payload_bits.size != 8 * n:
        return ("", header_bits, n)

    all_bits = np.concatenate([header_bits, payload_bits], axis=0)
    text = _from_bits_with_len_prefix(all_bits)
    return (text, header_bits, n)

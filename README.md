# Hybrid Blockchain-Based Invisible Watermarking (Images & Video)

A complete, minimal project you can run locally:
- **Python**: robust-ish *invisible* watermark (DCT + QIM) for **images**, applied per-frame for **videos**.
- **Node/Express**: APIs to embed/extract and to **register/verify** files on-chain.
- **Solidity (Hardhat)**: `Registry.sol` that stores a `bytes32 sha256(file)` hash with owner & timestamp on **Polygon Amoy** testnet.
- **React (Vite)**: tiny UI to exercise the flow.

> ⚠️ This watermark is designed for *demo/education*. It's reasonably imperceptible, survives light compression/resizing, but not a research-grade system. Document limits in your report.

---

## 0) Requirements

- Python 3.10+
- Node 18+
- (Optional) ffmpeg if you need more video codecs

---

## 1) Python watermarking

```bash
cd watermarking
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Image embed/extract
python embed_image.py --input tests.jpg --output out.png --text "Owned by Souvik" --key mysecret --q 8
python extract_image.py --input out.png --key mysecret --q 8

# Video embed/extract
python embed_video.py --input in.mp4 --output out.mp4 --text "Owned by Souvik" --key mysecret --q 8 --every 10
python extract_video.py --input out.mp4 --key mysecret --q 8 --sample 40 --step 10
```

---

## 2) Smart contract (Hardhat) on Polygon Amoy

```bash
cd contracts
cp .env.example .env    # add AMOY_RPC_URL and PRIVATE_KEY
npm i
npm run build
npm run deploy:amoy
# Note the deployed address; you'll need it in the server .env
```

---

## 3) Node/Express API

```bash
cd server
cp .env.example .env
# Fill CONTRACT_ADDRESS from the deploy step. Adjust RPC_URL/PRIVATE_KEY too.
npm i
npm run start  # runs on :4000
```

**Endpoints** (multipart/form-data):
- `POST /api/watermark/image` fields: `file`, `text`, `key`, `q`
- `POST /api/watermark/image/extract` fields: `file`, `key`, `q`
- `POST /api/watermark/video` fields: `file`, `text`, `key`, `q`, `every`
- `POST /api/register` fields: `file`, `note` (hash = sha256(file))
- `POST /api/verify` fields: `file`

---

## 4) React UI

```bash
cd web
npm i
npm run dev  # :5173 with proxy to server :4000
```

Open http://localhost:5173

---

## 5) How it works (short)

- **Invisible watermark:** Convert image to YCrCb, DCT the Y (luminance), and use **QIM** on randomly selected *mid-frequency* coefficients. The random selection is seeded by your `key`. For video, watermark every Nth frame.
- **On-chain proof:** Compute `sha256` of the (watermarked) file and store it in a small **Registry** contract on Polygon Amoy with your address + timestamp. To verify later, re-hash any candidate file and look it up in the contract. Optionally also run the extractor to confirm the hidden text.

---

## 6) Limits & notes

- Heavy crops/filters/generative re-renders can break extraction.
- Choose a consistent `key` and `q` for embedding/extraction.
- This is an educational baseline; discuss improvements (DWT+DCT, redundancy codes, sync markers, multi-band embedding) in your report.

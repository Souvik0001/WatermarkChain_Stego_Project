// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createHash } from 'crypto';
import { spawn } from 'child_process';
import { ethers } from 'ethers';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

// ---------- config ----------
const upload = multer({
  dest: 'uploads/',
  // Raise server-side upload cap (adjust as needed)
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
});

// Prefer .env override; otherwise pick a sensible default per OS
// On Windows, set PYTHON_BIN="py -3.11" in .env for best results
const PYTHON_BIN =
  process.env.PYTHON_BIN ||
  (process.platform === 'win32' ? 'python' : 'python3');

const WATERMARK_DIR = process.env.WATERMARK_DIR || '../watermarking';

// ---------- blockchain (optional) ----------
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

let provider, wallet, contract;
let abi;
try {
  const abiPath = path.join(process.cwd(), 'Registry.abi.json');
  abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
} catch {
  abi = null;
}

if (RPC_URL && PRIVATE_KEY && CONTRACT_ADDRESS && abi) {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
}

// ---------- helpers ----------
function runPy(script, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(WATERMARK_DIR, script);
    // NOTE: if PYTHON_BIN contains a space (e.g., "py -3.11"), spawn with { shell:true }
    const useShell = /\s/.test(PYTHON_BIN);
    const proc = spawn(PYTHON_BIN, [scriptPath, ...args], { shell: useShell });

    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => (out += d.toString()));
    proc.stderr.on('data', (d) => (err += d.toString()));
    proc.on('close', (code) => {
      if (code === 0) return resolve(out.trim());
      const msg = err || `Python exited with code ${code}`;
      reject(new Error(msg));
    });
  });
}

// small helper so we always have a numeric q
function normalizeQ(q) {
  const n = Number(q);
  if (Number.isFinite(n) && n > 0) return String(n);
  return '12'; // default
}

// ---------- routes ----------

// IMAGE: embed
app.post('/api/watermark/image', upload.single('file'), async (req, res) => {
  try {
    const { text = '', key = 'secret', q } = req.body;
    if (!req.file) return res.status(400).json({ error: 'file required' });

    // always output PNG for robustness
    const outPath = `${req.file.path}_wm.png`;

    const args = [
      '--input', req.file.path,
      '--output', outPath,
      '--text', text,
      '--key', key,
      '--q', normalizeQ(q),
      '--min_size', '512', // critical for small uploads
    ];

    await runPy('embed_image.py', args);
    res.sendFile(path.resolve(outPath)); // client receives a PNG
  } catch (e) {
    console.error('IMAGE EMBED ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// IMAGE: extract
app.post('/api/watermark/image/extract', upload.single('file'), async (req, res) => {
  try {
    const { key = 'secret', q } = req.body;
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const args = [
      '--input', req.file.path,
      '--key', key,
      '--q', normalizeQ(q),
    ];

    const text = await runPy('extract_image.py', args);
    res.json({ text });
  } catch (e) {
    console.error('IMAGE EXTRACT ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// VIDEO: embed (frame-wise; parameters passed through)
app.post('/api/watermark/video', upload.single('file'), async (req, res) => {
  try {
    const { text = '', key = 'secret', q, every } = req.body;
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const outPath = `${req.file.path}_wm.mp4`;
    const args = [
      '--input', req.file.path,
      '--output', outPath,
      '--text', text,
      '--key', key,
      '--q', normalizeQ(q),
    ];
    if (every) args.push('--every', String(every));

    await runPy('embed_video.py', args);
    res.sendFile(path.resolve(outPath));
  } catch (e) {
    console.error('VIDEO EMBED ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// VIDEO: extract (sample frames & majority vote)
app.post('/api/watermark/video/extract', upload.single('file'), async (req, res) => {
  try {
    const { key = 'secret', q, every, max_samples } = req.body;
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const args = [
      '--input', req.file.path,
      '--key', key,
      '--q', normalizeQ(q),
    ];
    if (every)       args.push('--every', String(every));
    if (max_samples) args.push('--max_samples', String(max_samples));

    const text = await runPy('extract_video.py', args);
    res.json({ text });
  } catch (e) {
    console.error('VIDEO EXTRACT ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Register hash on-chain
app.post('/api/register', upload.single('file'), async (req, res) => {
  try {
    if (!contract) return res.status(400).json({ error: 'Blockchain not configured' });
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const { note = '' } = req.body;
    const buf = fs.readFileSync(req.file.path);
    const hashHex = createHash('sha256').update(buf).digest('hex');
    const hashBytes32 = '0x' + hashHex;

    const tx = await contract.register(hashBytes32, note);
    const receipt = await tx.wait();
    res.json({ hash: hashBytes32, txHash: receipt.transactionHash });
  } catch (e) {
    console.error('REGISTER ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Verify by hash lookup
app.post('/api/verify', upload.single('file'), async (req, res) => {
  try {
    if (!contract) return res.status(400).json({ error: 'Blockchain not configured' });
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const buf = fs.readFileSync(req.file.path);
    const hashHex = createHash('sha256').update(buf).digest('hex');
    const hashBytes32 = '0x' + hashHex;

    const rec = await contract.get(hashBytes32);
    const exists = rec.owner && rec.owner !== ethers.ZeroAddress;

    res.json({
      exists,
      hash: hashBytes32,
      owner: rec.owner,
      timestamp: Number(rec.timestamp || 0),
      note: rec.note || '',
    });
  } catch (e) {
    console.error('VERIFY ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
  console.log(`Python: ${PYTHON_BIN} | Watermark dir: ${WATERMARK_DIR}`);
});

"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { DropZone } from "@/components/DropZone";
import { Clapperboard, KeyRound, Search } from "lucide-react";

export default function VideoExtract() {
  const [file, setFile] = useState<File | null>(null);
  const [key, setKey] = useState("");
  const [q, setQ] = useState<number>(Number(process.env.NEXT_PUBLIC_DEFAULT_Q || 12));
  const [every, setEvery] = useState<number>(5);
  const [maxSamples, setMaxSamples] = useState<number>(60);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExtract() {
    try {
      setError(null);
      setText("");
      if (!file) throw new Error("Please choose a video");
      if (!key) throw new Error("Please enter the key used for embedding");
      setBusy(true);

      const res = await api.extractVideo(file, key, q, every, maxSamples);
      if (!res.success) throw new Error(res.error || "Failed to extract video watermark");
      setText(res.text || "(No watermark found)");
    } catch (e: any) {
      setError(e.message || "Failed to extract video watermark");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass rounded-xl p-6 space-y-5">
      {/* Card header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/90 to-secondary/80 flex items-center justify-center">
          <Clapperboard className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Extract Video</h3>
          <p className="text-sm text-muted-foreground">Reveal hidden watermark text from a watermarked video.</p>
        </div>
      </div>

      {/* Drop area */}
      <DropZone
        onFileSelect={setFile}
        file={file}
        accept="video/mp4,video/x-msvideo,video/*"
        disabled={busy}
        maxSize={200 * 1024 * 1024}
      />

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative md:col-span-2">
          <div className="absolute left-3 top-2.5 text-muted-foreground">
            <KeyRound className="w-4 h-4" />
          </div>
          <input
            className="w-full rounded-md bg-neutral-900 pl-9 pr-3 py-2 outline-none"
            placeholder="Key (password)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Strength (q)</span>
          <span className="font-mono">{q}</span>
        </div>
        <input
          type="range"
          min={10}
          max={16}
          step={1}
          value={q}
          onChange={(e) => setQ(Number(e.target.value))}
          className="w-full accent-white"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Subtle (10)</span>
          <span>Balanced (12)</span>
          <span>Strong (16)</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Frames were embedded every</span>
          <span className="font-mono">{every}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={every}
          onChange={(e) => setEvery(Number(e.target.value))}
          className="w-full accent-white"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Every frame</span>
          <span>Every 5th</span>
          <span>Every 10th</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Max frames to sample</span>
          <span className="font-mono">{maxSamples}</span>
        </div>
        <input
          type="range"
          min={20}
          max={180}
          step={10}
          value={maxSamples}
          onChange={(e) => setMaxSamples(Number(e.target.value))}
          className="w-full accent-white"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Fast</span>
          <span>Balanced</span>
          <span>Thorough</span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onExtract}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary/90 text-primary-foreground px-4 py-3 hover:bg-primary disabled:opacity-50"
      >
        <Search className="w-4 h-4" />
        {busy ? "Extracting..." : "Extract Watermark"}
      </button>

      {/* Result / errors */}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!!text && (
        <div className="rounded-md bg-neutral-900 p-3">
          <div className="opacity-70 text-xs">Extracted Text</div>
          <div className="mt-1 font-mono text-sm whitespace-pre-wrap break-words">{text}</div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Use the same key, strength (q), and “every” values that were used during embedding.
      </p>
    </div>
  );
}

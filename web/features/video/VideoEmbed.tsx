"use client";

import { useState } from "react";
import { api, downloadBlob } from "@/lib/api";
import { DropZone } from "@/components/DropZone";
import { Clapperboard, KeyRound, Type, Download } from "lucide-react";

export default function VideoEmbed() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [key, setKey] = useState("");
  const [q, setQ] = useState<number>(Number(process.env.NEXT_PUBLIC_DEFAULT_Q || 12));
  const [every, setEvery] = useState<number>(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onEmbed() {
    try {
      setError(null);
      if (!file) throw new Error("Please choose a video");
      if (!key) throw new Error("Please enter a key (password)");
      setBusy(true);

      const res = await api.embedVideo(file, text, key, q, every);
      if (!res.success || !res.data) throw new Error(res.error || "Failed to embed video");

      const base = (file.name || "video").replace(/\.(mp4|mov|avi|mkv)$/i, "");
      downloadBlob(res.data, `watermarked_${base}.mp4`);
    } catch (e: any) {
      setError(e.message || "Failed to embed video");
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
          <h3 className="text-xl font-semibold">Embed Video</h3>
          <p className="text-sm text-muted-foreground">Add invisible watermark text to your video.</p>
        </div>
      </div>

      {/* Drop area */}
      <DropZone
        onFileSelect={setFile}
        file={file}
        accept="video/mp4,video/x-msvideo,video/*"
        disabled={busy}
      />

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <div className="absolute left-3 top-2.5 text-muted-foreground">
            <Type className="w-4 h-4" />
          </div>
          <input
            className="w-full rounded-md bg-neutral-900 pl-9 pr-3 py-2 outline-none"
            placeholder="Watermark text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="relative">
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
          <span className="text-muted-foreground">Embed every Nth frame</span>
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

      {/* CTA */}
      <button
        onClick={onEmbed}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary/90 text-primary-foreground px-4 py-3 hover:bg-primary disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {busy ? "Embedding..." : "Embed & Download"}
      </button>

      {/* Helper / errors */}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Use the same key, strength (q), and “every” values when extracting.
      </p>
    </div>
  );
}

import VideoEmbed from "@/features/video/VideoEmbed";
import VideoExtract from "@/features/video/VideoExtract";

export default function VideoPage() {
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      <section>
        <h1 className="text-2xl font-semibold mb-2">Video Watermark</h1>
        <p className="opacity-70 text-sm">
          Embed & extract invisible watermarks from video files using the same key and strength.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 p-4">
          <h2 className="font-medium mb-3">Embed Video</h2>
          <VideoEmbed />
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <h2 className="font-medium mb-3">Extract Video</h2>
          <VideoExtract />
        </div>
      </section>
    </main>
  );
}

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Wand2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { DropZone } from "@/components/DropZone"
import { Preview } from "@/components/Preview"
import { api } from "@/lib/api"

export function ImageEmbed() {
  const [file, setFile] = useState<File | null>(null)
  const [watermarkText, setWatermarkText] = useState("")
  const [key, setKey] = useState("")
  const [strength, setStrength] = useState([Number(process.env.NEXT_PUBLIC_DEFAULT_Q || 12)])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ blob: Blob; psnr?: number } | null>(null)
  const { toast } = useToast()

  const handleEmbed = async () => {
    if (!file || !watermarkText.trim() || !key.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide an image, watermark text, and key",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    try {
      const response = await api.embedWatermark(file, watermarkText, key, strength[0])

      clearInterval(progressInterval)
      setProgress(100)

      if (response.success && response.data) {
        setResult({
          blob: response.data,
          psnr: 35.2 + Math.random() * 10, // Mock PSNR value
        })
        toast({
          title: "Success!",
          description: "Watermark embedded successfully",
        })
      } else {
        throw new Error(response.error || "Failed to embed watermark")
      }
    } catch (error) {
      clearInterval(progressInterval)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to embed watermark",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const handleDownload = () => {
    if (!result) return

    const url = URL.createObjectURL(result.blob)
    const a = document.createElement("a")
    a.href = url
    const base = (file?.name || "image").replace(/\.(png|jpg|jpeg)$/i, "")
    a.download = `watermarked_${base}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: "Watermarked image saved to your device",
    })
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setWatermarkText("")
    setKey("")
    setStrength([Number(process.env.NEXT_PUBLIC_DEFAULT_Q || 12)])
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Embed Watermark</h2>
            <p className="text-sm text-muted-foreground">Add invisible watermark to your image</p>
          </div>
        </div>

        <div className="space-y-6">
          <DropZone
            onFileSelect={setFile}
            file={file}
            accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/jpg,image/pjpeg,image/*"
            disabled={isProcessing}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="watermark-text">Watermark Text</Label>
              <Input
                id="watermark-text"
                placeholder="Enter text to embed..."
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                disabled={isProcessing}
                className="glass"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Key (Password)</Label>
              <Input
                id="key"
                type="password"
                placeholder="Enter encryption key..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={isProcessing}
                className="glass"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Strength (q)</Label>
              <span className="text-sm text-muted-foreground font-mono">{strength[0]}</span>
            </div>
            <Slider
              value={strength}
              onValueChange={setStrength}
              min={2}
              max={16}
              step={1}
              disabled={isProcessing}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtle (2)</span>
              <span>Balanced (8)</span>
              <span>Strong (16)</span>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing watermark...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleEmbed}
              disabled={!file || !watermarkText.trim() || !key.trim() || isProcessing}
              className="flex-1 gap-2 glow-primary"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Embedding...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Embed Watermark
                </>
              )}
            </Button>

            {(file || result) && (
              <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {result && file && (
        <Preview originalFile={file} watermarkedBlob={result.blob} psnr={result.psnr} onDownload={handleDownload} />
      )}
    </div>
  )
}

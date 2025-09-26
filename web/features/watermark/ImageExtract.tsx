"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { TextSearch, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { DropZone } from "@/components/DropZone"
import { ResultCard } from "@/components/ResultCard"
import { api } from "@/lib/api"

export function ImageExtract() {
  const [file, setFile] = useState<File | null>(null)
  const [key, setKey] = useState("")
  const [strength, setStrength] = useState([Number(process.env.NEXT_PUBLIC_DEFAULT_Q || 12)])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ text: string } | null>(null)
  const { toast } = useToast()

  const handleExtract = async () => {
    if (!file || !key.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide an image and key",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 15, 90))
    }, 150)

    try {
      const response = await api.extractWatermark(file, key, strength[0])

      clearInterval(progressInterval)
      setProgress(100)

      if (response.success) {
        setResult({
          text: response.text || "No watermark found",
        })
        toast({
          title: response.text ? "Success!" : "No Watermark",
          description: response.text ? "Watermark extracted successfully" : "No watermark found in this image",
          variant: response.text ? "default" : "destructive",
        })
      } else {
        throw new Error(response.error || "Failed to extract watermark")
      }
    } catch (error) {
      clearInterval(progressInterval)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extract watermark",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setKey("")
    setStrength([8])
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
            <TextSearch className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Extract Watermark</h2>
            <p className="text-sm text-muted-foreground">Extract hidden text from watermarked image</p>
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
              <Label htmlFor="extract-key">Key (Password)</Label>
              <Input
                id="extract-key"
                type="password"
                placeholder="Enter decryption key..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={isProcessing}
                className="glass"
              />
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
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Extracting watermark...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleExtract}
              disabled={!file || !key.trim() || isProcessing}
              className="flex-1 gap-2 glow-secondary"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <TextSearch className="w-4 h-4" />
                  Extract Watermark
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

      {result && <ResultCard type="extract" data={result} />}
    </div>
  )
}

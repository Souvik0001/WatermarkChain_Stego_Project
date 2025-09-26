"use client"

import React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download } from "lucide-react"

interface PreviewProps {
  originalFile: File
  watermarkedBlob: Blob
  psnr?: number
  onDownload: () => void
  className?: string
}

export function Preview({ originalFile, watermarkedBlob, psnr, onDownload, className = "" }: PreviewProps) {
  const [showBefore, setShowBefore] = useState(false)
  const [originalUrl, setOriginalUrl] = useState<string>("")
  const [watermarkedUrl, setWatermarkedUrl] = useState<string>("")

  // Create object URLs when component mounts
  React.useEffect(() => {
    const origUrl = URL.createObjectURL(originalFile)
    const waterUrl = URL.createObjectURL(watermarkedBlob)

    setOriginalUrl(origUrl)
    setWatermarkedUrl(waterUrl)

    return () => {
      URL.revokeObjectURL(origUrl)
      URL.revokeObjectURL(waterUrl)
    }
  }, [originalFile, watermarkedBlob])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl p-6 space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Preview</h3>
          <p className="text-sm text-muted-foreground">Watermark embedded successfully</p>
        </div>
        {psnr && (
          <Badge variant="outline" className="font-mono">
            PSNR: {psnr.toFixed(2)} dB
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant={!showBefore ? "default" : "outline"} size="sm" onClick={() => setShowBefore(false)}>
            After
          </Button>
          <Button variant={showBefore ? "default" : "outline"} size="sm" onClick={() => setShowBefore(true)}>
            Before
          </Button>
        </div>

        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/20 border">
          <motion.img
            key={showBefore ? "before" : "after"}
            src={showBefore ? originalUrl : watermarkedUrl}
            alt={showBefore ? "Original image" : "Watermarked image"}
            className="w-full h-full object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <Button onClick={onDownload} className="w-full gap-2">
          <Download className="w-4 h-4" />
          Download Watermarked Image
        </Button>
      </div>
    </motion.div>
  )
}

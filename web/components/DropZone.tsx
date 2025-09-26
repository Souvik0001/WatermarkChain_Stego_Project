"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { motion } from "framer-motion"
import { UploadCloud, X, FileImage } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/lib/format"

interface DropZoneProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
  disabled?: boolean
  file?: File | null
  className?: string
}

export function DropZone({
  onFileSelect,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  file = null,
  className = "",
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback(
    (file: File): boolean => {
      setError(null)

      if (file.size > maxSize) {
        setError(`File size must be less than ${formatFileSize(maxSize)}`)
        return false
      }

      // if (accept && !file.type.match(accept.replace("*", ".*"))) {
      //   setError(`File type not supported. Please select ${accept}`)
      //   return false
      // }

      if (accept) {
        const list = accept.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
        const mime = (file.type || "").toLowerCase()
        const name = (file.name || "").toLowerCase()
        const ext = name.split(".").pop()

        // does MIME or extension match any accept item?
        const matchesAccept = list.some(p => {
          if (p.includes("/")) {
            // MIME pattern (supports wildcards like image/*)
            const rx = new RegExp("^" + p.replace(/\*/g, ".*") + "$")
            return rx.test(mime)
          }
          // extension item like .png or .jpg
          return p.startsWith(".") && ext ? p.slice(1) === ext : false
        })

        // extra friendly fallbacks for Windows oddities
        const commonFallback =
          mime === "image/jpeg" ||
          mime === "image/jpg" ||
          mime === "image/pjpeg" ||
          (ext && ["jpg", "jpeg", "png", "jfif"].includes(ext))

        if (!(matchesAccept || commonFallback)) {
          setError(`File type not supported. Please select ${accept}`)
          return false
        }
      }

      return true
    },
    [accept, maxSize],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      const file = files[0]

      if (file && validateFile(file)) {
        onFileSelect(file)
      }
    },
    [disabled, onFileSelect, validateFile],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && validateFile(file)) {
        onFileSelect(file)
      }
      // Reset input
      e.target.value = ""
    },
    [onFileSelect, validateFile],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) setIsDragOver(true)
    },
    [disabled],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const clearFile = useCallback(() => {
    setError(null)
    onFileSelect(null as any) // Clear the file
  }, [onFileSelect])

  return (
    <div className={`space-y-4 ${className}`}>
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${
            isDragOver && !disabled
              ? "border-primary bg-primary/5 glow-primary"
              : "border-border hover:border-primary/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${file ? "glass-strong" : "glass"}
        `}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {file ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
              <FileImage className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                clearFile()
              }}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <motion.div
              className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10"
              animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
            >
              <UploadCloud className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <p className="text-lg font-medium text-foreground">
                {isDragOver ? "Drop your file here" : "Drag & drop your file"}
              </p>
              <p className="text-sm text-muted-foreground">
                or <span className="text-primary font-medium">click to browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Max size: {formatFileSize(maxSize)} • {accept}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
        >
          {error}
        </motion.div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ShieldCheck, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { DropZone } from "@/components/DropZone"
import { ResultCard } from "@/components/ResultCard"
import { api } from "@/lib/api"

export function Verify() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    exists: boolean
    hash?: string
    owner?: string
    timestamp?: number
    note?: string
  } | null>(null)
  const { toast } = useToast()

  const handleVerify = async () => {
    if (!file) {
      toast({
        title: "Missing File",
        description: "Please select a file to verify",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 12, 90))
    }, 200)

    try {
      const response = await api.verifyFile(file)

      clearInterval(progressInterval)
      setProgress(100)

      if (response.success) {
        setResult({
          exists: response.exists || false,
          hash: response.hash,
          owner: response.owner,
          timestamp: response.timestamp,
          note: response.note,
        })

        toast({
          title: response.exists ? "File Found!" : "File Not Found",
          description: response.exists
            ? "File is registered on blockchain"
            : "This file is not registered on blockchain",
          variant: response.exists ? "default" : "destructive",
        })
      } else {
        throw new Error(response.error || "Failed to verify file")
      }
    } catch (error) {
      clearInterval(progressInterval)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify file",
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
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Verify by Hash</h2>
            <p className="text-sm text-muted-foreground">Check if your file is registered on blockchain</p>
          </div>
        </div>

        <div className="space-y-6">
          <DropZone
            onFileSelect={setFile}
            file={file}
            accept="image/*,video/*,.pdf,.doc,.docx"
            maxSize={50 * 1024 * 1024} // 50MB
            disabled={isProcessing}
          />

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Verifying on blockchain...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground">Checking blockchain records for this file</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleVerify}
              disabled={!file || isProcessing}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
              style={{ boxShadow: "0 0 20px rgba(34, 197, 94, 0.3)" }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Verify File
                </>
              )}
            </Button>

            {(file || result) && (
              <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
                Reset
              </Button>
            )}
          </div>

          <div className="bg-muted/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              How Verification Works
            </div>
            <p className="text-xs text-muted-foreground">
              We calculate a cryptographic hash of your file and check if it exists on the blockchain. The file itself
              is never uploaded - only its unique fingerprint is verified.
            </p>
          </div>
        </div>
      </motion.div>

      {result && <ResultCard type="verify" data={result} />}
    </div>
  )
}

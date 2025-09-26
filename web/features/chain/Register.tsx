"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Stamp, Loader2, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { DropZone } from "@/components/DropZone"
import { ResultCard } from "@/components/ResultCard"
import { api } from "@/lib/api"

export function Register() {
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ hash: string; txHash: string } | null>(null)
  const [showBlockchainWarning, setShowBlockchainWarning] = useState(true)
  const [blockchainConfigured] = useState(false) // Mock: blockchain not configured
  const { toast } = useToast()

  const handleRegister = async () => {
    if (!file) {
      toast({
        title: "Missing File",
        description: "Please select a file to register",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 8, 85))
    }, 300)

    try {
      const response = await api.registerFile(file, note)

      clearInterval(progressInterval)
      setProgress(100)

      if (response.success && response.hash && response.txHash) {
        setResult({
          hash: response.hash,
          txHash: response.txHash,
        })

        // Trigger confetti effect
        const confetti = (await import("canvas-confetti")).default
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#00E6FE", "#8A2BE2", "#22c55e"],
        })

        toast({
          title: "Success!",
          description: "File registered on blockchain successfully",
        })
      } else {
        throw new Error(response.error || "Failed to register file")
      }
    } catch (error) {
      clearInterval(progressInterval)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register file",
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
    setNote("")
  }

  return (
    <div className="space-y-6">
      {!blockchainConfigured && showBlockchainWarning && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert className="glass border-yellow-500/20 bg-yellow-500/5">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="flex items-center justify-between">
              <span>Blockchain not configured — watermarking still works.</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 text-yellow-500 hover:text-yellow-400"
                onClick={() => setShowBlockchainWarning(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Stamp className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Register On-Chain</h2>
            <p className="text-sm text-muted-foreground">Create immutable proof of your file on blockchain</p>
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

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Input
              id="note"
              placeholder="Add a note about this file..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isProcessing}
              className="glass"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{note.length}/200 characters</p>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Registering on blockchain...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                This may take a few moments while the transaction is processed
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleRegister}
              disabled={!file || isProcessing}
              className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              style={{ boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)" }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Stamp className="w-4 h-4" />
                  Register File
                </>
              )}
            </Button>

            {(file || result) && (
              <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
                Reset
              </Button>
            )}
          </div>

          {!blockchainConfigured && (
            <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
              <p className="font-medium mb-1">Demo Mode</p>
              <p>
                This is a demonstration. In production, files would be registered on a real blockchain network like
                Ethereum or Polygon.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {result && <ResultCard type="register" data={result} />}
    </div>
  )
}

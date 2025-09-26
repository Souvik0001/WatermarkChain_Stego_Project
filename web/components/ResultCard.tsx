"use client"

import { motion } from "framer-motion"
import { CheckCircle2, CircleAlert, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { truncateAddress, formatTimestamp } from "@/lib/format"

interface ResultCardProps {
  type: "extract" | "register" | "verify"
  data: any
  className?: string
}

export function ResultCard({ type, data, className = "" }: ResultCardProps) {
  const { toast } = useToast()

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      })
    }
  }

  const openBlockExplorer = (txHash: string) => {
    // This would open the actual block explorer in a real implementation
    window.open(`https://etherscan.io/tx/${txHash}`, "_blank")
  }

  if (type === "extract") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass rounded-xl p-6 space-y-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold">Watermark Extracted</h3>
            <p className="text-sm text-muted-foreground">Successfully extracted hidden text</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Extracted Text</label>
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-lg bg-muted/50 border font-mono text-sm">
              {data.text || "No text found"}
            </div>
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(data.text, "Extracted text")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (type === "register") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass rounded-xl p-6 space-y-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold">File Registered</h3>
            <p className="text-sm text-muted-foreground">Successfully registered on blockchain</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">File Hash</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-lg bg-muted/50 border font-mono text-sm">
                {truncateAddress(data.hash, 8, 8)}
              </div>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(data.hash, "File hash")}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-lg bg-muted/50 border font-mono text-sm">
                {truncateAddress(data.txHash, 8, 8)}
              </div>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(data.txHash, "Transaction hash")}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => openBlockExplorer(data.txHash)}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (type === "verify") {
    const statusColor = data.exists ? "green" : "red"
    const StatusIcon = data.exists ? CheckCircle2 : CircleAlert

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass rounded-xl p-6 space-y-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-${statusColor}-500/10 flex items-center justify-center`}>
            <StatusIcon className={`w-5 h-5 text-${statusColor}-500`} />
          </div>
          <div>
            <h3 className="font-semibold">Verification Result</h3>
            <Badge variant={data.exists ? "default" : "destructive"}>{data.exists ? "Found" : "Not Found"}</Badge>
          </div>
        </div>

        {data.exists && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Owner</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 rounded-lg bg-muted/50 border font-mono text-sm">
                    {truncateAddress(data.owner)}
                  </div>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(data.owner, "Owner address")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                <div className="p-3 rounded-lg bg-muted/50 border text-sm">{formatTimestamp(data.timestamp)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">File Hash</label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 rounded-lg bg-muted/50 border font-mono text-sm">
                  {truncateAddress(data.hash, 8, 8)}
                </div>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(data.hash, "File hash")}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {data.note && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Note</label>
                <div className="p-3 rounded-lg bg-muted/50 border text-sm">{data.note}</div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    )
  }

  return null
}

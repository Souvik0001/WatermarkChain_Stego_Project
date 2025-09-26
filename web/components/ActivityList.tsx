"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wand2,
  TextSearch,
  Stamp,
  ShieldCheck,
  CheckCircle2,
  CircleAlert,
  Clock,
  Trash2,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatTimeAgo } from "@/lib/format"

interface ActivityItem {
  id: string
  type: "embed" | "extract" | "register" | "verify"
  status: "success" | "error" | "pending"
  timestamp: number
  fileName: string
  details?: string
  fileSize?: number
}

// Enhanced mock data with more realistic activities
const initialMockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "embed",
    status: "success",
    timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    fileName: "contract_draft.png",
    details: "Watermark embedded successfully",
    fileSize: 2.4 * 1024 * 1024,
  },
  {
    id: "2",
    type: "register",
    status: "success",
    timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
    fileName: "legal_document.pdf",
    details: "Registered on blockchain",
    fileSize: 1.8 * 1024 * 1024,
  },
  {
    id: "3",
    type: "verify",
    status: "success",
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    fileName: "photo_evidence.jpg",
    details: "Verification successful",
    fileSize: 3.2 * 1024 * 1024,
  },
  {
    id: "4",
    type: "extract",
    status: "error",
    timestamp: Date.now() - 1000 * 60 * 45, // 45 minutes ago
    fileName: "suspicious_image.png",
    details: "No watermark found",
    fileSize: 1.1 * 1024 * 1024,
  },
  {
    id: "5",
    type: "embed",
    status: "success",
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    fileName: "presentation_slide.png",
    details: "Watermark embedded",
    fileSize: 0.8 * 1024 * 1024,
  },
]

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "embed":
      return Wand2
    case "extract":
      return TextSearch
    case "register":
      return Stamp
    case "verify":
      return ShieldCheck
  }
}

const getStatusIcon = (status: ActivityItem["status"]) => {
  switch (status) {
    case "success":
      return CheckCircle2
    case "error":
      return CircleAlert
    case "pending":
      return Clock
  }
}

const getStatusColor = (status: ActivityItem["status"]) => {
  switch (status) {
    case "success":
      return "text-green-500"
    case "error":
      return "text-red-500"
    case "pending":
      return "text-yellow-500"
  }
}

const getTypeColor = (type: ActivityItem["type"]) => {
  switch (type) {
    case "embed":
      return "text-cyan-400"
    case "extract":
      return "text-purple-400"
    case "register":
      return "text-blue-400"
    case "verify":
      return "text-green-400"
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export function ActivityList() {
  const [activities, setActivities] = useState<ActivityItem[]>(initialMockActivities)
  const [filter, setFilter] = useState<"all" | ActivityItem["type"]>("all")

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add a new activity (10% chance every 30 seconds)
      if (Math.random() < 0.1) {
        const types: ActivityItem["type"][] = ["embed", "extract", "register", "verify"]
        const statuses: ActivityItem["status"][] = ["success", "error"]
        const fileNames = ["document.pdf", "image.png", "contract.jpg", "photo.jpeg", "presentation.png", "report.pdf"]

        const newActivity: ActivityItem = {
          id: Date.now().toString(),
          type: types[Math.floor(Math.random() * types.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          timestamp: Date.now(),
          fileName: fileNames[Math.floor(Math.random() * fileNames.length)],
          details: "Operation completed",
          fileSize: Math.random() * 5 * 1024 * 1024, // Random size up to 5MB
        }

        setActivities((prev) => [newActivity, ...prev.slice(0, 9)]) // Keep only 10 items
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const filteredActivities = activities.filter((activity) => filter === "all" || activity.type === filter)

  const clearAll = () => {
    setActivities([])
  }

  const resetToMock = () => {
    setActivities(initialMockActivities)
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="text-xs"
        >
          All
        </Button>
        <Button
          variant={filter === "embed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("embed")}
          className="text-xs"
        >
          Embed
        </Button>
        <Button
          variant={filter === "extract" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("extract")}
          className="text-xs"
        >
          Extract
        </Button>
        <Button
          variant={filter === "register" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("register")}
          className="text-xs"
        >
          Register
        </Button>
        <Button
          variant={filter === "verify" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("verify")}
          className="text-xs"
        >
          Verify
        </Button>
      </div>

      {/* Activity Controls */}
      {activities.length > 0 && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearAll} className="text-xs gap-1 bg-transparent">
            <Trash2 className="w-3 h-3" />
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={resetToMock} className="text-xs gap-1 bg-transparent">
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{filter === "all" ? "No recent activity" : `No ${filter} activities`}</p>
            </motion.div>
          ) : (
            filteredActivities.map((activity, index) => {
              const ActivityIcon = getActivityIcon(activity.type)
              const StatusIcon = getStatusIcon(activity.status)
              const statusColor = getStatusColor(activity.status)
              const typeColor = getTypeColor(activity.type)

              return (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg glass-strong hover:bg-muted/20 transition-all duration-200 group"
                >
                  <div
                    className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ${typeColor}`}
                  >
                    <ActivityIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{activity.fileName}</p>
                      <StatusIcon className={`w-3 h-3 flex-shrink-0 ${statusColor}`} />
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 capitalize">
                        {activity.type}
                      </Badge>
                      {activity.fileSize && (
                        <span className="text-xs text-muted-foreground">{formatFileSize(activity.fileSize)}</span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-1">{activity.details}</p>
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                  </div>

                  {/* Hover indicator */}
                  <div className="w-1 h-full bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Activity Stats */}
      {activities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-lg p-3 space-y-2"
        >
          <p className="text-xs font-medium text-muted-foreground">Activity Summary</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-mono">{activities.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Success:</span>
              <span className="font-mono text-green-500">
                {activities.filter((a) => a.status === "success").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Errors:</span>
              <span className="font-mono text-red-500">{activities.filter((a) => a.status === "error").length}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending:</span>
              <span className="font-mono text-yellow-500">
                {activities.filter((a) => a.status === "pending").length}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

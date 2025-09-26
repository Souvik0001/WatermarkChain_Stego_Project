"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Github, Wand2, TextSearch, Stamp, ShieldCheck, Menu, X, Clapperboard } from "lucide-react"
import { ImageEmbed } from "@/features/watermark/ImageEmbed"
import { ImageExtract } from "@/features/watermark/ImageExtract"
import { Register } from "@/features/chain/Register"
import { Verify } from "@/features/chain/Verify"
import { ActivityList } from "@/components/ActivityList"

// NEW: import video features
import VideoEmbed from "@/features/video/VideoEmbed"
import VideoExtract from "@/features/video/VideoExtract"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong border-b border-border/50 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-balance">WatermarkChain</h1>
                <p className="text-xs text-muted-foreground">Invisible Watermarking + On-Chain Proof</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="w-5 h-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
            <Tabs defaultValue="embed" className="w-full">
              {/* grid-cols changed 4 -> 5 to include Video */}
              <TabsList className="grid w-full grid-cols-5 glass mb-6">
                <TabsTrigger value="embed" className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Embed</span>
                </TabsTrigger>

                <TabsTrigger value="extract" className="flex items-center gap-2">
                  <TextSearch className="w-4 h-4" />
                  <span className="hidden sm:inline">Extract</span>
                </TabsTrigger>

                <TabsTrigger value="register" className="flex items-center gap-2">
                  <Stamp className="w-4 h-4" />
                  <span className="hidden sm:inline">Register</span>
                </TabsTrigger>

                <TabsTrigger value="verify" className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Verify</span>
                </TabsTrigger>

                {/* NEW: Video tab */}
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Clapperboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Video</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="embed">
                <ImageEmbed />
              </TabsContent>

              <TabsContent value="extract">
                <ImageExtract />
              </TabsContent>

              <TabsContent value="register">
                <Register />
              </TabsContent>

              <TabsContent value="verify">
                <Verify />
              </TabsContent>

              {/* NEW: Video content (two panels) */}
              <TabsContent value="video">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-white/10 p-4">
                    <h2 className="font-medium mb-3">Embed Video</h2>
                    <VideoEmbed />
                  </div>
                  <div className="rounded-xl border border-white/10 p-4">
                    <h2 className="font-medium mb-3">Extract Video</h2>
                    <VideoExtract />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Activity Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              w-80 glass rounded-xl p-6 h-fit sticky top-24
              ${sidebarOpen ? "block" : "hidden lg:block"}
              lg:relative lg:translate-x-0
              ${sidebarOpen ? "fixed inset-x-4 top-24 z-40" : ""}
            `}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              {sidebarOpen && (
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <ActivityList />
          </motion.aside>
        </div>
      </div>
    </div>
  )
}

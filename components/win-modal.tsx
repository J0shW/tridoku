"use client"

import { GameStats } from "@/hooks/use-tridoku"
import { formatTime, getPuzzleNumber } from "@/lib/tridoku"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Check } from "lucide-react"
import { useState } from "react"

interface WinModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stats: GameStats
  elapsedTime: number
  getShareText: () => string
}

export function WinModal({ open, onOpenChange, stats, elapsedTime, getShareText }: WinModalProps) {
  const [copied, setCopied] = useState(false)
  const puzzleNumber = getPuzzleNumber()

  const handleShare = async () => {
    const text = getShareText()
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Daily Tridoku",
          text: text,
        })
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getShareText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold">
            Congratulations!
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            You solved Daily Tridoku #{puzzleNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Time */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">Time</p>
            <p className="text-4xl font-bold text-primary">{formatTime(elapsedTime)}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.maxStreak}</p>
              <p className="text-xs text-muted-foreground">Max Streak</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.gamesWon}</p>
              <p className="text-xs text-muted-foreground">Games Won</p>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleShare}
              className="flex-1 h-12 text-base font-semibold"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Share
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="h-12 w-12"
              aria-label="Copy results"
            >
              {copied ? <Check className="h-5 w-5 text-accent" /> : <Copy className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Come back tomorrow for a new puzzle!
        </p>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { GameStats } from "@/hooks/use-tridoku"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatTime } from "@/lib/tridoku"

interface StatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stats: GameStats
}

export function StatsModal({ open, onOpenChange, stats }: StatsModalProps) {
  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Statistics</DialogTitle>
          <DialogDescription className="text-center">Your Tridoku progress and achievements</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-4 gap-4 py-6">
          <StatItem value={stats.gamesPlayed} label="Played" />
          <StatItem value={winRate} label="Win %" />
          <StatItem value={stats.currentStreak} label="Current Streak" />
          <StatItem value={stats.maxStreak} label="Max Streak" />
        </div>

        {stats.bestTime && (
          <div className="text-center py-4 border-t border-border">
            <p className="text-muted-foreground text-sm mb-1">Best Time</p>
            <p className="text-3xl font-bold text-primary">{formatTime(stats.bestTime)}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

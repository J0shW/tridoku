"use client"

import { StatTile } from "@/components/ui/badge"
import { GameStats, type DifficultyStats as DifficultyStatsData } from "@/hooks/use-tridoku"
import { Difficulty } from "@/lib/tridoku"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatTime } from "@/lib/tridoku"
import { winRate } from "@/lib/stats"
import { Check, X } from "lucide-react"
import { SeasonPassBody } from "@/components/season-pass"

interface StatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stats: GameStats
  /** Mountain theme: statistics are a season pass (TRI-108) */
  mountain?: boolean
}

export function StatsModal({ open, onOpenChange, stats, mountain = false }: StatsModalProps) {
  if (mountain) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="ticket-enter block gap-0 overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none [filter:drop-shadow(0_24px_28px_rgb(10_18_28/0.35))]"
        >
          <SeasonPassBody stats={stats} />
        </DialogContent>
      </Dialog>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Statistics</DialogTitle>
          <DialogDescription className="text-center">Your Tridoku progress by difficulty</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="easy" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="easy" className="text-xs sm:text-sm">Easy</TabsTrigger>
            <TabsTrigger value="medium" className="text-xs sm:text-sm">Medium</TabsTrigger>
            <TabsTrigger value="hard" className="text-xs sm:text-sm">Hard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="easy" className="mt-4">
            <DifficultyStats stats={stats.easy} difficulty="easy" />
          </TabsContent>
          
          <TabsContent value="medium" className="mt-4">
            <DifficultyStats stats={stats.medium} difficulty="medium" />
          </TabsContent>
          
          <TabsContent value="hard" className="mt-4">
            <DifficultyStats stats={stats.hard} difficulty="hard" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function DifficultyStats({ stats, difficulty }: { stats: DifficultyStatsData; difficulty: Difficulty }) {
  const winPercent = winRate(stats)
    

  return (
    <div>
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-lg font-semibold text-foreground">
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level
        </span>
        {stats.completedToday && (
          <div className="flex items-center gap-1 text-success text-sm">
            <Check className="h-4 w-4" />
            <span>Completed Today</span>
          </div>
        )}
        {!stats.completedToday && stats.lastPlayedDate && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <X className="h-4 w-4" />
            <span>Not Completed</span>
          </div>
        )}
      </div>
      
      {/* 2×2 on phones, one row of four on wider screens (TRI-094) */}
      <div className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-4">
        <StatTile value={stats.gamesPlayed} label="Played" />
        <StatTile value={winPercent} label="Win %" />
        <StatTile value={stats.currentStreak} label="Current streak" />
        <StatTile value={stats.maxStreak} label="Max streak" />
      </div>

      {stats.bestTime != null && (
        <div className="text-center py-4 border-t border-border">
          <p className="text-muted-foreground text-sm mb-1">Best Time</p>
          <p className="text-display-sm font-bold tabular-nums text-fg">{formatTime(stats.bestTime)}</p>
        </div>
      )}
      
      {stats.bestTime == null && stats.gamesPlayed === 0 && (
        <div className="text-center py-4 border-t border-border text-muted-foreground">
          <p className="text-sm">No games played yet at this difficulty</p>
        </div>
      )}
    </div>
  )
}



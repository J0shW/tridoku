"use client"

import { GameStats } from "@/hooks/use-tridoku"
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
import { Check, X } from "lucide-react"

interface StatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stats: GameStats
}

export function StatsModal({ open, onOpenChange, stats }: StatsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Statistics</DialogTitle>
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

function DifficultyStats({ stats, difficulty }: { stats: any; difficulty: Difficulty }) {
  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0
    
  const difficultyColors = {
    easy: 'text-green-600',
    medium: 'text-yellow-600',
    hard: 'text-red-600',
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className={`text-lg font-semibold ${difficultyColors[difficulty]}`}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level
        </span>
        {stats.completedToday && (
          <div className="flex items-center gap-1 text-green-600 text-sm">
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
      
      {!stats.bestTime && stats.gamesPlayed === 0 && (
        <div className="text-center py-4 border-t border-border text-muted-foreground">
          <p className="text-sm">No games played yet at this difficulty</p>
        </div>
      )}
    </div>
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

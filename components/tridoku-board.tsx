"use client"

import { Cell, CellId } from "@/lib/tridoku"

interface TridokuBoardProps {
  cells: Cell[]
  onCellClick: (cellId: CellId) => void
  isPaused: boolean
}

export function TridokuBoard({ cells, onCellClick, isPaused }: TridokuBoardProps) {
  if (isPaused) {
    return (
      <div className="w-full aspect-square flex items-center justify-center bg-secondary/50 rounded-xl">
        <div className="text-center">
          <p className="text-2xl mb-2">Paused</p>
          <p className="text-muted-foreground">Click resume to continue</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full aspect-square flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20">
      <div className="text-center space-y-2">
        <p className="text-2xl font-semibold text-muted-foreground">Board Coming Soon</p>
        <p className="text-sm text-muted-foreground">The triangular grid will be rendered here</p>
      </div>
    </div>
  );
}

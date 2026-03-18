"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface RulesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RulesModal({ open, onOpenChange }: RulesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">How to Play</DialogTitle>
          <DialogDescription className="text-center">Learn the rules of Tridoku</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <section>
            <h3 className="font-semibold text-lg mb-2 text-primary">The Basics</h3>
            <p className="text-muted-foreground leading-relaxed">
              Tridoku is a triangular variation of Sudoku. Fill each cell with a digit from 1 to 9 following the rules below.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3 text-primary">Rules</h3>
            <ul className="space-y-3">
              <RuleItem number={1}>
                <strong>Regions:</strong> Each bolded triangular region must contain the digits 1 through 9 exactly once.
              </RuleItem>
              <RuleItem number={2}>
                <strong>Outer Edges:</strong> The three sides of the large triangle must each contain digits 1 through 9.
              </RuleItem>
              <RuleItem number={3}>
                <strong>Inner Triangle:</strong> The inner triangle&apos;s edges must also contain digits 1 through 9.
              </RuleItem>
              <RuleItem number={4}>
                <strong>No Touching:</strong> Identical numbers cannot touch each other, not even at a single corner point.
              </RuleItem>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3 text-primary">Tips</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Start with cells that have the most constraints</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Use the &quot;Show Errors&quot; toggle if you get stuck</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Remember: touching cells cannot have the same value!</span>
              </li>
            </ul>
          </section>

          <section className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground text-center">
              A new puzzle is available every day at midnight.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RuleItem({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
        {number}
      </span>
      <span className="text-muted-foreground leading-relaxed">{children}</span>
    </li>
  )
}

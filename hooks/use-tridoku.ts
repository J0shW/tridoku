"use client"

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react"
import { 
  Cell, 
  CellId,
  getPuzzleNumber,
  loadPuzzle,
  validateBoard,
  isPuzzleComplete,
  Difficulty,
  createEmptyBoard
} from "@/lib/tridoku"
import { getDailyPuzzle, PuzzleLoadError, type DailyPuzzle } from "@/lib/puzzle-service"
import { trackEvent } from "@/lib/analytics"
import { bumpCounter, getCounters } from "@/lib/play-counters"
import { normalizeDateKey, todayKey, type DateKey } from "@/lib/dates"
import { defaultStats, normalizeStats, recordStart, recordWin, type GameStats } from "@/lib/stats"
import { buildShareText } from "@/lib/share"
import { watchDateChange } from "@/lib/date-watch"
import { createLocalStore, hydrated } from "@/lib/local-store"
import { describeUndo, parseUndoHistory, pushStep, snapshot, type CellSnapshot, type UndoStep } from "@/lib/undo"

export type { DifficultyStats, GameStats } from "@/lib/stats"

export type InputMode = 'pen' | 'pencil'

interface GameState {
  cells: Cell[][]
  selectedCellId: CellId | null
  isComplete: boolean
  isPaused: boolean
  elapsedTime: number
  showErrors: boolean
  difficulty: Difficulty | null
  hasStarted: boolean
  isViewMode: boolean
  inputMode: InputMode
  puzzleHash: string | null // Hash of original puzzle to validate saved progress
  puzzleDate: DateKey | null // Date of the loaded puzzle (not necessarily today, e.g. after midnight)
  fallback: DailyPuzzle["fallback"] | null // Set when today's puzzle wasn't available (TRI-010)
  highlightedValue: number | null // Value to highlight across the board (double-tap feature)
  undoHistory: UndoStep[] // Steps Undo can take back, oldest first (TRI-052)
}

const STORAGE_KEY = "tridoku-game-state"
const STATS_KEY = "tridoku-stats"

function getStoredStats(): GameStats {
  if (typeof window === "undefined") return defaultStats()
  try {
    return normalizeStats(JSON.parse(localStorage.getItem(STATS_KEY) || "null"), todayKey())
  } catch (e) {
    console.error('Failed to parse stats:', e)
    return defaultStats()
  }
}

function saveStats(stats: GameStats) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  }
}

interface SavedProgress {
  date: string
  elapsedTime: number
  inputMode: InputMode
  userCells: { row: number; col: number; value: number | null; pencilMarks: number[] }[]
  puzzleHash?: string // Hash of the original puzzle to validate progress matches
  savedAt?: number // ms timestamp, to resume the most recent puzzle (TRI-033)
  undo?: UndoStep[] // Undo history, so it survives a reload (TRI-052)
}

type SavedProgressByDifficulty = Partial<Record<Difficulty, SavedProgress>>

function saveGameProgress(gameState: GameState) {
  if (typeof window === "undefined" || !gameState.difficulty || !gameState.puzzleHash) return
  const userCells: SavedProgress['userCells'] = []
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 17; col++) {
      const cell = gameState.cells[row][col]
      if (cell.hidden || cell.isGiven) continue
      if (cell.value !== null || (cell.pencilMarks && cell.pencilMarks.length > 0)) {
        userCells.push({ row, col, value: cell.value, pencilMarks: cell.pencilMarks || [] })
      }
    }
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  let allProgress: SavedProgressByDifficulty = {}
  if (stored) {
    try { allProgress = JSON.parse(stored) } catch { /* ignore */ }
  }
  allProgress[gameState.difficulty] = {
    date: gameState.puzzleDate ?? todayKey(),
    elapsedTime: gameState.elapsedTime,
    inputMode: gameState.inputMode,
    userCells,
    puzzleHash: gameState.puzzleHash,
    savedAt: Date.now(),
    undo: gameState.undoHistory,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress))
}

function loadGameProgress(difficulty: Difficulty, currentPuzzleHash?: string): SavedProgress | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    const allProgress: SavedProgressByDifficulty = JSON.parse(stored)
    const progress = allProgress[difficulty]
    if (!progress || normalizeDateKey(progress.date) !== todayKey()) return null
    // Validate that saved progress matches the current puzzle
    // This prevents loading yesterday's progress onto today's puzzle
    if (currentPuzzleHash && progress.puzzleHash && progress.puzzleHash !== currentPuzzleHash) {
      console.log('[useTridoku] Saved progress puzzle hash mismatch - discarding old progress')
      clearGameProgress(difficulty)
      return null
    }
    return progress
  } catch {
    return null
  }
}

export interface PuzzleInProgress {
  elapsedTime: number
  savedAt: number
}

/** Puzzles started today and not finished, by difficulty (TRI-033). */
function getTodaysProgress(): Partial<Record<Difficulty, PuzzleInProgress>> {
  if (typeof window === "undefined") return {}
  try {
    const all: SavedProgressByDifficulty = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    const out: Partial<Record<Difficulty, PuzzleInProgress>> = {}
    for (const d of ["easy", "medium", "hard"] as const) {
      const p = all[d]
      if (p && normalizeDateKey(p.date) === todayKey() && p.userCells.some((c) => c.value != null || c.pencilMarks.length)) {
        out[d] = { elapsedTime: p.elapsedTime, savedAt: p.savedAt ?? 0 }
      }
    }
    return out
  } catch {
    return {}
  }
}

function clearGameProgress(difficulty: Difficulty) {
  if (typeof window === "undefined") return
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return
  try {
    const allProgress: SavedProgressByDifficulty = JSON.parse(stored)
    delete allProgress[difficulty]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress))
  } catch { /* ignore */ }
}

// Generate a simple hash of the puzzle's given cells to validate progress
function getPuzzleHash(puzzleString: string): string {
  // Use a simple hash - just the puzzle string itself since it uniquely identifies the puzzle
  return puzzleString
}

/** Share of the empty cells the player has filled, 0–100. */
function percentFilled(cells: Cell[][]): number {
  let open = 0
  let filled = 0
  for (const row of cells) for (const c of row) {
    if (c.hidden || c.isGiven) continue
    open++
    if (c.value != null) filled++
  }
  return open ? Math.round((filled / open) * 100) : 0
}

/** Whether the player has opened the rules on this browser (set in components/tridoku-game.tsx). */
function hasSeenRules(): boolean {
  try {
    return localStorage.getItem("tridoku-rules-seen") === "true"
  } catch {
    return false
  }
}

export interface UndoFeedback {
  cellId: CellId
  /** What the undo put back, e.g. "Removed 7" (lib/undo.ts). */
  label: string
  /** Changes on every undo so the board flash and button label restart. */
  key: number
}

// Stats and today's in-progress puzzles live in localStorage. They are read through
// external stores so the server render and hydration see defaults (TRI-080).
const statsStore = createLocalStore<GameStats>(getStoredStats, defaultStats())
const progressStore = createLocalStore<Partial<Record<Difficulty, PuzzleInProgress>>>(getTodaysProgress, {})

function setStats(stats: GameStats) {
  statsStore.set(stats)
  saveStats(stats)
}

const INITIAL_STATE: GameState = {
  cells: createEmptyBoard(),
  selectedCellId: null,
  isComplete: false,
  isPaused: false,
  elapsedTime: 0,
  showErrors: false,
  difficulty: null,
  hasStarted: false,
  isViewMode: false,
  inputMode: 'pen',
  puzzleHash: null,
  puzzleDate: null,
  fallback: null,
  highlightedValue: null,
  undoHistory: [],
}

function parseCellId(id: CellId): [number, number] {
  const [row, col] = id.split("-").map(Number)
  return [row, col]
}

/** The state after one cell changes: re-validated, and finished if that solved the puzzle. */
function withCell(prev: GameState, cellId: CellId, next: CellSnapshot): GameState {
  const [row, col] = parseCellId(cellId)
  const cells = validateBoard(
    prev.cells.map((r, ri) =>
      ri === row ? r.map((c, ci) => (ci === col ? { ...c, value: next.value, pencilMarks: next.pencilMarks } : c)) : r,
    ),
  )
  const isComplete = isPuzzleComplete(cells)
  // A solved puzzle goes straight to view mode
  return isComplete ? { ...prev, cells, isComplete, isViewMode: true, selectedCellId: null } : { ...prev, cells, isComplete }
}

export function useTridoku() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE)
  const stats = useSyncExternalStore(statsStore.subscribe, statsStore.get, statsStore.getServer)
  const progressToday = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.getServer)
  // localStorage can only be read in the browser, so the server renders the loading screen
  const isLoading = !useSyncExternalStore(hydrated.subscribe, hydrated.get, hydrated.getServer)
  const [isGenerating, setIsGenerating] = useState(false)
  // Difficulty whose puzzle failed to load, if any (TRI-011)
  const [loadError, setLoadError] = useState<Difficulty | null>(null)
  // Today's Easy puzzle, shown as a preview on the welcome screen (TRI-026)
  const [previewPuzzle, setPreviewPuzzle] = useState<string | null>(null)
  // The last undo, for the board flash and the Undo button's label (TRI-052)
  const [undoFeedback, setUndoFeedback] = useState<UndoFeedback | null>(null)
  const undoCount = useRef(0)

  // The latest game state. Every change goes through `update`, which keeps this current
  // so event handlers never read a stale state, and saves progress when cells change.
  const gameStateRef = useRef(gameState)
  const update = useCallback((fn: (prev: GameState) => GameState): GameState => {
    const prev = gameStateRef.current
    const next = fn(prev)
    if (next === prev) return prev
    gameStateRef.current = next
    setGameState(next)
    if (next.cells !== prev.cells && next.hasStarted && !next.isComplete && !next.isViewMode) saveGameProgress(next)
    return next
  }, [])

  // TRI-017: when the page is hidden with an unfinished puzzle, record where the player
  // stopped. Sent at most once per page load.
  const sessionEndSent = useRef(false)
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== "hidden" || sessionEndSent.current) return
      const g = gameStateRef.current
      if (!g.difficulty || !g.hasStarted || g.isComplete || g.isViewMode) return
      const pct = percentFilled(g.cells)
      if (pct === 0) return
      sessionEndSent.current = true
      trackEvent("session_end", { difficulty: g.difficulty, pct_filled: pct, time: g.elapsedTime })
    }
    document.addEventListener("visibilitychange", onHide)
    return () => document.removeEventListener("visibilitychange", onHide)
  }, [])

  // A tab left open past midnight: re-derive "completed today" and in-progress badges (TRI-086)
  useEffect(
    () =>
      watchDateChange((today) => {
        statsStore.set(normalizeStats(statsStore.get(), today))
        progressStore.refresh()
      }),
    [],
  )

  // Fetch today's Easy puzzle for the welcome-screen preview. Failures just hide it.
  useEffect(() => {
    getDailyPuzzle(undefined, "easy")
      .then((p) => setPreviewPuzzle(p.puzzle))
      .catch(() => {})
  }, [])

  // Timer
  useEffect(() => {
    if (!gameState.hasStarted || gameState.isComplete || gameState.isPaused) return
    const interval = setInterval(() => {
      update(prev => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }))
    }, 1000)
    return () => clearInterval(interval)
  }, [gameState.hasStarted, gameState.isComplete, gameState.isPaused, update])

  // Record a win: called by the action that solved the puzzle (TRI-080)
  const recordCompletion = useCallback((g: GameState) => {
    if (!g.difficulty) return
    const difficulty = g.difficulty
    const puzzleDate = g.puzzleDate ?? todayKey()

    // Clear the in-progress save for this difficulty
    clearGameProgress(difficulty)
    progressStore.refresh()

    // Record the win against the puzzle's own date (TRI-006). recordWin returns null
    // if this puzzle was already counted.
    const counters = getCounters(difficulty, puzzleDate)
    const all = statsStore.get()
    const newDiffStats = recordWin(all[difficulty], {
      puzzleDate,
      today: todayKey(),
      time: g.elapsedTime,
      solvedBoard: boardToString(g.cells),
      regionErrors: counters.regionErrors,
    })
    if (!newDiffStats) return

    // Track puzzle completion (e.g. easy_completed, medium_completed, hard_completed)
    trackEvent(`${difficulty}_completed`, {
      difficulty,
      time: g.elapsedTime,
      errors: counters.errors,
      pencil_marks: counters.notes,
      resets: counters.resets,
      quick_clears: counters.quickClears,
      undos: counters.undos,
      undo_reentries: counters.undoReentries,
    })
    setStats({ ...all, [difficulty]: newDiffStats })
  }, [])

  // Change one cell, record the step for Undo, and finish the puzzle if that solved it
  const changeCell = useCallback((cellId: CellId, next: CellSnapshot) => {
    const prev = gameStateRef.current
    const [row, col] = parseCellId(cellId)
    const step = { cellId, before: snapshot(prev.cells[row][col]), after: next }
    const result = update(p => ({ ...withCell(p, cellId, next), undoHistory: pushStep(p.undoHistory, step) }))
    setUndoFeedback(f => (f ? null : f))
    if (result.isComplete && !prev.isComplete) recordCompletion(result)
  }, [update, recordCompletion])

  // Select a cell by CellId
  const selectCell = useCallback((cellId: CellId | null) => {
    update(prev => {
      if (prev.isViewMode) return prev
      // Tapping the selected cell again toggles highlighting of its digit across the board
      if (cellId && cellId === prev.selectedCellId) {
        const [row, col] = parseCellId(cellId)
        const cell = prev.cells[row]?.[col]
        if (cell?.value != null) {
          return { ...prev, highlightedValue: prev.highlightedValue === cell.value ? null : cell.value }
        }
      }
      // Clear highlight when selecting a different cell
      return { ...prev, selectedCellId: cellId, highlightedValue: null }
    })
  }, [update])

  // Count the puzzle as played on its first entry (TRI-007) and record the start (TRI-016)
  const markStarted = useCallback(() => {
    const { difficulty, puzzleDate, isViewMode, selectedCellId, cells } = gameStateRef.current
    if (!difficulty || !puzzleDate || isViewMode || !selectedCellId) return
    const [row, col] = parseCellId(selectedCellId)
    if (cells[row]?.[col]?.isGiven) return
    const all = statsStore.get()
    const next = recordStart(all[difficulty], puzzleDate)
    if (!next) return
    setStats({ ...all, [difficulty]: next })
    trackEvent("puzzle_started", {
      difficulty,
      ms_since_load: Math.round(performance.now()),
      rules_seen: hasSeenRules(),
    })
  }, [])

  // Count wrong entries and notes for the completion event (TRI-019)
  const countEntry = useCallback((value: number) => {
    const { difficulty, puzzleDate, selectedCellId, cells, inputMode, isViewMode } = gameStateRef.current
    if (!difficulty || !puzzleDate || !selectedCellId || isViewMode) return
    const [row, col] = parseCellId(selectedCellId)
    const cell = cells[row]?.[col]
    if (!cell || cell.hidden || cell.isGiven) return
    if (inputMode === "pencil") {
      if (!cell.pencilMarks.includes(value)) bumpCounter(difficulty, puzzleDate, "notes")
      return
    }
    if (cell.value === value) return
    const after = validateBoard(cells.map((r, ri) => (ri === row ? r.map((c, ci) => (ci === col ? { ...c, value } : c)) : r)))
    if (after[row][col].hasError) bumpCounter(difficulty, puzzleDate, "errors", cell.boldedRegion)
  }, [])

  // TRI-059: a digit cleared within 2 s of being entered in the same cell is a likely mis-tap
  const lastEntry = useRef<{ id: CellId; at: number } | null>(null)
  const noteQuickClear = useCallback(() => {
    const { difficulty, puzzleDate, selectedCellId, inputMode, cells } = gameStateRef.current
    const last = lastEntry.current
    lastEntry.current = null
    if (!difficulty || !puzzleDate || !selectedCellId || inputMode !== "pen" || !last) return
    const [row, col] = parseCellId(selectedCellId)
    if (last.id === selectedCellId && cells[row]?.[col]?.value != null && Date.now() - last.at < 2000) {
      bumpCounter(difficulty, puzzleDate, "quickClears")
    }
  }, [])

  // TRI-052: the digit an undo just removed. Entering it again in the same cell suggests
  // the undo was a mistake, which is the case a Redo button would cover.
  const lastUndone = useRef<{ id: CellId; value: number } | null>(null)

  /** The selected cell if the player can change it right now. */
  const editableSelection = () => {
    const g = gameStateRef.current
    if (g.isViewMode || g.isComplete || g.isPaused || !g.selectedCellId) return null
    const [row, col] = parseCellId(g.selectedCellId)
    const cell = g.cells[row]?.[col]
    if (!cell || cell.hidden || cell.isGiven) return null
    return { g, id: g.selectedCellId, cell }
  }

  // Set value on the selected cell (pen mode) or toggle pencil mark (pencil mode)
  const setValue = useCallback((value: number) => {
    const sel = editableSelection()
    if (!sel) return
    const { g, id, cell } = sel
    markStarted()
    countEntry(value)
    const undone = lastUndone.current
    lastUndone.current = null

    if (g.inputMode === "pencil") {
      const marks = cell.pencilMarks || []
      if (marks.includes(value)) {
        changeCell(id, { value: cell.value, pencilMarks: marks.filter(m => m !== value) })
      } else if (marks.length < 6) {
        changeCell(id, { value: cell.value, pencilMarks: [...marks, value].sort((a, b) => a - b) })
      }
      return
    }

    // Pen mode: set the value. Pencil marks are kept (hidden) under it.
    if (cell.value === value) return
    lastEntry.current = { id, at: Date.now() }
    if (undone && undone.id === id && undone.value === value && g.difficulty && g.puzzleDate) {
      bumpCounter(g.difficulty, g.puzzleDate, "undoReentries")
    }
    changeCell(id, { value, pencilMarks: cell.pencilMarks || [] })
  }, [markStarted, countEntry, changeCell])

  // Clear the selected cell: its digit in pen mode, all its pencil marks in pencil mode
  const clearCell = useCallback(() => {
    const sel = editableSelection()
    if (!sel) return
    const { g, id, cell } = sel
    noteQuickClear()
    lastUndone.current = null
    if (g.inputMode === "pencil") {
      if (cell.pencilMarks?.length) changeCell(id, { value: cell.value, pencilMarks: [] })
      return
    }
    if (cell.value != null) changeCell(id, { value: null, pencilMarks: cell.pencilMarks || [] })
  }, [noteQuickClear, changeCell])

  // Undo the last entry, clear or pencil-mark change (TRI-052)
  const undo = useCallback(() => {
    const g = gameStateRef.current
    const step = g.undoHistory[g.undoHistory.length - 1]
    if (!step || g.isViewMode || g.isComplete || g.isPaused) return
    const result = update(prev => ({
      ...withCell(prev, step.cellId, step.before),
      undoHistory: prev.undoHistory.slice(0, -1),
      selectedCellId: step.cellId,
      highlightedValue: null,
    }))
    lastEntry.current = null
    lastUndone.current =
      step.after.value != null && step.after.value !== step.before.value ? { id: step.cellId, value: step.after.value } : null
    undoCount.current += 1
    setUndoFeedback({ cellId: step.cellId, label: describeUndo(step), key: undoCount.current })
    if (g.difficulty && g.puzzleDate) bumpCounter(g.difficulty, g.puzzleDate, "undos")
    if (result.isComplete) {
      // Undoing back to an earlier full board can solve it
      update(prev => ({ ...prev, selectedCellId: null }))
      recordCompletion(result)
    }
  }, [update, recordCompletion])

  // Toggle input mode between pen and pencil
  const setInputMode = useCallback((mode: InputMode) => {
    update(prev => (prev.inputMode === mode ? prev : { ...prev, inputMode: mode }))
  }, [update])

  // Toggle error highlighting
  const toggleErrors = useCallback(() => {
    const prev = gameStateRef.current
    const enabled = !prev.showErrors
    trackEvent("error_check_toggled", { enabled, difficulty: prev.difficulty ?? "unknown" })
    update(p => ({ ...p, showErrors: enabled }))
  }, [update])

  // Toggle pause
  const togglePause = useCallback(() => {
    update(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }, [update])

  // Load today's puzzle for a difficulty: the solved board in view mode if it's already
  // done today (unless `showSolved` is false), otherwise the puzzle plus any saved progress.
  // On a download failure, keep the current screen and show an error with Retry (TRI-011).
  // Every way of opening a puzzle (welcome screen, tabs, Reset, resume) comes through here.
  const loadDifficulty = useCallback(async (difficulty: Difficulty, { showSolved = true } = {}) => {
    setIsGenerating(true)
    setLoadError(null)
    setUndoFeedback(null)
    lastEntry.current = null
    lastUndone.current = null
    try {
      const diffStats = statsStore.get()[difficulty]
      // Compare dates rather than completedToday so a tab left open past midnight
      // doesn't reopen yesterday's board.
      if (showSolved && diffStats.lastPlayedDate === todayKey() && diffStats.todaysPuzzle && diffStats.todaysTime !== undefined) {
        update(() => ({
          ...INITIAL_STATE,
          cells: loadPuzzle(diffStats.todaysPuzzle!),
          isComplete: true,
          elapsedTime: diffStats.todaysTime!,
          difficulty,
          hasStarted: true,
          isViewMode: true,
          puzzleHash: diffStats.todaysPuzzle!,
          puzzleDate: diffStats.lastPlayedDate,
        }))
        return
      }

      const dailyPuzzle = await getDailyPuzzle(undefined, difficulty)
      const puzzleHash = getPuzzleHash(dailyPuzzle.puzzle)
      const puzzleCells = loadPuzzle(dailyPuzzle.puzzle)
      if (dailyPuzzle.fallback) {
        trackEvent("puzzle_fallback_served", { difficulty, source: dailyPuzzle.fallback.sourceDate ?? "backup" })
      }

      // Restore saved progress for this exact puzzle, if any
      const savedProgress = loadGameProgress(difficulty, puzzleHash)
      if (savedProgress) {
        for (const uc of savedProgress.userCells) {
          const cell = puzzleCells[uc.row][uc.col]
          if (!cell.hidden && !cell.isGiven) {
            puzzleCells[uc.row][uc.col] = { ...cell, value: uc.value, pencilMarks: uc.pencilMarks }
          }
        }
      }

      update(() => ({
        ...INITIAL_STATE,
        cells: savedProgress ? validateBoard(puzzleCells) : puzzleCells,
        elapsedTime: savedProgress?.elapsedTime ?? 0,
        difficulty,
        hasStarted: true,
        inputMode: savedProgress?.inputMode ?? 'pen',
        puzzleHash,
        puzzleDate: dailyPuzzle.date,
        fallback: dailyPuzzle.fallback ?? null,
        undoHistory: savedProgress ? parseUndoHistory(savedProgress.undo, puzzleCells) : [],
      }))
    } catch (error) {
      console.error('Failed to fetch puzzle:', error)
      setLoadError(difficulty)
      trackEvent("puzzle_load_failed", {
        difficulty,
        reason: error instanceof PuzzleLoadError ? error.message : "unknown",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [update])

  // Switch to a difficulty (from the welcome screen or the difficulty tabs)
  const changeDifficulty = useCallback(async (difficulty: Difficulty) => {
    if (difficulty === gameStateRef.current.difficulty && !loadError) return

    // Save current game progress before switching
    const current = gameStateRef.current
    if (current.hasStarted && !current.isComplete && current.difficulty) {
      saveGameProgress(current)
      progressStore.refresh() // keep the tab badges current
      // Leaving an in-progress puzzle to switch difficulty counts as abandoning it
      if (!current.isViewMode && current.difficulty !== difficulty) {
        trackEvent(`${current.difficulty}_abandoned`, {
          difficulty: current.difficulty,
          reason: "switch_difficulty",
          time: current.elapsedTime,
          pct_filled: percentFilled(current.cells),
        })
      }
    }

    // Track loading this difficulty (e.g. easy_loaded, medium_loaded, hard_loaded)
    trackEvent(`${difficulty}_loaded`)
    await loadDifficulty(difficulty)
  }, [loadDifficulty, loadError])

  // Returning players go straight back to the puzzle they were last playing (TRI-033)
  const resumed = useRef(false)
  useEffect(() => {
    if (isLoading || resumed.current) return
    resumed.current = true
    const latest = (Object.entries(progressStore.get()) as [Difficulty, PuzzleInProgress][])
      .sort((a, b) => b[1].savedAt - a[1].savedAt)[0]
    if (latest) changeDifficulty(latest[0])
  }, [isLoading, changeDifficulty])

  // Reload a difficulty's puzzle, ignoring a solved board (used by Reset and dev tools)
  const generateNewPuzzle = useCallback(async (difficulty?: Difficulty) => {
    const targetDifficulty = difficulty || gameStateRef.current.difficulty || 'medium'
    await loadDifficulty(targetDifficulty, { showSolved: false })
  }, [loadDifficulty])

  // Try the last failed load again
  const retryLoad = useCallback(() => {
    if (loadError) loadDifficulty(loadError)
  }, [loadError, loadDifficulty])

  // Share text: result, spoiler-free region grid and an attributed link (lib/share.ts)
  const getShareText = useCallback(() => {
    if (!gameState.isComplete || !gameState.difficulty) return ""
    const diffStats = stats[gameState.difficulty]
    return buildShareText({
      puzzleNumber: getPuzzleNumber(gameState.puzzleDate ?? todayKey()),
      difficulty: gameState.difficulty,
      time: gameState.elapsedTime,
      streak: diffStats.currentStreak,
      regionErrors: diffStats.todaysRegionErrors,
    })
  }, [gameState.isComplete, gameState.elapsedTime, gameState.difficulty, gameState.puzzleDate, stats])

  // Reset puzzle
  const resetPuzzle = useCallback(() => {
    const current = gameStateRef.current
    if (!current.difficulty) return
    // Resetting an in-progress, incomplete puzzle counts as abandoning it
    if (current.hasStarted && !current.isComplete && !current.isViewMode) {
      trackEvent(`${current.difficulty}_abandoned`, {
        difficulty: current.difficulty,
        reason: "reset",
        time: current.elapsedTime,
        pct_filled: percentFilled(current.cells),
      })
      if (current.puzzleDate) bumpCounter(current.difficulty, current.puzzleDate, "resets")
    }
    clearGameProgress(current.difficulty)
    progressStore.refresh()
    generateNewPuzzle(current.difficulty)
  }, [generateNewPuzzle])

  return {
    cells: gameState.cells,
    selectedCellId: gameState.selectedCellId,
    isComplete: gameState.isComplete,
    isPaused: gameState.isPaused,
    elapsedTime: gameState.elapsedTime,
    showErrors: gameState.showErrors,
    difficulty: gameState.difficulty,
    hasStarted: gameState.hasStarted,
    isViewMode: gameState.isViewMode,
    inputMode: gameState.inputMode,
    highlightedValue: gameState.highlightedValue,
    puzzleDate: gameState.puzzleDate,
    fallback: gameState.fallback,
    canUndo: gameState.undoHistory.length > 0,
    undoFeedback,
    progressToday,
    previewPuzzle,
    loadError,
    retryLoad,
    puzzleNumber: getPuzzleNumber(gameState.puzzleDate ?? todayKey()),
    stats,
    isLoading,
    isGenerating,
    selectCell,
    setValue,
    clearCell,
    undo,
    toggleErrors,
    togglePause,
    resetPuzzle,
    getShareText,
    generateNewPuzzle,
    changeDifficulty,
    setInputMode,
  }
}

// Helper function to convert board to string
function boardToString(cells: Cell[][]): string {
  let result = ''
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 17; col++) {
      const cell = cells[row][col]
      if (cell.hidden) continue
      result += cell.value || '0'
    }
  }
  return result
}

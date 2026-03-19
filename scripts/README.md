# Tridoku Puzzle Generator

This directory contains scripts for pre-generating Tridoku puzzles.

## Quick Start - Testing the System

The web app is now configured to **fetch puzzles** instead of generating them in the browser. A sample file with test puzzles is at `public/puzzles/2026.json`.

1. Run the app: `npm run dev`
2. Click "New Puzzle" - it will fetch from the JSON file
3. If today's date isn't in the file, it uses a fallback puzzle

## Architecture Change

**Before:** Generate puzzles in browser → 10+ minute freeze ❌  
**After:** Fetch pre-generated puzzles → instant load ✅

1. **generate-puzzles.mjs** - Offline Node.js script that generates puzzles
2. **public/puzzles/YYYY.json** - Yearly puzzle files
3. **lib/puzzle-service.ts** - Web app fetches daily puzzle from JSON

## Generating Real Puzzles (TODO)

The current script uses placeholder puzzles. To generate a full year:

```bash
node scripts/generate-puzzles.mjs
```

⚠️ **This will take time** (possibly hours) but only needs to run once per year.

**Implementation steps:**
1. Copy generator code from `lib/tridoku.ts` to `generate-puzzles.mjs`
2. Remove browser-specific dependencies
3. Run the script overnight to generate all puzzles

## File Format

Each puzzle JSON file contains:
```json
{
  "2026-03-19": {
    "date": "2026-03-19",
    "difficulty": "medium",
    "seed": 20260319,
    "puzzle": "string of 81 digits (0-9)",
    "metadata": {
      "generatedAt": "2026-03-19T00:00:00Z",
      "givens": 40
    }
  }
}
```

## Files Changed

✅ `lib/puzzle-service.ts` - New service to fetch puzzles  
✅ `hooks/use-tridoku.ts` - Updated to fetch instead of generate  
✅ `public/puzzles/2026.json` - Sample puzzle file  
✅ `scripts/generate-puzzles.mjs` - Generator script skeleton

## Why This Approach?

- Browser generation was impossibly slow (10+ min freeze)
- This is how most puzzle games work (Wordle, NYT, etc.)
- Offline generation can take its time to ensure quality
- Web app loads puzzles instantly with a simple fetch

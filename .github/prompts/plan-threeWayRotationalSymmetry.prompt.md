## Plan: 3-Way Rotational Symmetry for Tridoku Puzzle Generation

Add aesthetic symmetry to generated Tridoku puzzles by implementing 3-way rotational removal of cells, matching the physical puzzle book design where symmetric regions have identical given patterns rotated 120°.

**TL;DR**: Modify the puzzle generator's cell removal algorithm to remove cells in groups of 3 (one from each symmetric region). The three symmetry groups are: {0,4,8}, {1,3,6}, {2,5,7}. Within each group, cells at the same local index (0-8) are rotationally equivalent. This ensures aesthetically pleasing puzzles while maintaining uniqueness.

**Steps**

1. **Create cell mapping lookup tables** — Define three mapping structures (one per symmetry group) that map local cell indices to grid coordinates for each region in the group
   - Group 1: Regions {0, 4, 8} - 9 cells each with mapping [local_index → (region_0_coords, region_4_coords, region_8_coords)]
   - Group 2: Regions {1, 3, 6} - similar structure
   - Group 3: Regions {2, 5, 7} - similar structure
   - *Key insight*: Local indices (0-8) are the same across rotational equivalents (region 0 cell at index 5 corresponds to region 4 cell at index 5 and region 8 cell at index 5)

2. **Build region-to-cells helper** — Create function that returns cells for given region+localIndex
   - `getCellByRegionIndex(board, regionNumber, localIndex)` returns the cell at that position
   - Simplifies lookup: given group+localIndex, find the 3 corresponding cells
   - Used by symmetric removal logic

3. **Implement symmetrical removal function** — Refactor `removeCellsWithUniqueness()` to remove cells in symmetric groups
   - Instead of iterating over all 81 cells randomly, iterate over 27 "removal units" (9 cells × 3 groups)
   - Each removal unit represents 3 rotationally equivalent cells
   - When attempting removal, remove all 3 cells simultaneously
   - Test uniqueness with all 3 removed
   - If unique: keep removed; else: restore all 3
   - *Depends on steps 1-2*

4. **Create removal unit shuffling logic** — Generate randomized order for attempting removals while maintaining symmetry
   - Build array of 27 removal units: {groupIndex: 0|1|2, localIndex: 0-8}
   - Shuffle this array using seeded RNG
   - Process in shuffled order to ensure random-looking puzzles despite symmetry constraint

5. **Update removal iteration logic** — Modify the pass-based removal to work with symmetric groups
   - Current: tries to remove single cells until no more can be removed
   - New: tries to remove symmetric triplets until no more can be removed
   - Given counts now decrease by 3 each successful removal (not 1)
   - Adjust target given counts to be multiples of 3, or allow ±1-2 variance
   - *Parallel with step 4*

6. **Add validation and logging** — Verify symmetry is maintained throughout generation
   - After removal process, confirm all three regions in each group have same given count
   - Log symmetry statistics (how many cells per region, distribution across groups)
   - Optional: visual verification function that prints region patterns side-by-side

**Relevant files**
- `scripts/generate-puzzles.mjs` — Main generator script
  - Modify `removeCellsWithUniqueness()` function (lines ~390-460) to implement symmetric removal
  - Add SYMMETRY_GROUPS constant after DIFFICULTY_CONFIGS
  - Add `getCellByRegionIndex()` helper function before removeCellsWithUniqueness
  - Add `getSymmetricTriplet()` helper to find the 3 cells for a given group+localIndex

**Verification**
1. Generate test puzzle with `node scripts/generate-puzzles.mjs` and examine output JSON
2. Manually verify regions in same group have identical cell patterns (rotationally)
3. Confirm uniqueness is maintained (existing countSolutions check)
4. Visual inspection: print groups side-by-side to see rotational correspondence
5. Test all three difficulty levels generate symmetric puzzles
6. Verify given counts are close to target (within ±2 since removing in groups of 3)

**Decisions**
- **Local index correspondence**: Analysis confirms local indices map directly across regions in same group (0→0, 1→1, etc.), simplifying implementation
- **Removal granularity**: Remove cells in units of 3 (one triplet at a time) rather than 1 at a time
- **Target given adjustment**: Since removal is in steps of 3, final given count may be ±1-2 from target; this is acceptable
- **Symmetry groups**: Fixed as {0,4,8}, {1,3,6}, {2,5,7} based on physical puzzle book analysis
- **Uniqueness testing**: Test uniqueness after removing all 3 cells together (not individually)

**Complete Symmetry Mappings** (for implementation reference)

GROUP 1: Regions {0, 4, 8}
- Local 0: R0(0,8), R4(6,2), R8(6,14)
- Local 1: R0(1,7), R4(7,1), R8(7,13)
- Local 2: R0(1,8), R4(7,2), R8(7,14)
- Local 3: R0(1,9), R4(7,3), R8(7,15)
- Local 4: R0(2,6), R4(8,0), R8(8,12)
- Local 5: R0(2,7), R4(8,1), R8(8,13)
- Local 6: R0(2,8), R4(8,2), R8(8,14)
- Local 7: R0(2,9), R4(8,3), R8(8,15)
- Local 8: R0(2,10), R4(8,4), R8(8,16)

GROUP 2: Regions {1, 3, 6}
- Local 0: R1(3,5), R3(3,11), R6(6,8)
- Local 1: R1(4,4), R3(4,10), R6(7,7)
- Local 2: R1(4,5), R3(4,11), R6(7,8)
- Local 3: R1(4,6), R3(4,12), R6(7,9)
- Local 4: R1(5,3), R3(5,9), R6(8,6)
- Local 5: R1(5,4), R3(5,10), R6(8,7)
- Local 6: R1(5,5), R3(5,11), R6(8,8)
- Local 7: R1(5,6), R3(5,12), R6(8,9)
- Local 8: R1(5,7), R3(5,13), R6(8,10)

GROUP 3: Regions {2, 5, 7}
- Local 0: R2(3,6), R5(6,3), R7(6,9)
- Local 1: R2(3,7), R5(6,4), R7(6,10)
- Local 2: R2(3,8), R5(6,5), R7(6,11)
- Local 3: R2(3,9), R5(6,6), R7(6,12)
- Local 4: R2(3,10), R5(6,7), R7(6,13)
- Local 5: R2(4,7), R5(7,4), R7(7,10)
- Local 6: R2(4,8), R5(7,5), R7(7,11)
- Local 7: R2(4,9), R5(7,6), R7(7,12)
- Local 8: R2(5,8), R5(8,5), R7(8,11)

**Further Considerations**
1. **Initial solution symmetry** — Should we also generate the complete solution symmetrically? Currently `generateCompleteSolution()` fills randomly. Could pre-fill symmetric triplets to maintain symmetry throughout. *Recommendation*: Start with symmetric removal only, add symmetric generation later if needed.

2. **Performance impact** — Removing in groups of 3 means fewer iteration options (27 units vs 81 cells), might be harder to reach low given counts. *Recommendation*: Monitor if hard difficulty can still reach 22-30 givens with symmetry constraint. May need to adjust target ranges if necessary.

3. **Alternative symmetry patterns** — Physical books might use different symmetry patterns for different dates/pages. *Recommendation*: Start with strict 3-way rotational, add configuration option later if varied patterns are desired.

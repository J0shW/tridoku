import { describe, expect, it } from 'vitest'
import { runName } from '@/lib/run-names'

describe('runName (TRI-101)', () => {
  it('gives the same name for the same run and date', () => {
    expect(runName('medium', '2026-11-19')).toBe(runName('medium', '2026-11-19'))
  })

  it('changes from one day to the next', () => {
    expect(runName('easy', '2026-11-19')).not.toBe(runName('easy', '2026-11-20'))
  })

  it('works before the start of the list and far ahead', () => {
    expect(runName('hard', '2025-06-01')).toBeTruthy()
    expect(runName('hard', '2030-02-28')).toBeTruthy()
  })
})

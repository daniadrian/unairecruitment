import { describe, expect, it } from 'vitest'
import { formatCalendarDate } from './dateFormat.ts'

describe('formatCalendarDate', () => {
    it('shows a stored calendar date in full, independent of the time zone', () => {
        expect(formatCalendarDate('2026-10-13')).toMatch(/Tuesday,? 13 October 2026/)
    })

    it('returns a value that is not a date unchanged', () => {
        expect(formatCalendarDate('not-a-date')).toBe('not-a-date')
    })
})

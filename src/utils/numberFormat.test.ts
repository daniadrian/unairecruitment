import { describe, expect, it } from 'vitest'
import { formatFileSize, formatPercent } from './numberFormat.ts'

describe('formatFileSize', () => {
    it('shows bytes, kilobytes, and megabytes like the design', () => {
        expect(formatFileSize(512)).toBe('512 B')
        expect(formatFileSize(842 * 1024)).toBe('842 KB')
        expect(formatFileSize(Math.round(2.6 * 1024 * 1024))).toBe('2.6 MB')
    })
})

describe('formatPercent', () => {
    it('rounds the share of the total to a whole percent', () => {
        expect(formatPercent(58, 128)).toBe('45%')
        expect(formatPercent(17, 128)).toBe('13%')
    })

    it('returns 0% when the total is empty', () => {
        expect(formatPercent(0, 0)).toBe('0%')
    })
})

import { describe, expect, it } from 'vitest'
import { safeNextPath } from './safeNextPath.ts'

describe('safeNextPath', () => {
    it('accepts paths inside the application', () => {
        expect(safeNextPath('/my-applications')).toBe('/my-applications')
        expect(safeNextPath('/recruitments/abc/apply?x=1')).toBe('/recruitments/abc/apply?x=1')
    })

    it('rejects other sites and protocol-relative URLs', () => {
        expect(safeNextPath('https://example.com')).toBeNull()
        expect(safeNextPath('//example.com')).toBeNull()
        expect(safeNextPath('/\\example.com')).toBeNull()
    })

    it('rejects missing or repeated values', () => {
        expect(safeNextPath(undefined)).toBeNull()
        expect(safeNextPath(null)).toBeNull()
        expect(safeNextPath(['/a', '/b'])).toBeNull()
    })
})

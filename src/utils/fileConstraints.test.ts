import { describe, expect, it } from 'vitest'
import {
    MAX_FILE_SIZE_BYTES,
    hasPdfExtension,
    hasPdfMagicBytes,
    isWithinSizeLimit,
} from './fileConstraints.ts'

// AB-14 and AL-07.
describe('file constraints', () => {
    it('sets a 3 MB limit', () => {
        expect(MAX_FILE_SIZE_BYTES).toBe(3 * 1024 * 1024)
    })

    it('accepts a size exactly at the limit and rejects anything larger', () => {
        expect(isWithinSizeLimit(MAX_FILE_SIZE_BYTES)).toBe(true)
        expect(isWithinSizeLimit(MAX_FILE_SIZE_BYTES + 1)).toBe(false)
        expect(isWithinSizeLimit(0)).toBe(false)
    })

    it('checks the .pdf extension case-insensitively', () => {
        expect(hasPdfExtension('cv.pdf')).toBe(true)
        expect(hasPdfExtension('CV.PDF')).toBe(true)
        expect(hasPdfExtension('cv.docx')).toBe(false)
        expect(hasPdfExtension('cv')).toBe(false)
    })

    it('checks the %PDF- byte signature so a merely renamed file is rejected', () => {
        expect(hasPdfMagicBytes(new TextEncoder().encode('%PDF-1.7'))).toBe(true)
        expect(hasPdfMagicBytes(new TextEncoder().encode('PK\u0003\u0004'))).toBe(false)
        expect(hasPdfMagicBytes(new Uint8Array([0x25, 0x50]))).toBe(false)
    })
})

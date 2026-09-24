import { describe, expect, it } from 'vitest'
import { getInitials, maskEmail, shortReference, splitLines } from './textFormat.ts'

describe('shortReference', () => {
    it('uses the last eight characters of the UUID in upper case', () => {
        expect(shortReference('0192af3c-7b1e-7cc4-9a0d-4e2b3f9a21c4')).toBe('3F9A21C4')
    })

    it('ignores hyphens so the reference is always eight characters', () => {
        expect(shortReference('0192af3c-7b1e-7cc4-9a0d-000000-00c4')).toHaveLength(8)
    })
})

describe('getInitials', () => {
    it('takes the first letters of the first and last name', () => {
        expect(getInitials('Dimas Pratama')).toBe('DP')
        expect(getInitials('Anastasia Lumban Tobing')).toBe('AT')
    })

    it('handles a single name and extra spaces', () => {
        expect(getInitials('  rahel  ')).toBe('R')
    })

    it('falls back to a question mark for an empty name', () => {
        expect(getInitials('   ')).toBe('?')
    })
})

describe('maskEmail', () => {
    it('keeps the first character and the domain', () => {
        expect(maskEmail('dimas.pratama@mail.com')).toBe('d\u2022\u2022\u2022\u2022\u2022\u2022@mail.com')
    })

    it('returns text without an at sign unchanged', () => {
        expect(maskEmail('not-an-email')).toBe('not-an-email')
    })
})

describe('splitLines', () => {
    it('splits on new lines and drops empty lines', () => {
        expect(splitLines('Aged 18 or older\r\n\nAble to read English\n')).toEqual([
            'Aged 18 or older',
            'Able to read English',
        ])
    })

    it('removes list markers typed by the admin', () => {
        expect(splitLines('1. First\n2) Second\n- Third\n\u2022 Fourth')).toEqual([
            'First',
            'Second',
            'Third',
            'Fourth',
        ])
    })
})

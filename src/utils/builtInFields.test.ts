import { describe, expect, it } from 'vitest'
import { BUILT_IN_FIELD_NAMES, isBuiltInFieldName, normalizeFieldName } from './builtInFields.ts'

// AB-10 and AB-11.
describe('built-in fields', () => {
    it('contains five built-in fields', () => {
        expect(BUILT_IN_FIELD_NAMES).toEqual(['Name', 'Email', 'Contact Number', 'Motivation', 'CV'])
    })

    it('recognizes built-in field names regardless of letter case and extra spaces', () => {
        expect(isBuiltInFieldName('name')).toBe(true)
        expect(isBuiltInFieldName('  Contact   Number ')).toBe(true)
        expect(isBuiltInFieldName('cv')).toBe(true)
        expect(isBuiltInFieldName('Portfolio')).toBe(false)
    })

    it('normalizes field names for comparison', () => {
        expect(normalizeFieldName('  Portfolio   Link ')).toBe('portfolio link')
    })
})

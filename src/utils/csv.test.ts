import { describe, expect, it } from 'vitest'
import { buildCsv, escapeCsvValue } from './csv.ts'

// AB-15 and AL-06.
describe('CSV builder', () => {
    it('leaves simple values unchanged', () => {
        expect(escapeCsvValue('Budi')).toBe('Budi')
        expect(escapeCsvValue('')).toBe('')
    })

    it('quotes values that contain commas, quotes, or newlines', () => {
        expect(escapeCsvValue('Budi, S.Kom')).toBe('"Budi, S.Kom"')
        expect(escapeCsvValue('dia bilang "halo"')).toBe('"dia bilang ""halo"""')
        expect(escapeCsvValue('baris satu\nbaris dua')).toBe('"baris satu\nbaris dua"')
    })

    it('builds the header and rows with CRLF line endings', () => {
        const csv = buildCsv(['Name', 'Status'], [['Budi', 'Pending'], ['Siti', 'Accepted']])
        expect(csv).toBe('Name,Status\r\nBudi,Pending\r\nSiti,Accepted\r\n')
    })

    it('produces only the header when there is no data', () => {
        expect(buildCsv(['Name'], [])).toBe('Name\r\n')
    })
})

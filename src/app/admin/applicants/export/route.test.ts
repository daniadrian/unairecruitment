import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActionResult } from '../../../../types/actionResult.ts'

type CsvExport = { fileName: string; content: string }

const handleExportCsv = vi.fn<() => Promise<ActionResult<CsvExport>>>(async () => ({
    ok: true,
    data: { fileName: 'applicants-2026-09-21.csv', content: 'Name\r\nBudi\r\n' },
}))

vi.mock('../../../../controllers/applicantManagementController.ts', () => ({
    ApplicantManagementController: class {
        handleExportCsv = handleExportCsv
    },
}))

const { GET } = await import('./route.ts')

// UC-17 (optional).
describe('GET /admin/applicants/export', () => {
    beforeEach(() => {
        handleExportCsv.mockClear()
    })

    it('sends the CSV as a download with a UTF-8 BOM', async () => {
        const response = await GET(new Request('https://example.com/admin/applicants/export'))

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8')
        expect(response.headers.get('content-disposition')).toContain('applicants-2026-09-21.csv')

        // The BOM is checked on the raw bytes because Response.text() strips it while decoding.
        const bytes = new Uint8Array(await response.arrayBuffer())
        expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
        expect(new TextDecoder().decode(bytes.slice(3))).toBe('Name\r\nBudi\r\n')
    })

    it('passes along the active applicant list filters', async () => {
        await GET(
            new Request('https://example.com/admin/applicants/export?keyword=budi&recruitmentId=rec-1&status=PENDING'),
        )

        expect(handleExportCsv).toHaveBeenCalledWith({
            keyword: 'budi',
            recruitmentId: 'rec-1',
            status: 'PENDING',
        })
    })

    it('returns 403 when the user is not an admin', async () => {
        handleExportCsv.mockResolvedValueOnce({
            ok: false,
            error: 'You are not allowed to access applicant data.',
            code: 'FORBIDDEN',
        })

        const response = await GET(new Request('https://example.com/admin/applicants/export'))

        expect(response.status).toBe(403)
    })
})

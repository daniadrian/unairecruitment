import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActionResult } from '../../../../types/actionResult.ts'

const handleDownloadFile = vi.fn<() => Promise<ActionResult<{ url: string }>>>(async () => ({
    ok: true,
    data: { url: 'https://storage.example/signed' },
}))

vi.mock('../../../../controllers/applicantManagementController.ts', () => ({
    ApplicantManagementController: class {
        handleDownloadFile = handleDownloadFile
    },
}))

const { GET } = await import('./route.ts')

function params(id: string) {
    return { params: Promise.resolve({ id }) }
}

// UC-16 and AL-07.
describe('GET /admin/files/[id]', () => {
    beforeEach(() => {
        handleDownloadFile.mockClear()
    })

    it('rejects a request without an application ID with 400', async () => {
        const response = await GET(new Request('https://example.com/admin/files/file-1'), params('file-1'))

        expect(response.status).toBe(400)
        expect(handleDownloadFile).not.toHaveBeenCalled()
    })

    it('redirects to the signed URL when the file belongs to that application', async () => {
        const response = await GET(
            new Request('https://example.com/admin/files/file-1?application=app-1'),
            params('file-1'),
        )

        expect(response.status).toBe(302)
        expect(response.headers.get('location')).toBe('https://storage.example/signed')
        expect(handleDownloadFile).toHaveBeenCalledWith('app-1', 'file-1')
    })

    it('returns 403 when the user is not an admin', async () => {
        handleDownloadFile.mockResolvedValueOnce({
            ok: false,
            error: 'You are not allowed to access applicant data.',
            code: 'FORBIDDEN',
        })

        const response = await GET(
            new Request('https://example.com/admin/files/file-1?application=app-1'),
            params('file-1'),
        )

        expect(response.status).toBe(403)
    })

    it('returns 404 when the file does not belong to that application', async () => {
        handleDownloadFile.mockResolvedValueOnce({
            ok: false,
            error: 'File not found in this application.',
            code: 'NOT_FOUND',
        })

        const response = await GET(
            new Request('https://example.com/admin/files/file-1?application=app-1'),
            params('file-1'),
        )

        expect(response.status).toBe(404)
    })
})

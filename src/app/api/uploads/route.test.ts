import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_FILE_SIZE_BYTES } from '../../../utils/fileConstraints.ts'
import type { ActionResult } from '../../../types/actionResult.ts'
import type { UploadedFile } from '../../../types/applications/uploadedFile.ts'

const uploadFile = vi.fn<() => Promise<ActionResult<UploadedFile>>>(async () => ({
    ok: true,
    data: { id: 'file-1', originalName: 'cv.pdf', sizeBytes: 1024 },
}))

vi.mock('../../../controllers/applicationController.ts', () => ({
    ApplicationController: class {
        uploadFile = uploadFile
    },
}))

const { POST } = await import('./route.ts')

function uploadRequest(file: File, purpose = 'CV'): Request {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('purpose', purpose)
    return new Request('https://example.com/api/uploads', { method: 'POST', body: formData })
}

function pdfFile(size = 1024, name = 'cv.pdf'): File {
    const bytes = new Uint8Array(size)
    bytes.set(new TextEncoder().encode('%PDF-'), 0)
    return new File([bytes], name, { type: 'application/pdf' })
}

// KA-06 and AL-07.
describe('POST /api/uploads', () => {
    beforeEach(() => {
        uploadFile.mockClear()
    })

    it('rejects a request without a file with 400', async () => {
        const formData = new FormData()
        formData.append('purpose', 'CV')
        const response = await POST(
            new Request('https://example.com/api/uploads', { method: 'POST', body: formData }),
        )

        expect(response.status).toBe(400)
        expect(uploadFile).not.toHaveBeenCalled()
    })

    it('rejects files over 3 MB with 413 before reaching the controller', async () => {
        const response = await POST(uploadRequest(pdfFile(MAX_FILE_SIZE_BYTES + 1)))

        expect(response.status).toBe(413)
        expect(uploadFile).not.toHaveBeenCalled()
    })

    it('returns 201 and the file data when the upload succeeds', async () => {
        const response = await POST(uploadRequest(pdfFile()))

        expect(response.status).toBe(201)
        expect(await response.json()).toEqual({ id: 'file-1', originalName: 'cv.pdf', sizeBytes: 1024 })
        expect(uploadFile).toHaveBeenCalledWith(
            expect.objectContaining({ purpose: 'CV', fileName: 'cv.pdf' }),
        )
    })

    it('treats any purpose other than CV as a custom field file', async () => {
        await POST(uploadRequest(pdfFile(10, 'certificate.png'), 'ATTACHMENT'))

        expect(uploadFile).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'ATTACHMENT' }))
    })

    it('maps controller failures to the matching HTTP status', async () => {
        uploadFile.mockResolvedValueOnce({
            ok: false,
            error: 'Session not found. Please sign in again.',
            code: 'UNAUTHENTICATED',
        })
        const unauthenticated = await POST(uploadRequest(pdfFile()))

        uploadFile.mockResolvedValueOnce({
            ok: false,
            error: 'Only applicants can upload files.',
            code: 'FORBIDDEN',
        })
        const forbidden = await POST(uploadRequest(pdfFile()))

        uploadFile.mockResolvedValueOnce({
            ok: false,
            error: 'The CV file must be a .pdf.',
            code: 'VALIDATION',
        })
        const invalid = await POST(uploadRequest(pdfFile()))

        expect(unauthenticated.status).toBe(401)
        expect(forbidden.status).toBe(403)
        expect(invalid.status).toBe(400)
    })
})

import { ApplicationController } from '../../../controllers/applicationController.ts'
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../../../utils/fileConstraints.ts'
import { HTTP_STATUS_BY_ERROR_CODE, jsonResponse } from '../../httpStatus.ts'
import type { UploadPurpose } from '../../../controllers/applicationController.ts'

// KA-06 and 06 section 6: one request per file, at most 3 MB, well below
// the 4.5 MB per-request limit of Vercel. File content validation is done by the controller (AL-07).

export async function POST(request: Request): Promise<Response> {
    let formData: FormData
    try {
        formData = await request.formData()
    } catch {
        return jsonResponse({ error: 'Invalid request.' }, 400)
    }

    const file = formData.get('file')
    if (!(file instanceof File)) {
        return jsonResponse({ error: 'No file was found in the request.' }, 400)
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return jsonResponse({ error: `Files can be at most ${MAX_FILE_SIZE_MB} MB.` }, 413)
    }

    const purposeValue = formData.get('purpose')
    const purpose: UploadPurpose = purposeValue === 'CV' ? 'CV' : 'ATTACHMENT'

    const data = new Uint8Array(await file.arrayBuffer())
    const result = await new ApplicationController().uploadFile({
        purpose,
        fileName: file.name,
        mimeType: file.type,
        data,
    })

    if (!result.ok) {
        return jsonResponse({ error: result.error }, HTTP_STATUS_BY_ERROR_CODE[result.code])
    }

    return jsonResponse(result.data, 201)
}

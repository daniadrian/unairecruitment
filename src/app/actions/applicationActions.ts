'use server'

import { ApplicationController } from '../../controllers/applicationController.ts'
import { fail } from '../../utils/actionResult.ts'
import type { ActionResult } from '../../types/actionResult.ts'
import type { ApplicationAnswerInput } from '../../types/inputs/applicationAnswerInput.ts'

// UC-07 adapter. Files are uploaded beforehand through POST /api/uploads,
// so the form only carries file IDs (KA-06).

function text(formData: FormData, key: string): string {
    const value = formData.get(key)
    return typeof value === 'string' ? value : ''
}

function parseAnswers(raw: string): ApplicationAnswerInput[] | null {
    if (raw.trim() === '') return []
    try {
        const parsed: unknown = JSON.parse(raw)
        if (!Array.isArray(parsed)) return null
        return parsed as ApplicationAnswerInput[]
    } catch {
        return null
    }
}

export async function submitApplicationAction(
    _prevState: ActionResult<{ applicationId: string }> | null,
    formData: FormData,
): Promise<ActionResult<{ applicationId: string }>> {
    const answers = parseAnswers(text(formData, 'answers'))
    if (answers === null) return fail('The form answers could not be read.', 'VALIDATION')

    const cvFileId = text(formData, 'cvFileId')

    return new ApplicationController().submitApplication({
        recruitmentId: text(formData, 'recruitmentId'),
        name: text(formData, 'name'),
        email: text(formData, 'email'),
        contactNumber: text(formData, 'contactNumber'),
        motivation: text(formData, 'motivation'),
        cvFileId: cvFileId === '' ? null : cvFileId,
        answers,
    })
}

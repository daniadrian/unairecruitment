'use server'

import { RecruitmentController } from '../../controllers/recruitmentController.ts'
import { fail } from '../../utils/actionResult.ts'
import type { ActionResult } from '../../types/actionResult.ts'
import type { RecruitmentFieldInput } from '../../types/inputs/recruitmentFieldInput.ts'
import type { RecruitmentStatus } from '../../types/recruitmentStatus.ts'

// UC-10 and UC-11 adapter. Custom fields are sent as JSON in one hidden input
// because their number is dynamic; the adapter only parses the transport, validation is in the controller.

function text(formData: FormData, key: string): string {
    const value = formData.get(key)
    return typeof value === 'string' ? value : ''
}

function parseFields(raw: string): RecruitmentFieldInput[] | null {
    if (raw.trim() === '') return []
    try {
        const parsed: unknown = JSON.parse(raw)
        if (!Array.isArray(parsed)) return null
        return parsed as RecruitmentFieldInput[]
    } catch {
        return null
    }
}

export async function saveRecruitmentAction(
    _prevState: ActionResult<{ id: string }> | null,
    formData: FormData,
): Promise<ActionResult<{ id: string }>> {
    const fields = parseFields(text(formData, 'fields'))
    if (fields === null) return fail('The form field settings could not be read.', 'VALIDATION')

    const id = text(formData, 'id')

    return new RecruitmentController().submitRecruitment(
        {
            title: text(formData, 'title'),
            division: text(formData, 'division'),
            description: text(formData, 'description'),
            requirements: text(formData, 'requirements'),
            fields,
        },
        id === '' ? null : id,
    )
}

// UC-09 adapter (AB-04): opens or closes a recruitment.
export async function updateRecruitmentStatusAction(
    _prevState: ActionResult<{ id: string; status: RecruitmentStatus }> | null,
    formData: FormData,
): Promise<ActionResult<{ id: string; status: RecruitmentStatus }>> {
    return new RecruitmentController().setStatus(
        text(formData, 'id'),
        text(formData, 'status') as RecruitmentStatus,
    )
}

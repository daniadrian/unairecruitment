'use server'

import { ApplicantManagementController } from '../../controllers/applicantManagementController.ts'
import type { ActionResult } from '../../types/actionResult.ts'
import type { ApplicationStatus } from '../../types/applicationStatus.ts'

// UC-14 adapter. Status transition validation is done by the controller (AL-01).

function text(formData: FormData, key: string): string {
    const value = formData.get(key)
    return typeof value === 'string' ? value : ''
}

export async function saveStatusAction(
    _prevState: ActionResult<{ status: ApplicationStatus }> | null,
    formData: FormData,
): Promise<ActionResult<{ status: ApplicationStatus }>> {
    return new ApplicantManagementController().saveStatus(
        text(formData, 'applicationId'),
        text(formData, 'status') as ApplicationStatus,
    )
}

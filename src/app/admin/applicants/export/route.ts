import { ApplicantManagementController } from '../../../../controllers/applicantManagementController.ts'
import { HTTP_STATUS_BY_ERROR_CODE, jsonResponse } from '../../../httpStatus.ts'
import type { ApplicationStatus } from '../../../../types/applicationStatus.ts'

// UC-17 (optional). The filters active on the applicant list are sent along
// as a query so the export matches what the admin sees.

export async function GET(request: Request): Promise<Response> {
    const params = new URL(request.url).searchParams

    const result = await new ApplicantManagementController().handleExportCsv({
        keyword: params.get('keyword'),
        recruitmentId: params.get('recruitmentId'),
        status: params.get('status') as ApplicationStatus | null,
    })

    if (!result.ok) {
        return jsonResponse({ error: result.error }, HTTP_STATUS_BY_ERROR_CODE[result.code])
    }

    // BOM so that Excel reads UTF-8 correctly.
    return new Response(`﻿${result.data.content}`, {
        status: 200,
        headers: {
            'content-type': 'text/csv; charset=utf-8',
            'content-disposition': `attachment; filename="${result.data.fileName}"`,
        },
    })
}

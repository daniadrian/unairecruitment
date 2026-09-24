import { ApplicantManagementController } from '../../../../controllers/applicantManagementController.ts'
import { HTTP_STATUS_BY_ERROR_CODE, jsonResponse } from '../../../httpStatus.ts'

// UC-16 and AL-07. The application ID is sent through the `application` query so the controller can
// confirm the file belongs to that application before issuing a signed URL.
// The Admin role is checked in the controller (L-5).

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> },
): Promise<Response> {
    const { id } = await context.params
    const applicationId = new URL(request.url).searchParams.get('application') ?? ''

    if (applicationId === '') {
        return jsonResponse({ error: 'The application that owns the file was not specified.' }, 400)
    }

    const result = await new ApplicantManagementController().handleDownloadFile(applicationId, id)
    if (!result.ok) {
        return jsonResponse({ error: result.error }, HTTP_STATUS_BY_ERROR_CODE[result.code])
    }

    return Response.redirect(result.data.url, 302)
}

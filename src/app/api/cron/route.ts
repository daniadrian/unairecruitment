import { timingSafeEqual } from 'node:crypto'
import { MaintenanceController } from '../../../controllers/maintenanceController.ts'
import { HTTP_STATUS_BY_ERROR_CODE, jsonResponse } from '../../httpStatus.ts'

// KS-12. Scheduled by Vercel Cron once a day (vercel.json). Requests without an
// Authorization header matching CRON_SECRET are rejected before the controller runs.
// CRON_SECRET is read directly here because it belongs to the transport layer, not data.

function isAuthorized(request: Request): boolean {
    const secret = process.env.CRON_SECRET
    if (!secret) return false

    const header = request.headers.get('authorization') ?? ''
    const expected = `Bearer ${secret}`
    const headerBytes = Buffer.from(header)
    const expectedBytes = Buffer.from(expected)
    if (headerBytes.length !== expectedBytes.length) return false

    return timingSafeEqual(headerBytes, expectedBytes)
}

export async function GET(request: Request): Promise<Response> {
    if (!isAuthorized(request)) {
        return jsonResponse({ error: 'Unauthorized.' }, 401)
    }

    const result = await new MaintenanceController().handleDailyMaintenance()
    if (!result.ok) {
        return jsonResponse({ error: result.error }, HTTP_STATUS_BY_ERROR_CODE[result.code])
    }

    return jsonResponse(result.data, 200)
}

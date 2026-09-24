import type { ActionErrorCode } from '../types/actionErrorCode.ts'

// Maps action failure kinds to HTTP statuses. Used only by the routing layer;
// user-facing messages still come from the controller (V-9).
export const HTTP_STATUS_BY_ERROR_CODE: Record<ActionErrorCode, number> = {
    VALIDATION: 400,
    UNAUTHENTICATED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    PAYLOAD_TOO_LARGE: 413,
    RATE_LIMITED: 429,
    INTERNAL: 500,
}

export function jsonResponse(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json; charset=utf-8' },
    })
}

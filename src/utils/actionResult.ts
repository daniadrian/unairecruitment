import type { ActionErrorCode } from '../types/actionErrorCode.ts'
import type { ActionResult } from '../types/actionResult.ts'

// C-7: a uniform action result shape for every controller.

export function ok(): ActionResult<undefined>
export function ok<T>(data: T): ActionResult<T>
export function ok<T>(data?: T): ActionResult<T | undefined> {
    return { ok: true, data }
}

export function fail(
    error: string,
    code: ActionErrorCode = 'VALIDATION',
    fieldErrors?: Record<string, string>,
): ActionResult<never> {
    return fieldErrors ? { ok: false, error, code, fieldErrors } : { ok: false, error, code }
}

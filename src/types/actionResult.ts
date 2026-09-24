import type { ActionErrorCode } from './actionErrorCode.ts'

// C-7: controller action result the view can act on.
// `fieldErrors` maps form field names to their error messages (V-9),
// while `code` states the kind of failure so routing adapters can pick an HTTP status.
export type ActionResult<T = undefined> =
    | { ok: true; data: T }
    | { ok: false; error: string; code: ActionErrorCode; fieldErrors?: Record<string, string> }

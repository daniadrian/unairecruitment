import type { ActionResult } from '../../../types/actionResult.ts'

// Reads the controller's messages from an action result (V-9: the text comes from the controller).

export function formErrorOf(result: ActionResult<unknown> | null): string | null {
    return result && !result.ok ? result.error : null
}

export function fieldErrorOf(result: ActionResult<unknown> | null, key: string): string | undefined {
    return result && !result.ok ? result.fieldErrors?.[key] : undefined
}

import type { ActionResult } from './actionResult.ts'

// Signature of the Server Action adapters in src/app/actions as used with useActionState.
// Views receive them as props (05 section 4.6: interactive components get props and actions).
export type FormAction<T> = (previous: ActionResult<T> | null, formData: FormData) => Promise<ActionResult<T>>

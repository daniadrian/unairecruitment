import type { ActionResult } from '../actionResult.ts'

// UC-04: the sign-out Server Action adapter handed to the navigation components.
export type SignOutAction = () => Promise<ActionResult<undefined>>

import { notFound, redirect } from 'next/navigation'
import type { ActionResult } from '../../../types/actionResult.ts'

// Turns controller failures that have a navigation meaning into navigation: a lost session
// goes to sign in, a missing record shows the 404 page, and a wrong role goes home. Other
// failures stay on the screen with the controller's message (V-9).
export function redirectOnFailure(result: ActionResult<unknown>, currentPath: string): void {
    if (result.ok) return
    if (result.code === 'UNAUTHENTICATED') redirect(`/login?next=${encodeURIComponent(currentPath)}`)
    if (result.code === 'FORBIDDEN') redirect('/')
    if (result.code === 'NOT_FOUND') notFound()
}

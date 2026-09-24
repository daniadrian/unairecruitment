import { cache } from 'react'
import { AuthController } from '../../../controllers/authController.ts'
import type { SessionUser } from '../../../types/auth/sessionUser.ts'

// The signed-in user for the current request, read once through the controller's identity
// path (05 section 4.8) and shared by shells, guards, and screens via React's per-request
// cache. Server components only.
export const getViewer = cache(async (): Promise<SessionUser | null> => {
    return new AuthController().getCurrentUser()
})

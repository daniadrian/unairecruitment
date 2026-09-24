import { redirect } from 'next/navigation'
import { getViewer } from './getViewer.ts'
import { homePathFor } from './homePath.ts'
import type { SessionUser } from '../../../types/auth/sessionUser.ts'
import type { UserRole } from '../../../types/userRole.ts'

// V-5 route guard for protected screens. It only reads identity through the controller and
// redirects: guests go to sign in (and come back afterwards), the other role goes home.
// Authorization itself is enforced again by every controller action (L-5). Screens call it
// directly because layouts are not re-rendered on client-side navigation.
export async function requireViewer(role: UserRole, currentPath: string): Promise<SessionUser> {
    const viewer = await getViewer()
    if (!viewer) redirect(`/login?next=${encodeURIComponent(currentPath)}`)
    if (viewer.role !== role) redirect(homePathFor(viewer.role))
    return viewer
}

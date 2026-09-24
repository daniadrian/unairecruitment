import type { ReactNode } from 'react'
import BrandNav from '../brand/brandNav.tsx'
import { getViewer } from '../guards/getViewer.ts'
import SkipLink from './skipLink.tsx'
import type { SignOutAction } from '../../../types/auth/signOutAction.ts'

// Frame of the admin area: the dark teal navigation bar over the page tint. The admin chrome is
// only drawn for admins; for anyone else the screen itself redirects (requireViewer and the
// controllers' own role checks), so no admin navigation is ever shown to them.
export default async function AdminShell({
    signOut,
    children,
}: {
    signOut: SignOutAction
    children: ReactNode
}) {
    const viewer = await getViewer()
    if (viewer?.role !== 'ADMIN') return <>{children}</>

    return (
        <div className="flex min-h-dvh flex-col bg-page">
            <SkipLink />
            <BrandNav variant="admin" signOut={signOut} />
            <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
                {children}
            </main>
        </div>
    )
}

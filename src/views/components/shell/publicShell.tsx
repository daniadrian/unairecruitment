import { Suspense, type ReactNode } from 'react'
import BrandNav, { BrandNavFallback } from '../brand/brandNav.tsx'
import SkipLink from './skipLink.tsx'
import type { SignOutAction } from '../../../types/auth/signOutAction.ts'

// Frame of the public and applicant pages. Reading the session only affects the navigation
// bar, so it streams inside its own Suspense boundary instead of holding back the page.
export default function PublicShell({ signOut, children }: { signOut: SignOutAction; children: ReactNode }) {
    return (
        <div className="flex min-h-dvh flex-col bg-page">
            <SkipLink />
            <Suspense fallback={<BrandNavFallback variant="public" />}>
                <BrandNav variant="public" signOut={signOut} />
            </Suspense>
            <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
                {children}
            </main>
        </div>
    )
}

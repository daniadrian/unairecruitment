'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import type { SignOutAction } from '../../../types/auth/signOutAction.ts'

// UC-04: ends the session through the Server Action, then shows the sign-in page (C-5: the
// view decides navigation from the result).
export function useSignOut(signOut: SignOutAction): { isSigningOut: boolean; handleSignOut: () => void } {
    const router = useRouter()
    const [isSigningOut, startTransition] = useTransition()

    function handleSignOut() {
        startTransition(async () => {
            await signOut()
            router.replace('/login')
            router.refresh()
        })
    }

    return { isSigningOut, handleSignOut }
}

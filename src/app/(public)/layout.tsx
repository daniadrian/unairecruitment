import type { ReactNode } from 'react'
import PublicShell from '../../views/components/shell/publicShell.tsx'
import { logoutAction } from '../actions/authActions.ts'

// V-8: public route group (visible without signing in, AB-09).
export default function PublicLayout({ children }: { children: ReactNode }) {
    return <PublicShell signOut={logoutAction}>{children}</PublicShell>
}

import type { ReactNode } from 'react'
import PublicShell from '../../views/components/shell/publicShell.tsx'
import { logoutAction } from '../actions/authActions.ts'

// V-8: protected route group for applicants. Each screen guards itself (requireViewer),
// because layouts are not re-rendered on client-side navigation.
export default function ApplicantLayout({ children }: { children: ReactNode }) {
    return <PublicShell signOut={logoutAction}>{children}</PublicShell>
}

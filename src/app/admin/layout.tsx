import type { ReactNode } from 'react'
import AdminShell from '../../views/components/shell/adminShell.tsx'
import { logoutAction } from '../actions/authActions.ts'

// V-8: admin route group. Each screen guards itself (requireViewer) and every admin
// controller action checks the role again on the server (L-5).
export default function AdminLayout({ children }: { children: ReactNode }) {
    return <AdminShell signOut={logoutAction}>{children}</AdminShell>
}

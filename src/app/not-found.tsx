import NotFoundPanel from '../views/components/feedback/notFoundPanel.tsx'
import PublicShell from '../views/components/shell/publicShell.tsx'
import { logoutAction } from './actions/authActions.ts'

// Unmatched URLs anywhere in the application.
export default function NotFound() {
    return (
        <PublicShell signOut={logoutAction}>
            <NotFoundPanel area="public" />
        </PublicShell>
    )
}

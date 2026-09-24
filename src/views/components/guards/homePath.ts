import type { UserRole } from '../../../types/userRole.ts'

// Home page per role (F_UNAIREC_02_03): admins land on the dashboard, applicants and guests
// on the list of open roles.
export function homePathFor(role: UserRole | null): string {
    return role === 'ADMIN' ? '/admin/dashboard' : '/recruitments'
}

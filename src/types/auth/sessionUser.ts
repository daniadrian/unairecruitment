import type { UserRole } from '../userRole.ts'

// Identity that may reach the view; without passwordHash (05 section 4.2).
export interface SessionUser {
    id: string
    name: string
    email: string
    role: UserRole
}

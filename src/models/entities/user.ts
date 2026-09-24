import type { UserRole } from '../../types/userRole.ts'

export interface User {
    id: string
    name: string
    email: string
    // Empty for the seeded admin account; required when an applicant registers (01 section 4.2).
    contactNumber: string | null
    passwordHash: string
    role: UserRole
    createdAt: Date
}

import type { ApplicationStatus } from '../applicationStatus.ts'

// Search by name or email and filter by recruitment and status (UC-12).
export interface ApplicantFilter {
    keyword: string | null
    recruitmentId: string | null
    status: ApplicationStatus | null
}

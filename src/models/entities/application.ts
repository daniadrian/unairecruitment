import type { ApplicationStatus } from '../../types/applicationStatus.ts'

export interface Application {
    id: string
    userId: string
    recruitmentId: string
    name: string
    email: string
    contactNumber: string
    motivation: string
    // Empty when the applicant did not attach a CV (AB-10).
    cvFileId: string | null
    status: ApplicationStatus
    submittedAt: Date
}

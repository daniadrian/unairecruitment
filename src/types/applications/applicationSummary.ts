import type { ApplicationStatus } from '../applicationStatus.ts'

// One row in an application list: UC-08 (own applications) and UC-12 (all applications).
export interface ApplicationSummary {
    id: string
    name: string
    email: string
    recruitmentId: string
    recruitmentTitle: string
    recruitmentDivision: string
    status: ApplicationStatus
    submittedAt: Date
}

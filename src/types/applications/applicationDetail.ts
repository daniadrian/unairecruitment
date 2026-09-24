import type { ApplicationStatus } from '../applicationStatus.ts'
import type { ApplicationAnswerDetail } from './applicationAnswerDetail.ts'
import type { ApplicationFile } from './applicationFile.ts'

// Details of one application with its answers and files (UC-13, UC-16, UC-17).
export interface ApplicationDetail {
    id: string
    userId: string
    name: string
    email: string
    contactNumber: string
    motivation: string
    status: ApplicationStatus
    submittedAt: Date
    recruitmentId: string
    recruitmentTitle: string
    recruitmentDivision: string
    cvFile: ApplicationFile | null
    answers: ApplicationAnswerDetail[]
}

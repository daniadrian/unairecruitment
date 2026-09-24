import type { RecruitmentDetail } from '../recruitments/recruitmentDetail.ts'

// Application form content (UC-07): recruitment settings plus the account data
// the applicant can reuse (AB-05).
export interface ApplicationFormData {
    recruitment: RecruitmentDetail
    account: {
        name: string
        email: string
        contactNumber: string
    }
}

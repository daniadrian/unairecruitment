import type { ApplicationStatus } from '../applicationStatus.ts'
import type { RecruitmentApplicationCount } from './recruitmentApplicationCount.ts'

// Recruitment statistics summary (UC-18).
export interface RecruitmentStatistics {
    totalApplications: number
    countByStatus: Record<ApplicationStatus, number>
    perRecruitment: RecruitmentApplicationCount[]
}

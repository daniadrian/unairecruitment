import type { RecruitmentStatus } from '../../types/recruitmentStatus.ts'

export interface Recruitment {
    id: string
    title: string
    division: string
    description: string
    requirements: string
    status: RecruitmentStatus
    createdAt: Date
    updatedAt: Date
}

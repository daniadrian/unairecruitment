import { ApplicationRepository } from '../models/repositories/applicationRepository.ts'
import { AuthRepository } from '../models/repositories/authRepository.ts'
import { fail, ok } from '../utils/actionResult.ts'
import type { ActionResult } from '../types/actionResult.ts'
import type { RecruitmentStatistics } from '../types/dashboard/recruitmentStatistics.ts'

// UC-18 (optional). F_UNAIREC_18_01: total applications, counts per status, and counts per recruitment.

export class DashboardController {
    constructor(
        private readonly applicationRepository = new ApplicationRepository(),
        private readonly authRepository = new AuthRepository(),
    ) {}

    public async loadStatistics(): Promise<ActionResult<RecruitmentStatistics>> {
        const user = await this.authRepository.getSessionUser()
        if (!user) return fail('Session not found. Please sign in again.', 'UNAUTHENTICATED')
        if (user.role !== 'ADMIN') return fail('You are not allowed to access the dashboard.', 'FORBIDDEN')

        const [countByStatus, perRecruitment] = await Promise.all([
            this.applicationRepository.countByStatus(),
            this.applicationRepository.countByRecruitment(),
        ])

        const totalApplications = Object.values(countByStatus).reduce((sum, count) => sum + count, 0)

        return ok({ totalApplications, countByStatus, perRecruitment })
    }
}

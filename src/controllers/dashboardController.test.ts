import { describe, expect, it, vi } from 'vitest'
import { DashboardController } from './dashboardController.ts'
import type { ApplicationRepository } from '../models/repositories/applicationRepository.ts'
import type { AuthRepository } from '../models/repositories/authRepository.ts'
import type { SessionUser } from '../types/auth/sessionUser.ts'

// UC-18 (optional).

const admin: SessionUser = { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'ADMIN' }
const applicant: SessionUser = { id: 'user-1', name: 'Budi', email: 'budi@example.com', role: 'APPLICANT' }

function buildController(sessionUser: SessionUser | null = admin) {
    const applicationRepository = {
        countByStatus: vi.fn(async () => ({ PENDING: 3, INTERVIEW: 2, ACCEPTED: 1, REJECTED: 4 })),
        countByRecruitment: vi.fn(async () => [
            { recruitmentId: 'rec-1', title: 'Product Manager', division: 'Product', total: 6 },
            { recruitmentId: 'rec-2', title: 'Desainer', division: 'Desain', total: 4 },
        ]),
    }
    const authRepository = { getSessionUser: vi.fn(async () => sessionUser) }

    const controller = new DashboardController(
        applicationRepository as unknown as ApplicationRepository,
        authRepository as unknown as AuthRepository,
    )
    return { controller, applicationRepository }
}

describe('DashboardController.loadStatistics (UC-18)', () => {
    it('rejects signed-out users and applicants', async () => {
        const anonymous = await buildController(null).controller.loadStatistics()
        const asApplicant = await buildController(applicant).controller.loadStatistics()

        expect(anonymous.ok).toBe(false)
        expect(asApplicant.ok).toBe(false)
        if (anonymous.ok || asApplicant.ok) return
        expect(anonymous.code).toBe('UNAUTHENTICATED')
        expect(asApplicant.code).toBe('FORBIDDEN')
    })

    it('computes the total applications from the per-status counts', async () => {
        const { controller } = buildController()
        const result = await controller.loadStatistics()

        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.data.totalApplications).toBe(10)
        expect(result.data.countByStatus).toEqual({ PENDING: 3, INTERVIEW: 2, ACCEPTED: 1, REJECTED: 4 })
        expect(result.data.perRecruitment).toHaveLength(2)
    })
})

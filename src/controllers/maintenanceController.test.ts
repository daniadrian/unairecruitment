import { describe, expect, it, vi } from 'vitest'
import { MaintenanceController } from './maintenanceController.ts'
import { ORPHAN_FILE_MIN_AGE_MS } from '../utils/fileConstraints.ts'
import type { AuthRepository } from '../models/repositories/authRepository.ts'
import type { FileRepository } from '../models/repositories/fileRepository.ts'

// KS-12 and 06 section 6 step 5.

function buildController() {
    const fileRepository = { deleteUnreferenced: vi.fn(async () => 2) }
    const authRepository = { deleteExpiredSessions: vi.fn(async () => 5) }

    const controller = new MaintenanceController(
        fileRepository as unknown as FileRepository,
        authRepository as unknown as AuthRepository,
    )
    return { controller, fileRepository, authRepository }
}

describe('MaintenanceController.handleDailyMaintenance', () => {
    it('only deletes orphaned files older than 24 hours', async () => {
        const { controller, fileRepository } = buildController()
        const before = Date.now()

        const result = await controller.handleDailyMaintenance()

        expect(result.ok).toBe(true)
        const [cutoff] = fileRepository.deleteUnreferenced.mock.calls[0] as unknown as [Date]
        const age = before - cutoff.getTime()
        expect(age).toBeGreaterThanOrEqual(ORPHAN_FILE_MIN_AGE_MS - 5_000)
        expect(age).toBeLessThanOrEqual(ORPHAN_FILE_MIN_AGE_MS + 5_000)
    })

    it('reports the number of files and sessions cleaned up', async () => {
        const { controller } = buildController()
        const result = await controller.handleDailyMaintenance()

        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.data).toEqual({ deletedFiles: 2, deletedSessions: 5 })
    })
})

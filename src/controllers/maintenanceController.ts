import { AuthRepository } from '../models/repositories/authRepository.ts'
import { FileRepository } from '../models/repositories/fileRepository.ts'
import { ok } from '../utils/actionResult.ts'
import { ORPHAN_FILE_MIN_AGE_MS } from '../utils/fileConstraints.ts'
import type { ActionResult } from '../types/actionResult.ts'

// KS-12: daily job called by Vercel Cron. Besides removing orphaned files and
// expired sessions, the call provides daily database activity so the free-plan
// Supabase project is not paused. Not a use case.
//
// The route adapter checks CRON_SECRET before this controller is called.

export interface MaintenanceSummary {
    deletedFiles: number
    deletedSessions: number
}

export class MaintenanceController {
    constructor(
        private readonly fileRepository = new FileRepository(),
        private readonly authRepository = new AuthRepository(),
    ) {}

    public async handleDailyMaintenance(): Promise<ActionResult<MaintenanceSummary>> {
        const now = Date.now()
        const deletedFiles = await this.fileRepository.deleteUnreferenced(
            new Date(now - ORPHAN_FILE_MIN_AGE_MS),
        )
        const deletedSessions = await this.authRepository.deleteExpiredSessions(new Date(now))

        return ok({ deletedFiles, deletedSessions })
    }
}

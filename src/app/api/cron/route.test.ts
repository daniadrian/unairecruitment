import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const handleDailyMaintenance = vi.fn(async () => ({
    ok: true as const,
    data: { deletedFiles: 1, deletedSessions: 2 },
}))

vi.mock('../../../controllers/maintenanceController.ts', () => ({
    MaintenanceController: class {
        handleDailyMaintenance = handleDailyMaintenance
    },
}))

const { GET } = await import('./route.ts')

// KS-12: the cron may only be called with the correct CRON_SECRET.
describe('GET /api/cron', () => {
    beforeEach(() => {
        process.env.CRON_SECRET = 'rahasia-cron'
        handleDailyMaintenance.mockClear()
    })

    afterEach(() => {
        delete process.env.CRON_SECRET
    })

    it('rejects a request without an Authorization header', async () => {
        const response = await GET(new Request('https://example.com/api/cron'))

        expect(response.status).toBe(401)
        expect(handleDailyMaintenance).not.toHaveBeenCalled()
    })

    it('rejects a wrong secret', async () => {
        const response = await GET(
            new Request('https://example.com/api/cron', {
                headers: { authorization: 'Bearer wrong' },
            }),
        )

        expect(response.status).toBe(401)
        expect(handleDailyMaintenance).not.toHaveBeenCalled()
    })

    it('rejects when CRON_SECRET is not configured', async () => {
        delete process.env.CRON_SECRET
        const response = await GET(
            new Request('https://example.com/api/cron', {
                headers: { authorization: 'Bearer rahasia-cron' },
            }),
        )

        expect(response.status).toBe(401)
    })

    it('runs daily maintenance when the secret is correct', async () => {
        const response = await GET(
            new Request('https://example.com/api/cron', {
                headers: { authorization: 'Bearer rahasia-cron' },
            }),
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ deletedFiles: 1, deletedSessions: 2 })
        expect(handleDailyMaintenance).toHaveBeenCalledOnce()
    })
})

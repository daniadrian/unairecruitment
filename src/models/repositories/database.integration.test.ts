import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { getPrismaClient } from '../../libs/prisma.ts'
import { ApplicationRepository } from './applicationRepository.ts'
import { AuthRepository } from './authRepository.ts'
import { RecruitmentRepository } from './recruitmentRepository.ts'

// Integration tests against a real database, run through `npm run test:integration`
// (not part of `npm test`). Skipped automatically when DATABASE_URL is empty.
// They test guarantees that can only be proven in the database: constraints, transactions, and RLS.
//
// WARNING: every test empties all application tables (TRUNCATE). Point DATABASE_URL only at
// a development database, then run `npm run db:seed` again to restore the admin account.

const hasDatabase = Boolean(process.env.DATABASE_URL)

describe.skipIf(!hasDatabase)('database integration', () => {
    const prisma = hasDatabase ? getPrismaClient() : null

    async function resetTables(): Promise<void> {
        if (!prisma) return
        await prisma.$executeRawUnsafe(
            'TRUNCATE TABLE "application_answers", "applications", "stored_files", "recruitment_fields", "recruitments", "sessions", "password_reset_otps", "users" RESTART IDENTITY CASCADE',
        )
    }

    async function createApplicant(email = 'applicant@example.com'): Promise<string> {
        const created = await prisma!.user.create({
            data: { name: 'Test Applicant', email, contactNumber: '081234567890', passwordHash: 'hash' },
        })
        return created.id
    }

    beforeEach(async () => {
        await resetTables()
    })

    afterAll(async () => {
        if (!prisma) return
        await resetTables()
        await prisma.$disconnect()
    })

    it('applies every migration so all eight tables exist', async () => {
        const rows = await prisma!.$queryRawUnsafe<Array<{ tablename: string }>>(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' ORDER BY tablename",
        )
        expect(rows.map((row) => row.tablename)).toEqual([
            'application_answers',
            'applications',
            'password_reset_otps',
            'recruitment_fields',
            'recruitments',
            'sessions',
            'stored_files',
            'users',
        ])
    })

    it('enables Row Level Security on every table (KA-08)', async () => {
        const rows = await prisma!.$queryRawUnsafe<Array<{ relname: string; relrowsecurity: boolean }>>(
            "SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname <> '_prisma_migrations'",
        )
        expect(rows).toHaveLength(8)
        expect(rows.every((row) => row.relrowsecurity)).toBe(true)
    })

    it('rejects duplicate custom field names within one recruitment (AB-11)', async () => {
        const recruitmentRepository = new RecruitmentRepository()
        const created = await recruitmentRepository.create({
            title: 'Product Manager',
            division: 'Product',
            description: 'Description',
            requirements: 'Requirements',
            fields: [
                { id: null, name: 'Portfolio', type: 'TEXT', category: 'OPTIONAL', options: [] },
                { id: null, name: 'Portfolio', type: 'TEXT', category: 'OPTIONAL', options: [] },
            ],
        })

        expect(created).toBeNull()
    })

    it('stores an application and its answers in one transaction (R-8, AL-02)', async () => {
        const userId = await createApplicant()
        const recruitmentRepository = new RecruitmentRepository()
        const recruitment = await recruitmentRepository.create({
            title: 'Product Manager',
            division: 'Product',
            description: 'Description',
            requirements: 'Requirements',
            fields: [{ id: null, name: 'GPA', type: 'NUMBER', category: 'REQUIRED', options: [] }],
        })
        const detail = await recruitmentRepository.getDetail(recruitment!.id)
        const fieldId = detail!.fields[0]!.id

        const applicationRepository = new ApplicationRepository()
        const result = await applicationRepository.create(userId, {
            recruitmentId: recruitment!.id,
            name: 'Test Applicant',
            email: 'applicant@example.com',
            contactNumber: '081234567890',
            motivation: 'Eager to contribute',
            cvFileId: null,
            answers: [
                {
                    fieldId,
                    fieldName: 'GPA',
                    fieldType: 'NUMBER',
                    value: '3.75',
                    fileId: null,
                    position: 0,
                },
            ],
        })

        expect(result.error).toBeNull()
        const saved = await applicationRepository.getDetail(result.application!.id)
        expect(saved?.status).toBe('PENDING')
        expect(saved?.answers).toHaveLength(1)
        expect(saved?.answers[0]).toMatchObject({ fieldName: 'GPA', value: '3.75' })
    })

    it('rejects a second application to the same recruitment through the unique constraint (AB-03)', async () => {
        const userId = await createApplicant()
        const recruitmentRepository = new RecruitmentRepository()
        const recruitment = await recruitmentRepository.create({
            title: 'Product Manager',
            division: 'Product',
            description: 'Description',
            requirements: 'Requirements',
            fields: [],
        })

        const applicationRepository = new ApplicationRepository()
        const payload = {
            recruitmentId: recruitment!.id,
            name: 'Test Applicant',
            email: 'applicant@example.com',
            contactNumber: '081234567890',
            motivation: 'Eager to contribute',
            cvFileId: null,
            answers: [],
        }

        const first = await applicationRepository.create(userId, payload)
        const second = await applicationRepository.create(userId, payload)

        expect(first.error).toBeNull()
        expect(second.error).toBe('DUPLICATE')
        expect(second.application).toBeNull()
    })

    it('keeps older answers when the field definition is deleted (AB-13)', async () => {
        const userId = await createApplicant()
        const recruitmentRepository = new RecruitmentRepository()
        const recruitment = await recruitmentRepository.create({
            title: 'Product Manager',
            division: 'Product',
            description: 'Description',
            requirements: 'Requirements',
            fields: [{ id: null, name: 'Portfolio', type: 'TEXT', category: 'OPTIONAL', options: [] }],
        })
        const detail = await recruitmentRepository.getDetail(recruitment!.id)
        const fieldId = detail!.fields[0]!.id

        const applicationRepository = new ApplicationRepository()
        const created = await applicationRepository.create(userId, {
            recruitmentId: recruitment!.id,
            name: 'Test Applicant',
            email: 'applicant@example.com',
            contactNumber: '081234567890',
            motivation: 'Eager to contribute',
            cvFileId: null,
            answers: [
                {
                    fieldId,
                    fieldName: 'Portfolio',
                    fieldType: 'TEXT',
                    value: 'https://example.com',
                    fileId: null,
                    position: 0,
                },
            ],
        })

        // The admin deletes that custom field by editing the recruitment.
        await recruitmentRepository.update(recruitment!.id, {
            title: 'Product Manager',
            division: 'Product',
            description: 'Description',
            requirements: 'Requirements',
            fields: [],
        })

        const saved = await applicationRepository.getDetail(created.application!.id)
        expect(saved?.answers).toHaveLength(1)
        expect(saved?.answers[0]).toMatchObject({ fieldName: 'Portfolio', value: 'https://example.com' })

        const row = await prisma!.applicationAnswer.findFirst({
            where: { applicationId: created.application!.id },
        })
        expect(row?.fieldId).toBeNull()
    })

    it('swaps names between custom fields without violating the constraint (UC-11)', async () => {
        const recruitmentRepository = new RecruitmentRepository()
        const recruitment = await recruitmentRepository.create({
            title: 'Product Manager',
            division: 'Product',
            description: 'Description',
            requirements: 'Requirements',
            fields: [
                { id: null, name: 'Alpha', type: 'TEXT', category: 'OPTIONAL', options: [] },
                { id: null, name: 'Beta', type: 'TEXT', category: 'OPTIONAL', options: [] },
            ],
        })
        const detail = await recruitmentRepository.getDetail(recruitment!.id)
        const [first, second] = detail!.fields

        const updated = await recruitmentRepository.update(recruitment!.id, {
            title: 'Product Manager',
            division: 'Product',
            description: 'Description',
            requirements: 'Requirements',
            fields: [
                { id: first!.id, name: 'Beta', type: 'TEXT', category: 'OPTIONAL', options: [] },
                { id: second!.id, name: 'Alpha', type: 'TEXT', category: 'OPTIONAL', options: [] },
            ],
        })

        expect(updated).not.toBeNull()
        const after = await recruitmentRepository.getDetail(recruitment!.id)
        expect(after!.fields.map((field) => field.name)).toEqual(['Beta', 'Alpha'])
    })

    it('creates, reads, and deletes token-based sessions (KA-07)', async () => {
        const userId = await createApplicant()
        const authRepository = new AuthRepository()

        const created = await authRepository.createSessionToken(
            userId,
            new Date(Date.now() + 60 * 60 * 1000),
        )
        expect(created).not.toBeNull()

        const sessionUser = await authRepository.findSessionUserByToken(created!.token)
        expect(sessionUser?.id).toBe(userId)

        // The raw token is not stored; only its hash is.
        const stored = await prisma!.session.findFirst({ where: { userId } })
        expect(stored?.tokenHash).not.toBe(created!.token)

        await authRepository.deleteSessionByToken(created!.token)
        expect(await authRepository.findSessionUserByToken(created!.token)).toBeNull()
    })

    it('rejects an expired session (AB-16)', async () => {
        const userId = await createApplicant()
        const authRepository = new AuthRepository()

        const created = await authRepository.createSessionToken(userId, new Date(Date.now() - 1_000))

        expect(await authRepository.findSessionUserByToken(created!.token)).toBeNull()
    })

    it('voids the previous OTP when a new OTP is requested (AB-16)', async () => {
        const userId = await createApplicant()
        const authRepository = new AuthRepository()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

        await authRepository.saveOtp(userId, '111111', expiresAt)
        await authRepository.saveOtp(userId, '222222', expiresAt)

        const rows = await prisma!.passwordResetOtp.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        })
        expect(rows).toHaveLength(2)
        expect(rows[0]?.usedAt).not.toBeNull()
        expect(rows[1]?.usedAt).toBeNull()

        const latest = await authRepository.findLatestOtp(userId)
        const wrong = await authRepository.verifyOtp(latest!.id, '999999')
        expect(wrong.valid).toBe(false)

        const afterWrongAttempt = await authRepository.findLatestOtp(userId)
        expect(afterWrongAttempt?.attempts).toBe(1)

        const correct = await authRepository.verifyOtp(latest!.id, '222222')
        expect(correct.valid).toBe(true)
    })
})

import { describe, expect, it, vi } from 'vitest'
import { RecruitmentController } from './recruitmentController.ts'
import type { AuthRepository } from '../models/repositories/authRepository.ts'
import type { RecruitmentRepository } from '../models/repositories/recruitmentRepository.ts'
import type { RecruitmentFieldInput } from '../types/inputs/recruitmentFieldInput.ts'
import type { RecruitmentInput } from '../types/inputs/recruitmentInput.ts'
import type { Recruitment } from '../models/entities/recruitment.ts'
import type { RecruitmentDetail } from '../types/recruitments/recruitmentDetail.ts'
import type { RecruitmentStatus } from '../types/recruitmentStatus.ts'
import type { SessionUser } from '../types/auth/sessionUser.ts'

// UC-09 to UC-11, AL-05.

const admin: SessionUser = { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'ADMIN' }
const applicant: SessionUser = { id: 'user-1', name: 'Budi', email: 'budi@example.com', role: 'APPLICANT' }

const recruitmentRow = {
    id: 'rec-1',
    title: 'Product Manager',
    division: 'Product',
    description: 'Description',
    requirements: 'Requirements',
    status: 'OPEN' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
}

function field(overrides: Partial<RecruitmentFieldInput> = {}): RecruitmentFieldInput {
    return { id: null, name: 'Portfolio Link', type: 'TEXT', category: 'OPTIONAL', options: [], ...overrides }
}

function validInput(overrides: Partial<RecruitmentInput> = {}): RecruitmentInput {
    return {
        title: 'Product Manager',
        division: 'Product',
        description: 'Manage the product roadmap',
        requirements: 'At least 1 year of experience',
        fields: [],
        ...overrides,
    }
}

function buildController(sessionUser: SessionUser | null = admin) {
    const recruitmentRepository = {
        list: vi.fn(async (): Promise<Recruitment[]> => [recruitmentRow]),
        listWithFields: vi.fn(async (): Promise<RecruitmentDetail[]> => [
            { ...recruitmentRow, fields: [] },
        ]),
        getDetail: vi.fn(async (_id: string): Promise<RecruitmentDetail | null> => ({
            ...recruitmentRow,
            fields: [],
        })),
        create: vi.fn(async (_input: RecruitmentInput): Promise<Recruitment | null> => recruitmentRow),
        update: vi.fn(
            async (_id: string, _input: RecruitmentInput): Promise<Recruitment | null> => recruitmentRow,
        ),
        updateStatus: vi.fn(
            async (_id: string, status: RecruitmentStatus): Promise<Recruitment | null> => ({
                ...recruitmentRow,
                status,
            }),
        ),
    }
    const authRepository = { getSessionUser: vi.fn(async (): Promise<SessionUser | null> => sessionUser) }
    const controller = new RecruitmentController(
        recruitmentRepository as unknown as RecruitmentRepository,
        authRepository as unknown as AuthRepository,
    )
    return { controller, recruitmentRepository, authRepository }
}

describe('RecruitmentController authorization (L-5, AB-08)', () => {
    it('rejects signed-out users', async () => {
        const { controller, recruitmentRepository } = buildController(null)
        const result = await controller.submitRecruitment(validInput())

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('UNAUTHENTICATED')
        expect(recruitmentRepository.create).not.toHaveBeenCalled()
    })

    it('rejects applicants trying to save a recruitment', async () => {
        const { controller, recruitmentRepository } = buildController(applicant)
        const result = await controller.submitRecruitment(validInput())

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('FORBIDDEN')
        expect(recruitmentRepository.create).not.toHaveBeenCalled()
    })

    it('allows the recruitment list to be read without signing in (AB-09)', async () => {
        const { controller } = buildController(null)
        expect(await controller.loadRecruitments()).toHaveLength(1)
        expect(await controller.loadRecruitmentDetail('rec-1')).not.toBeNull()
    })
})

describe('RecruitmentController.submitRecruitment data validation (UC-10)', () => {
    it('names the first empty column', async () => {
        const { controller } = buildController()
        const result = await controller.submitRecruitment(validInput({ division: '   ' }))

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error).toBe('Division cannot be empty.')
    })

    it('accepts a position title that matches another recruitment (AB-02)', async () => {
        const { controller, recruitmentRepository } = buildController()
        const result = await controller.submitRecruitment(validInput())

        expect(result.ok).toBe(true)
        expect(recruitmentRepository.create).toHaveBeenCalledOnce()
    })
})

describe('RecruitmentController custom field settings (AB-11, AL-05)', () => {
    it('rejects an empty field name', async () => {
        const { controller } = buildController()
        const result = await controller.submitRecruitment(validInput({ fields: [field({ name: '  ' })] }))

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.fieldErrors?.['fields.0.name']).toBe('Field name cannot be empty.')
    })

    it('rejects a field name that matches a built-in field', async () => {
        const { controller } = buildController()
        const result = await controller.submitRecruitment(validInput({ fields: [field({ name: 'motivation' })] }))

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.fieldErrors?.['fields.0.name']).toBe('This field name is already used by a built-in field.')
    })

    it('rejects two custom fields with the same name', async () => {
        const { controller } = buildController()
        const result = await controller.submitRecruitment(
            validInput({ fields: [field({ name: 'Portfolio' }), field({ name: 'portfolio' })] }),
        )

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.fieldErrors?.['fields.1.name']).toBe('This field name is already used by another field.')
    })

    it('rejects a Choice field without options', async () => {
        const { controller } = buildController()
        const result = await controller.submitRecruitment(
            validInput({ fields: [field({ name: 'Major', type: 'CHOICE', options: ['   '] })] }),
        )

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.fieldErrors?.['fields.0.options']).toContain('at least one option')
    })

    it('accepts a Choice field with one option and does not limit the number of fields', async () => {
        const { controller, recruitmentRepository } = buildController()
        const many = Array.from({ length: 12 }, (_, index) => field({ name: `Field ${index}` }))
        const result = await controller.submitRecruitment(
            validInput({
                fields: [field({ name: 'Major', type: 'CHOICE', options: ['Computer Science'] }), ...many],
            }),
        )

        expect(result.ok).toBe(true)
        const payload = recruitmentRepository.create.mock.calls[0]?.[0] as unknown as RecruitmentInput
        expect(payload.fields).toHaveLength(13)
        expect(payload.fields[0]?.options).toEqual(['Computer Science'])
    })

    it('clears the options for types other than Choice', async () => {
        const { controller, recruitmentRepository } = buildController()
        await controller.submitRecruitment(
            validInput({ fields: [field({ type: 'TEXT', options: ['unused'] })] }),
        )

        const payload = recruitmentRepository.create.mock.calls[0]?.[0] as unknown as RecruitmentInput
        expect(payload.fields[0]?.options).toEqual([])
    })
})

describe('RecruitmentController.submitRecruitment edit mode (UC-11)', () => {
    it('rejects a recruitment that does not exist', async () => {
        const { controller, recruitmentRepository } = buildController()
        recruitmentRepository.getDetail.mockResolvedValue(null)

        const result = await controller.submitRecruitment(validInput(), 'rec-x')

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('NOT_FOUND')
    })

    it('rejects a field whose ID does not belong to this recruitment', async () => {
        const { controller } = buildController()
        const result = await controller.submitRecruitment(
            validInput({ fields: [field({ id: 'foreign-field' })] }),
            'rec-1',
        )

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error).toContain('not recognized')
    })

    it('calls update, not create, when an ID is given', async () => {
        const { controller, recruitmentRepository } = buildController()
        const result = await controller.submitRecruitment(validInput(), 'rec-1')

        expect(result.ok).toBe(true)
        expect(recruitmentRepository.update).toHaveBeenCalledOnce()
        expect(recruitmentRepository.create).not.toHaveBeenCalled()
    })
})

describe('RecruitmentController.setStatus (AB-04)', () => {
    it('rejects non-admins', async () => {
        const { controller, recruitmentRepository } = buildController(applicant)
        const result = await controller.setStatus('rec-1', 'CLOSED')

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('FORBIDDEN')
        expect(recruitmentRepository.updateStatus).not.toHaveBeenCalled()
    })

    it('rejects a recruitment that does not exist', async () => {
        const { controller, recruitmentRepository } = buildController()
        recruitmentRepository.getDetail.mockResolvedValue(null)

        const result = await controller.setStatus('rec-x', 'CLOSED')

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('NOT_FOUND')
    })

    it('closes an open recruitment', async () => {
        const { controller, recruitmentRepository } = buildController()
        const result = await controller.setStatus('rec-1', 'CLOSED')

        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.data.status).toBe('CLOSED')
        expect(recruitmentRepository.updateStatus).toHaveBeenCalledWith('rec-1', 'CLOSED')
    })
})

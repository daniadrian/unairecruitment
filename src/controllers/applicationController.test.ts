import { describe, expect, it, vi } from 'vitest'
import { ApplicationController } from './applicationController.ts'
import { MAX_FILE_SIZE_BYTES } from '../utils/fileConstraints.ts'
import type { ApplicationRepository } from '../models/repositories/applicationRepository.ts'
import type { AuthRepository } from '../models/repositories/authRepository.ts'
import type { FileRepository } from '../models/repositories/fileRepository.ts'
import type { RecruitmentRepository } from '../models/repositories/recruitmentRepository.ts'
import type { RecruitmentField } from '../models/entities/recruitmentField.ts'
import type { ApplicationInput } from '../types/inputs/applicationInput.ts'
import type { ApplicationRecord } from '../types/inputs/applicationRecord.ts'
import type { Application } from '../models/entities/application.ts'
import type { StoredFile } from '../models/entities/storedFile.ts'
import type { User } from '../models/entities/user.ts'
import type { ApplicationSummary } from '../types/applications/applicationSummary.ts'
import type { RecruitmentDetail } from '../types/recruitments/recruitmentDetail.ts'
import type { FileBucket } from '../types/fileBucket.ts'
import type { SessionUser } from '../types/auth/sessionUser.ts'

// UC-07, UC-08, UC-15. AL-02 and AL-07.

const applicant: SessionUser = { id: 'user-1', name: 'Budi', email: 'budi@example.com', role: 'APPLICANT' }
const admin: SessionUser = { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'ADMIN' }

function buildField(overrides: Partial<RecruitmentField> = {}): RecruitmentField {
    return {
        id: 'field-1',
        recruitmentId: 'rec-1',
        name: 'Portfolio Link',
        type: 'TEXT',
        category: 'OPTIONAL',
        options: [],
        position: 0,
        ...overrides,
    }
}

function buildRecruitment(fields: RecruitmentField[] = []) {
    return {
        id: 'rec-1',
        title: 'Product Manager',
        division: 'Product',
        description: 'Description',
        requirements: 'Requirements',
        createdAt: new Date(),
        updatedAt: new Date(),
        fields,
    }
}

function validApplication(overrides: Partial<ApplicationInput> = {}): ApplicationInput {
    return {
        recruitmentId: 'rec-1',
        name: 'Budi Santoso',
        email: 'budi@example.com',
        contactNumber: '081234567890',
        motivation: 'Eager to contribute',
        cvFileId: null,
        answers: [],
        ...overrides,
    }
}

function buildController(options: { sessionUser?: SessionUser | null; fields?: RecruitmentField[] } = {}) {
    const sessionUser = options.sessionUser === undefined ? applicant : options.sessionUser

    const applicationRepository = {
        create: vi.fn(
            async (
                _userId: string,
                _record: ApplicationRecord,
            ): Promise<{ application: Application | null; error: string | null }> => ({
                application: { id: 'app-1' } as Application,
                error: null,
            }),
        ),
        existsByUserAndRecruitment: vi.fn(
            async (
                _userId: string,
                _recruitmentId: string,
            ): Promise<{ exists: boolean; error: string | null }> => ({ exists: false, error: null }),
        ),
        listByUser: vi.fn(async (_userId: string): Promise<ApplicationSummary[]> => []),
    }
    const recruitmentRepository = {
        getDetail: vi.fn(
            async (_id: string): Promise<RecruitmentDetail | null> =>
                buildRecruitment(options.fields ?? []),
        ),
    }
    const fileRepository = {
        save: vi.fn(
            async (
                _ownerId: string,
                _bucket: FileBucket,
                _file: { data: Uint8Array; originalName: string; mimeType: string },
            ): Promise<StoredFile | null> => ({
                id: 'file-1',
                ownerId: applicant.id,
                bucket: 'CV',
                objectPath: 'user-1/uuid.pdf',
                originalName: 'cv.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 1024,
                createdAt: new Date(),
            }),
        ),
        listOwnedUnreferenced: vi.fn(
            async (_ownerId: string, fileIds: string[]): Promise<StoredFile[]> =>
                fileIds.map((id) => ({
                    id,
                    ownerId: applicant.id,
                    bucket: 'CV',
                    objectPath: `user-1/${id}`,
                    originalName: 'cv.pdf',
                    mimeType: 'application/pdf',
                    sizeBytes: 1024,
                    createdAt: new Date(),
                })),
        ),
    }
    const authRepository = {
        getSessionUser: vi.fn(async (): Promise<SessionUser | null> => sessionUser),
        findByEmail: vi.fn(async (_email: string): Promise<User | null> => ({
            id: applicant.id,
            name: applicant.name,
            email: applicant.email,
            contactNumber: '081234567890',
            passwordHash: 'hash',
            role: 'APPLICANT',
            createdAt: new Date(),
        })),
    }

    const controller = new ApplicationController(
        applicationRepository as unknown as ApplicationRepository,
        recruitmentRepository as unknown as RecruitmentRepository,
        fileRepository as unknown as FileRepository,
        authRepository as unknown as AuthRepository,
    )

    return { controller, applicationRepository, recruitmentRepository, fileRepository, authRepository }
}

function pdfBytes(size = 1024): Uint8Array {
    const bytes = new Uint8Array(size)
    bytes.set(new TextEncoder().encode('%PDF-'), 0)
    return bytes
}

describe('ApplicationController.uploadFile (UC-15, AB-14, AL-07)', () => {
    it('rejects signed-out users and users who are not applicants', async () => {
        const anonymous = buildController({ sessionUser: null })
        const asAdmin = buildController({ sessionUser: admin })

        const first = await anonymous.controller.uploadFile({
            purpose: 'CV',
            fileName: 'cv.pdf',
            mimeType: 'application/pdf',
            data: pdfBytes(),
        })
        const second = await asAdmin.controller.uploadFile({
            purpose: 'CV',
            fileName: 'cv.pdf',
            mimeType: 'application/pdf',
            data: pdfBytes(),
        })

        expect(first.ok).toBe(false)
        expect(second.ok).toBe(false)
        if (first.ok || second.ok) return
        expect(first.code).toBe('UNAUTHENTICATED')
        expect(second.code).toBe('FORBIDDEN')
        expect(anonymous.fileRepository.save).not.toHaveBeenCalled()
    })

    it('rejects files over 3 MB', async () => {
        const { controller, fileRepository } = buildController()
        const result = await controller.uploadFile({
            purpose: 'ATTACHMENT',
            fileName: 'large.zip',
            mimeType: 'application/zip',
            data: new Uint8Array(MAX_FILE_SIZE_BYTES + 1),
        })

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('PAYLOAD_TOO_LARGE')
        expect(fileRepository.save).not.toHaveBeenCalled()
    })

    it('accepts a file of exactly 3 MB', async () => {
        const { controller } = buildController()
        const result = await controller.uploadFile({
            purpose: 'CV',
            fileName: 'cv.pdf',
            mimeType: 'application/pdf',
            data: pdfBytes(MAX_FILE_SIZE_BYTES),
        })

        expect(result.ok).toBe(true)
    })

    it('rejects a CV that is not a .pdf or was merely renamed to .pdf', async () => {
        const { controller, fileRepository } = buildController()

        const wrongExtension = await controller.uploadFile({
            purpose: 'CV',
            fileName: 'cv.docx',
            mimeType: 'application/pdf',
            data: pdfBytes(),
        })
        const renamedFile = await controller.uploadFile({
            purpose: 'CV',
            fileName: 'cv.pdf',
            mimeType: 'application/pdf',
            data: new TextEncoder().encode('PK\u0003\u0004 not a pdf'),
        })

        expect(wrongExtension.ok).toBe(false)
        expect(renamedFile.ok).toBe(false)
        expect(fileRepository.save).not.toHaveBeenCalled()
    })

    it('accepts custom field files in any format (AB-14)', async () => {
        const { controller, fileRepository } = buildController()
        const result = await controller.uploadFile({
            purpose: 'ATTACHMENT',
            fileName: 'certificate.png',
            mimeType: 'image/png',
            data: new Uint8Array([1, 2, 3, 4, 5]),
        })

        expect(result.ok).toBe(true)
        expect(fileRepository.save).toHaveBeenCalledWith(
            'user-1',
            'ATTACHMENTS',
            expect.objectContaining({ originalName: 'certificate.png' }),
        )
    })
})

describe('ApplicationController.submitApplication built-in fields (AB-10)', () => {
    it('rejects empty required built-in fields', async () => {
        const { controller, applicationRepository } = buildController()
        const result = await controller.submitApplication(
            validApplication({ name: '', motivation: '  ', email: '', contactNumber: '' }),
        )

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(Object.keys(result.fieldErrors ?? {})).toEqual(
            expect.arrayContaining(['name', 'email', 'contactNumber', 'motivation']),
        )
        expect(applicationRepository.create).not.toHaveBeenCalled()
    })

    it('rejects invalid email and contact number formats', async () => {
        const { controller } = buildController()
        const result = await controller.submitApplication(
            validApplication({ email: 'not-an-email', contactNumber: 'abc' }),
        )

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.fieldErrors?.email).toBe('Invalid email format.')
        expect(result.fieldErrors?.contactNumber).toBe('Invalid contact number format.')
    })

    it('accepts an application without a CV because the CV is optional for applicants', async () => {
        const { controller, applicationRepository } = buildController()
        const result = await controller.submitApplication(validApplication())

        expect(result.ok).toBe(true)
        const record = applicationRepository.create.mock.calls[0]?.[1] as unknown as ApplicationRecord
        expect(record.cvFileId).toBeNull()
    })
})

describe('ApplicationController.submitApplication custom fields (AB-12)', () => {
    it('rejects a required custom field that is left empty', async () => {
        const { controller } = buildController({
            fields: [buildField({ category: 'REQUIRED', name: 'Portfolio' })],
        })
        const result = await controller.submitApplication(validApplication())

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.fieldErrors?.['answers.field-1']).toBe('Portfolio is required.')
    })

    it('allows optional fields to be left empty', async () => {
        const { controller, applicationRepository } = buildController({
            fields: [buildField({ category: 'OPTIONAL' })],
        })
        const result = await controller.submitApplication(validApplication())

        expect(result.ok).toBe(true)
        const record = applicationRepository.create.mock.calls[0]?.[1] as unknown as ApplicationRecord
        expect(record.answers[0]?.value).toBeNull()
    })

    it('validates the Number, Date, and Choice types', async () => {
        const fields = [
            buildField({ id: 'f-number', name: 'GPA', type: 'NUMBER' }),
            buildField({ id: 'f-date', name: 'Date of Birth', type: 'DATE' }),
            buildField({ id: 'f-choice', name: 'Major', type: 'CHOICE', options: ['Computer Science'] }),
        ]
        const { controller } = buildController({ fields })

        const result = await controller.submitApplication(
            validApplication({
                answers: [
                    { fieldId: 'f-number', value: 'three point five', fileId: null },
                    { fieldId: 'f-date', value: '2026-02-30', fileId: null },
                    { fieldId: 'f-choice', value: 'Literature', fileId: null },
                ],
            }),
        )

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.fieldErrors?.['answers.f-number']).toContain('must be a number')
        expect(result.fieldErrors?.['answers.f-date']).toContain('valid date')
        expect(result.fieldErrors?.['answers.f-choice']).toContain('available options')
    })

    it('accepts answers that match their type', async () => {
        const fields = [
            buildField({ id: 'f-number', name: 'GPA', type: 'NUMBER' }),
            buildField({ id: 'f-date', name: 'Date of Birth', type: 'DATE' }),
            buildField({ id: 'f-choice', name: 'Major', type: 'CHOICE', options: ['Computer Science'] }),
        ]
        const { controller, applicationRepository } = buildController({ fields })

        const result = await controller.submitApplication(
            validApplication({
                answers: [
                    { fieldId: 'f-number', value: '3.75', fileId: null },
                    { fieldId: 'f-date', value: '2004-05-17', fileId: null },
                    { fieldId: 'f-choice', value: 'Computer Science', fileId: null },
                ],
            }),
        )

        expect(result.ok).toBe(true)
        const record = applicationRepository.create.mock.calls[0]?.[1] as unknown as ApplicationRecord
        expect(record.answers.map((answer) => answer.value)).toEqual(['3.75', '2004-05-17', 'Computer Science'])
    })

    it('stores a snapshot of the field name, type, and order (AB-13)', async () => {
        const { controller, applicationRepository } = buildController({
            fields: [buildField({ id: 'f-1', name: 'Portfolio', position: 0 })],
        })

        await controller.submitApplication(
            validApplication({ answers: [{ fieldId: 'f-1', value: 'https://example.com', fileId: null }] }),
        )

        const record = applicationRepository.create.mock.calls[0]?.[1] as unknown as ApplicationRecord
        expect(record.answers[0]).toMatchObject({
            fieldId: 'f-1',
            fieldName: 'Portfolio',
            fieldType: 'TEXT',
            position: 0,
        })
    })

    it('rejects answers for a field that does not exist in this recruitment', async () => {
        const { controller } = buildController({ fields: [buildField({ id: 'f-1' })] })
        const result = await controller.submitApplication(
            validApplication({ answers: [{ fieldId: 'f-foreign', value: 'x', fileId: null }] }),
        )

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error).toContain('does not exist in this recruitment')
    })
})

describe('ApplicationController.submitApplication application rules (AB-03, AL-02)', () => {
    it('rejects a second application to the same recruitment', async () => {
        const { controller, applicationRepository } = buildController()
        applicationRepository.existsByUserAndRecruitment.mockResolvedValue({ exists: true, error: null })

        const result = await controller.submitApplication(validApplication())

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('CONFLICT')
        expect(applicationRepository.create).not.toHaveBeenCalled()
    })

    it('still rejects when the database unique constraint catches the duplicate', async () => {
        const { controller, applicationRepository } = buildController()
        applicationRepository.create.mockResolvedValue({ application: null, error: 'DUPLICATE' })

        const result = await controller.submitApplication(validApplication())

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('CONFLICT')
    })

    it('rejects files not owned by the applicant or already used by another application', async () => {
        const { controller, fileRepository, applicationRepository } = buildController()
        fileRepository.listOwnedUnreferenced.mockResolvedValue([])

        const result = await controller.submitApplication(validApplication({ cvFileId: 'file-of-someone-else' }))

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error).toContain('is invalid')
        expect(applicationRepository.create).not.toHaveBeenCalled()
    })

    it('checks ownership of every file, including custom field files', async () => {
        const { controller, fileRepository } = buildController({
            fields: [buildField({ id: 'f-file', name: 'Certificate', type: 'FILE' })],
        })

        await controller.submitApplication(
            validApplication({
                cvFileId: 'file-cv',
                answers: [{ fieldId: 'f-file', value: null, fileId: 'file-certificate' }],
            }),
        )

        expect(fileRepository.listOwnedUnreferenced).toHaveBeenCalledWith('user-1', [
            'file-cv',
            'file-certificate',
        ])
    })

    it('rejects signed-out users (AB-09)', async () => {
        const { controller } = buildController({ sessionUser: null })
        const result = await controller.submitApplication(validApplication())

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('UNAUTHENTICATED')
    })

    it('rejects admins trying to submit an application', async () => {
        const { controller } = buildController({ sessionUser: admin })
        const result = await controller.submitApplication(validApplication())

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('FORBIDDEN')
    })
})

describe('ApplicationController.loadMyApplications (UC-08)', () => {
    it('only loads the applications of the signed-in applicant', async () => {
        const { controller, applicationRepository } = buildController()
        await controller.loadMyApplications()

        expect(applicationRepository.listByUser).toHaveBeenCalledWith('user-1')
    })

    it('returns an empty list when signed out', async () => {
        const { controller, applicationRepository } = buildController({ sessionUser: null })

        expect(await controller.loadMyApplications()).toEqual([])
        expect(applicationRepository.listByUser).not.toHaveBeenCalled()
    })
})

describe('ApplicationController.loadApplicationForm (UC-07)', () => {
    it('includes the account data for the use-account-data option (AB-05)', async () => {
        const { controller } = buildController()
        const result = await controller.loadApplicationForm('rec-1')

        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.data.account).toEqual({
            name: 'Budi',
            email: 'budi@example.com',
            contactNumber: '081234567890',
        })
    })

    it('refuses to open the form when the applicant has already applied', async () => {
        const { controller, applicationRepository } = buildController()
        applicationRepository.existsByUserAndRecruitment.mockResolvedValue({ exists: true, error: null })

        const result = await controller.loadApplicationForm('rec-1')

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('CONFLICT')
    })
})

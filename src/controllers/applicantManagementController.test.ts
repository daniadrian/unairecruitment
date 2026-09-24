import { describe, expect, it, vi } from 'vitest'
import { ApplicantManagementController } from './applicantManagementController.ts'
import type { ApplicationRepository } from '../models/repositories/applicationRepository.ts'
import type { AuthRepository } from '../models/repositories/authRepository.ts'
import type { FileRepository } from '../models/repositories/fileRepository.ts'
import type { RecruitmentRepository } from '../models/repositories/recruitmentRepository.ts'
import type { ApplicationDetail } from '../types/applications/applicationDetail.ts'
import type { ApplicationStatus } from '../types/applicationStatus.ts'
import type { ApplicantFilter } from '../types/applications/applicantFilter.ts'
import type { ApplicationSummary } from '../types/applications/applicationSummary.ts'
import type { Recruitment } from '../models/entities/recruitment.ts'
import type { RecruitmentDetail } from '../types/recruitments/recruitmentDetail.ts'
import type { SessionUser } from '../types/auth/sessionUser.ts'

// UC-12 to UC-17. AL-01 (status transitions), AL-06 (CSV export), AL-07 (file access).

const admin: SessionUser = { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'ADMIN' }
const applicant: SessionUser = { id: 'user-1', name: 'Budi', email: 'budi@example.com', role: 'APPLICANT' }

const submittedAt = new Date('2026-09-01T03:00:00.000Z')

function buildDetail(overrides: Partial<ApplicationDetail> = {}): ApplicationDetail {
    return {
        id: 'app-1',
        userId: 'user-1',
        name: 'Budi Santoso',
        email: 'budi@example.com',
        contactNumber: '081234567890',
        motivation: 'Eager to contribute, a lot',
        status: 'PENDING',
        submittedAt,
        recruitmentId: 'rec-1',
        recruitmentTitle: 'Product Manager',
        recruitmentDivision: 'Product',
        cvFile: null,
        answers: [],
        ...overrides,
    }
}

function buildController(sessionUser: SessionUser | null = admin, detail = buildDetail()) {
    const applicationRepository = {
        listAll: vi.fn(async (_filter: ApplicantFilter): Promise<ApplicationSummary[]> => []),
        listAllWithAnswers: vi.fn(async (_filter: ApplicantFilter): Promise<ApplicationDetail[]> => [detail]),
        getDetail: vi.fn(async (_id: string): Promise<ApplicationDetail | null> => detail),
        updateStatus: vi.fn(async (_id: string, _status: ApplicationStatus): Promise<boolean> => true),
    }
    const recruitmentRepository = {
        list: vi.fn(async (): Promise<Recruitment[]> => []),
        listWithFields: vi.fn(async (): Promise<RecruitmentDetail[]> => []),
    }
    const fileRepository = {
        createDownloadUrl: vi.fn(
            async (_fileId: string, _expiresInSeconds: number): Promise<string | null> =>
                'https://storage.example/signed',
        ),
    }
    const authRepository = { getSessionUser: vi.fn(async (): Promise<SessionUser | null> => sessionUser) }

    const controller = new ApplicantManagementController(
        applicationRepository as unknown as ApplicationRepository,
        recruitmentRepository as unknown as RecruitmentRepository,
        fileRepository as unknown as FileRepository,
        authRepository as unknown as AuthRepository,
    )

    return { controller, applicationRepository, recruitmentRepository, fileRepository }
}

describe('ApplicantManagementController authorization (AB-07, L-5)', () => {
    it('rejects every action when signed out', async () => {
        const { controller } = buildController(null)

        const list = await controller.loadApplicants({ keyword: null, recruitmentId: null, status: null })
        const detail = await controller.loadApplicantDetail('app-1')
        const status = await controller.saveStatus('app-1', 'INTERVIEW')
        const download = await controller.handleDownloadFile('app-1', 'file-1')
        const csv = await controller.handleExportCsv({ keyword: null, recruitmentId: null, status: null })

        for (const result of [list, detail, status, download, csv]) {
            expect(result.ok).toBe(false)
            if (!result.ok) expect(result.code).toBe('UNAUTHENTICATED')
        }
    })

    it('rejects applicants trying to open applicant data', async () => {
        const { controller, applicationRepository, fileRepository } = buildController(applicant)

        const detail = await controller.loadApplicantDetail('app-1')
        const download = await controller.handleDownloadFile('app-1', 'file-1')

        expect(detail.ok).toBe(false)
        expect(download.ok).toBe(false)
        if (detail.ok || download.ok) return
        expect(detail.code).toBe('FORBIDDEN')
        expect(download.code).toBe('FORBIDDEN')
        expect(applicationRepository.getDetail).not.toHaveBeenCalled()
        expect(fileRepository.createDownloadUrl).not.toHaveBeenCalled()
    })
})

describe('ApplicantManagementController.saveStatus (UC-14, AL-01)', () => {
    const forbidden: Array<[ApplicationStatus, ApplicationStatus]> = [
        ['INTERVIEW', 'PENDING'],
        ['ACCEPTED', 'INTERVIEW'],
        ['ACCEPTED', 'PENDING'],
        ['REJECTED', 'PENDING'],
        ['REJECTED', 'INTERVIEW'],
    ]

    it.each(forbidden)('rejects the backward transition %s to %s', async (current, next) => {
        const { controller, applicationRepository } = buildController(admin, buildDetail({ status: current }))

        const result = await controller.saveStatus('app-1', next)

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error).toContain('cannot be moved back')
        expect(applicationRepository.updateStatus).not.toHaveBeenCalled()
    })

    it('allows Pending to jump straight to Accepted', async () => {
        const { controller, applicationRepository } = buildController(admin, buildDetail({ status: 'PENDING' }))

        const result = await controller.saveStatus('app-1', 'ACCEPTED')

        expect(result.ok).toBe(true)
        expect(applicationRepository.updateStatus).toHaveBeenCalledWith('app-1', 'ACCEPTED')
    })

    it('allows Accepted and Rejected to switch between each other', async () => {
        const accepted = buildController(admin, buildDetail({ status: 'ACCEPTED' }))
        const rejected = buildController(admin, buildDetail({ status: 'REJECTED' }))

        expect((await accepted.controller.saveStatus('app-1', 'REJECTED')).ok).toBe(true)
        expect((await rejected.controller.saveStatus('app-1', 'ACCEPTED')).ok).toBe(true)
    })

    it('rejects an unknown status and an unchanged status', async () => {
        const { controller } = buildController()

        const unknown = await controller.saveStatus('app-1', 'ARCHIVED' as ApplicationStatus)
        const unchanged = await controller.saveStatus('app-1', 'PENDING')

        expect(unknown.ok).toBe(false)
        expect(unchanged.ok).toBe(false)
    })

    it('rejects an application that does not exist', async () => {
        const { controller, applicationRepository } = buildController()
        applicationRepository.getDetail.mockResolvedValue(null)

        const result = await controller.saveStatus('app-x', 'INTERVIEW')

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('NOT_FOUND')
    })
})

describe('ApplicantManagementController.loadApplicantDetail (UC-13)', () => {
    it('includes the statuses allowed from the current status', async () => {
        const { controller } = buildController(admin, buildDetail({ status: 'INTERVIEW' }))
        const result = await controller.loadApplicantDetail('app-1')

        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.data.allowedStatuses).toEqual(['ACCEPTED', 'REJECTED'])
    })
})

describe('ApplicantManagementController.handleDownloadFile (UC-16, AL-07)', () => {
    it('rejects a file that does not belong to that application', async () => {
        const { controller, fileRepository } = buildController()
        const result = await controller.handleDownloadFile('app-1', 'foreign-file')

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('NOT_FOUND')
        expect(fileRepository.createDownloadUrl).not.toHaveBeenCalled()
    })

    it('issues a short-lived signed URL for the application CV', async () => {
        const detail = buildDetail({
            cvFile: { id: 'file-cv', originalName: 'cv.pdf', mimeType: 'application/pdf', sizeBytes: 100 },
        })
        const { controller, fileRepository } = buildController(admin, detail)

        const result = await controller.handleDownloadFile('app-1', 'file-cv')

        expect(result.ok).toBe(true)
        const [fileId, ttl] = fileRepository.createDownloadUrl.mock.calls[0] as unknown as [string, number]
        expect(fileId).toBe('file-cv')
        expect(ttl).toBeLessThanOrEqual(300)
    })

    it('issues a signed URL for a file in a custom field', async () => {
        const detail = buildDetail({
            answers: [
                {
                    fieldName: 'Certificate',
                    fieldType: 'FILE',
                    value: null,
                    position: 0,
                    file: {
                        id: 'file-certificate',
                        originalName: 'certificate.png',
                        mimeType: 'image/png',
                        sizeBytes: 50,
                    },
                },
            ],
        })
        const { controller } = buildController(admin, detail)

        expect((await controller.handleDownloadFile('app-1', 'file-certificate')).ok).toBe(true)
    })
})

describe('ApplicantManagementController.handleExportCsv (UC-17, AB-15)', () => {
    it('builds the base columns and marks a CV that is not attached', async () => {
        const { controller } = buildController()
        const result = await controller.handleExportCsv({ keyword: null, recruitmentId: null, status: null })

        expect(result.ok).toBe(true)
        if (!result.ok) return
        const [header, row] = result.data.content.trim().split('\r\n')
        expect(header).toContain('Application ID,Name,Email,Contact Number,Recruitment ID,Position Title,Division')
        expect(row).toContain('Not attached')
        expect(result.data.fileName).toMatch(/^applicants-\d{4}-\d{2}-\d{2}\.csv$/)
    })

    it('creates one column per custom field and only a marker for files', async () => {
        const detail = buildDetail({
            answers: [
                { fieldName: 'GPA', fieldType: 'NUMBER', value: '3.75', file: null, position: 0 },
                {
                    fieldName: 'Transcript',
                    fieldType: 'FILE',
                    value: null,
                    position: 1,
                    file: {
                        id: 'file-1',
                        originalName: 'transcript.png',
                        mimeType: 'image/png',
                        sizeBytes: 10,
                    },
                },
            ],
        })
        const { controller } = buildController(admin, detail)

        const result = await controller.handleExportCsv({ keyword: null, recruitmentId: null, status: null })

        expect(result.ok).toBe(true)
        if (!result.ok) return
        const [header, row] = result.data.content.trim().split('\r\n')
        expect(header?.endsWith('GPA,Transcript')).toBe(true)
        expect(row?.endsWith('3.75,Attached')).toBe(true)
        expect(row).not.toContain('transcript.png')
    })

    it('leaves the cell empty when the application recruitment has no such field', async () => {
        const detail = buildDetail({ answers: [] })
        const { controller, recruitmentRepository } = buildController(admin, detail)
        recruitmentRepository.listWithFields.mockResolvedValue([
            {
                id: 'rec-2',
                title: 'Other',
                division: 'Other',
                description: '',
                requirements: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                fields: [
                    {
                        id: 'f-1',
                        recruitmentId: 'rec-2',
                        name: 'Portfolio',
                        type: 'TEXT' as const,
                        category: 'OPTIONAL' as const,
                        options: [],
                        position: 0,
                    },
                ],
            },
        ])

        const result = await controller.handleExportCsv({ keyword: null, recruitmentId: null, status: null })

        expect(result.ok).toBe(true)
        if (!result.ok) return
        const [header, row] = result.data.content.trim().split('\r\n')
        expect(header?.endsWith('Portfolio')).toBe(true)
        expect(row?.endsWith(',')).toBe(true)
    })

    it('quotes values that contain commas so columns do not shift', async () => {
        const { controller } = buildController(admin, buildDetail({ motivation: 'Likes product, data, and teams' }))
        const result = await controller.handleExportCsv({ keyword: null, recruitmentId: null, status: null })

        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.data.content).toContain('"Likes product, data, and teams"')
    })
})

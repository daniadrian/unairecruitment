import { getPrismaClient } from '../../libs/prisma.ts'
import type { Application } from '../entities/application.ts'
import type { ApplicationStatus } from '../../types/applicationStatus.ts'
import type { ApplicantFilter } from '../../types/applications/applicantFilter.ts'
import type { ApplicationDetail } from '../../types/applications/applicationDetail.ts'
import type { ApplicationSummary } from '../../types/applications/applicationSummary.ts'
import type { ApplicationRecord } from '../../types/inputs/applicationRecord.ts'
import type { RecruitmentApplicationCount } from '../../types/dashboard/recruitmentApplicationCount.ts'

// AB-07: there is no method to edit or delete applicant data other than changing the status.

type FileRow = {
    id: string
    originalName: string
    mimeType: string
    sizeBytes: number
} | null

type AnswerRow = {
    fieldName: string
    fieldType: 'TEXT' | 'CHOICE' | 'NUMBER' | 'DATE' | 'FILE'
    value: string | null
    position: number
    file: FileRow
}

type ApplicationRow = {
    id: string
    userId: string
    recruitmentId: string
    name: string
    email: string
    contactNumber: string
    motivation: string
    cvFileId: string | null
    status: ApplicationStatus
    submittedAt: Date
}

type DetailRow = ApplicationRow & {
    recruitment: { id: string; title: string; division: string }
    cvFile: FileRow
    answers: AnswerRow[]
}

type SummaryRow = ApplicationRow & {
    recruitment: { id: string; title: string; division: string }
}

function isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

function toApplication(row: ApplicationRow): Application {
    return {
        id: row.id,
        userId: row.userId,
        recruitmentId: row.recruitmentId,
        name: row.name,
        email: row.email,
        contactNumber: row.contactNumber,
        motivation: row.motivation,
        cvFileId: row.cvFileId,
        status: row.status,
        submittedAt: row.submittedAt,
    }
}

function toSummary(row: SummaryRow): ApplicationSummary {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        recruitmentId: row.recruitment.id,
        recruitmentTitle: row.recruitment.title,
        recruitmentDivision: row.recruitment.division,
        status: row.status,
        submittedAt: row.submittedAt,
    }
}

function toDetail(row: DetailRow): ApplicationDetail {
    return {
        id: row.id,
        userId: row.userId,
        name: row.name,
        email: row.email,
        contactNumber: row.contactNumber,
        motivation: row.motivation,
        status: row.status,
        submittedAt: row.submittedAt,
        recruitmentId: row.recruitment.id,
        recruitmentTitle: row.recruitment.title,
        recruitmentDivision: row.recruitment.division,
        cvFile: row.cvFile,
        answers: row.answers.map((answer) => ({
            fieldName: answer.fieldName,
            fieldType: answer.fieldType,
            value: answer.value,
            file: answer.file,
            position: answer.position,
        })),
    }
}

const summarySelect = {
    recruitment: { select: { id: true, title: true, division: true } },
}

const detailInclude = {
    recruitment: { select: { id: true, title: true, division: true } },
    cvFile: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } },
    answers: {
        orderBy: { position: 'asc' as const },
        select: {
            fieldName: true,
            fieldType: true,
            value: true,
            position: true,
            file: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } },
        },
    },
}

function buildWhere(filter: ApplicantFilter) {
    const where: Record<string, unknown> = {}
    if (filter.recruitmentId) where.recruitmentId = filter.recruitmentId
    if (filter.status) where.status = filter.status
    if (filter.keyword) {
        where.OR = [
            { name: { contains: filter.keyword, mode: 'insensitive' } },
            { email: { contains: filter.keyword, mode: 'insensitive' } },
        ]
    }
    return where
}

export class ApplicationRepository {
    // R-8: the application, its answers, and file references are stored as one unit.
    // The unique (userId, recruitmentId) constraint is the last safeguard for AB-03.
    public async create(
        userId: string,
        record: ApplicationRecord,
    ): Promise<{ application: Application | null; error: string | null }> {
        const prisma = getPrismaClient()
        try {
            const created = await prisma.application.create({
                data: {
                    userId,
                    recruitmentId: record.recruitmentId,
                    name: record.name,
                    email: record.email,
                    contactNumber: record.contactNumber,
                    motivation: record.motivation,
                    cvFileId: record.cvFileId,
                    answers: {
                        create: record.answers.map((answer) => ({
                            fieldId: answer.fieldId,
                            fieldName: answer.fieldName,
                            fieldType: answer.fieldType,
                            value: answer.value,
                            fileId: answer.fileId,
                            position: answer.position,
                        })),
                    },
                },
            })
            return { application: toApplication(created), error: null }
        } catch (error) {
            if (isUniqueViolation(error)) return { application: null, error: 'DUPLICATE' }
            console.error('Error creating application:', error)
            return { application: null, error: 'UNKNOWN' }
        }
    }

    // AB-03. Distinguishes "not found" from "failed" so the controller shows the right message.
    public async existsByUserAndRecruitment(
        userId: string,
        recruitmentId: string,
    ): Promise<{ exists: boolean; error: string | null }> {
        const prisma = getPrismaClient()
        try {
            const found = await prisma.application.findUnique({
                where: { userId_recruitmentId: { userId, recruitmentId } },
                select: { id: true },
            })
            return { exists: found !== null, error: null }
        } catch (error) {
            console.error('Error checking existing application:', error)
            return { exists: false, error: 'UNKNOWN' }
        }
    }

    // UC-08.
    public async listByUser(userId: string): Promise<ApplicationSummary[]> {
        const prisma = getPrismaClient()
        try {
            const rows = await prisma.application.findMany({
                where: { userId },
                include: summarySelect,
                orderBy: { submittedAt: 'desc' },
            })
            return rows.map(toSummary)
        } catch (error) {
            console.error('Error listing applications by user:', error)
            return []
        }
    }

    // UC-12.
    public async listAll(filter: ApplicantFilter): Promise<ApplicationSummary[]> {
        const prisma = getPrismaClient()
        try {
            const rows = await prisma.application.findMany({
                where: buildWhere(filter),
                include: summarySelect,
                orderBy: { submittedAt: 'desc' },
            })
            return rows.map(toSummary)
        } catch (error) {
            console.error('Error listing applications:', error)
            return []
        }
    }

    // UC-17: the CSV export needs the answers and file markers of every application.
    public async listAllWithAnswers(filter: ApplicantFilter): Promise<ApplicationDetail[]> {
        const prisma = getPrismaClient()
        try {
            const rows = await prisma.application.findMany({
                where: buildWhere(filter),
                include: detailInclude,
                orderBy: { submittedAt: 'desc' },
            })
            return rows.map(toDetail)
        } catch (error) {
            console.error('Error listing applications with answers:', error)
            return []
        }
    }

    // UC-13, UC-14, UC-16.
    public async getDetail(id: string): Promise<ApplicationDetail | null> {
        const prisma = getPrismaClient()
        try {
            const row = await prisma.application.findUnique({ where: { id }, include: detailInclude })
            return row ? toDetail(row) : null
        } catch (error) {
            console.error('Error getting application detail:', error)
            return null
        }
    }

    // UC-14. Transition validation lives in the controller (AL-01).
    public async updateStatus(id: string, status: ApplicationStatus): Promise<boolean> {
        const prisma = getPrismaClient()
        try {
            await prisma.application.update({ where: { id }, data: { status } })
            return true
        } catch (error) {
            console.error('Error updating application status:', error)
            return false
        }
    }

    // UC-18.
    public async countByStatus(): Promise<Record<ApplicationStatus, number>> {
        const empty = { PENDING: 0, INTERVIEW: 0, ACCEPTED: 0, REJECTED: 0 }
        const prisma = getPrismaClient()
        try {
            const rows = await prisma.application.groupBy({ by: ['status'], _count: { _all: true } })
            const counts = { ...empty }
            for (const row of rows) {
                counts[row.status] = row._count._all
            }
            return counts
        } catch (error) {
            console.error('Error counting applications by status:', error)
            return empty
        }
    }

    // UC-18. Recruitments without applications still appear with a total of 0.
    public async countByRecruitment(): Promise<RecruitmentApplicationCount[]> {
        const prisma = getPrismaClient()
        try {
            const rows = await prisma.recruitment.findMany({
                select: {
                    id: true,
                    title: true,
                    division: true,
                    _count: { select: { applications: true } },
                },
                orderBy: { createdAt: 'desc' },
            })
            return rows.map((row) => ({
                recruitmentId: row.id,
                title: row.title,
                division: row.division,
                total: row._count.applications,
            }))
        } catch (error) {
            console.error('Error counting applications by recruitment:', error)
            return []
        }
    }
}

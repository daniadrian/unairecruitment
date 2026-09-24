import { getPrismaClient } from '../../libs/prisma.ts'
import type { Recruitment } from '../entities/recruitment.ts'
import type { RecruitmentField } from '../entities/recruitmentField.ts'
import type { RecruitmentDetail } from '../../types/recruitments/recruitmentDetail.ts'
import type { RecruitmentInput } from '../../types/inputs/recruitmentInput.ts'
import type { RecruitmentStatus } from '../../types/recruitmentStatus.ts'

// AB-04: there is no method to delete a recruitment, but its status can be changed (updateStatus).

type RecruitmentRow = {
    id: string
    title: string
    division: string
    description: string
    requirements: string
    status: RecruitmentStatus
    createdAt: Date
    updatedAt: Date
}

type FieldRow = {
    id: string
    recruitmentId: string
    name: string
    type: 'TEXT' | 'CHOICE' | 'NUMBER' | 'DATE' | 'FILE'
    category: 'REQUIRED' | 'OPTIONAL'
    options: string[]
    position: number
}

function toRecruitment(row: RecruitmentRow): Recruitment {
    return {
        id: row.id,
        title: row.title,
        division: row.division,
        description: row.description,
        requirements: row.requirements,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    }
}

function toField(row: FieldRow): RecruitmentField {
    return {
        id: row.id,
        recruitmentId: row.recruitmentId,
        name: row.name,
        type: row.type,
        category: row.category,
        options: row.options,
        position: row.position,
    }
}

export class RecruitmentRepository {
    // UC-05, UC-09.
    public async list(): Promise<Recruitment[]> {
        const prisma = getPrismaClient()
        try {
            const rows = await prisma.recruitment.findMany({ orderBy: { createdAt: 'desc' } })
            return rows.map(toRecruitment)
        } catch (error) {
            console.error('Error listing recruitments:', error)
            return []
        }
    }

    // UC-05: the public "Openings" list only shows recruitments the admin has left open.
    public async listOpen(): Promise<Recruitment[]> {
        const prisma = getPrismaClient()
        try {
            const rows = await prisma.recruitment.findMany({
                where: { status: 'OPEN' },
                orderBy: { createdAt: 'desc' },
            })
            return rows.map(toRecruitment)
        } catch (error) {
            console.error('Error listing open recruitments:', error)
            return []
        }
    }

    // UC-17: CSV columns are built from the union of custom fields across all recruitments (AB-15).
    public async listWithFields(): Promise<RecruitmentDetail[]> {
        const prisma = getPrismaClient()
        try {
            const rows = await prisma.recruitment.findMany({
                include: { fields: { orderBy: { position: 'asc' } } },
                orderBy: { createdAt: 'desc' },
            })
            return rows.map((row) => ({ ...toRecruitment(row), fields: row.fields.map(toField) }))
        } catch (error) {
            console.error('Error listing recruitments with fields:', error)
            return []
        }
    }

    // UC-06, UC-07, UC-11.
    public async getDetail(id: string): Promise<RecruitmentDetail | null> {
        const prisma = getPrismaClient()
        try {
            const row = await prisma.recruitment.findUnique({
                where: { id },
                include: { fields: { orderBy: { position: 'asc' } } },
            })
            if (!row) return null
            return { ...toRecruitment(row), fields: row.fields.map(toField) }
        } catch (error) {
            console.error('Error getting recruitment detail:', error)
            return null
        }
    }

    // R-8: a recruitment and its custom fields are stored as one unit.
    public async create(input: RecruitmentInput): Promise<Recruitment | null> {
        const prisma = getPrismaClient()
        try {
            const created = await prisma.recruitment.create({
                data: {
                    title: input.title,
                    division: input.division,
                    description: input.description,
                    requirements: input.requirements,
                    fields: {
                        create: input.fields.map((field, index) => ({
                            name: field.name,
                            type: field.type,
                            category: field.category,
                            options: field.options,
                            position: index,
                        })),
                    },
                },
            })
            return toRecruitment(created)
        } catch (error) {
            console.error('Error creating recruitment:', error)
            return null
        }
    }

    // AB-13: changing or deleting a field definition does not touch older answers.
    // Answers whose field was deleted remain, with fieldId set to null (onDelete: SetNull).
    public async update(id: string, input: RecruitmentInput): Promise<Recruitment | null> {
        const prisma = getPrismaClient()
        try {
            const keptIds = input.fields
                .map((field) => field.id)
                .filter((fieldId): fieldId is string => fieldId !== null)

            const updated = await prisma.$transaction(async (tx) => {
                await tx.recruitmentField.deleteMany({
                    where: { recruitmentId: id, id: { notIn: keptIds } },
                })

                // Two passes so that swapping names between fields does not violate
                // unique(recruitmentId, name) in the middle of the transaction.
                for (const fieldId of keptIds) {
                    await tx.recruitmentField.update({
                        where: { id: fieldId },
                        data: { name: `__tmp_${fieldId}` },
                    })
                }

                for (const [index, field] of input.fields.entries()) {
                    const data = {
                        name: field.name,
                        type: field.type,
                        category: field.category,
                        options: field.options,
                        position: index,
                    }
                    if (field.id) {
                        await tx.recruitmentField.update({ where: { id: field.id }, data })
                    } else {
                        await tx.recruitmentField.create({ data: { ...data, recruitmentId: id } })
                    }
                }

                return tx.recruitment.update({
                    where: { id },
                    data: {
                        title: input.title,
                        division: input.division,
                        description: input.description,
                        requirements: input.requirements,
                    },
                })
            })

            return toRecruitment(updated)
        } catch (error) {
            console.error('Error updating recruitment:', error)
            return null
        }
    }

    // AB-04: opens or closes a recruitment; does not touch its content or fields.
    public async updateStatus(id: string, status: RecruitmentStatus): Promise<Recruitment | null> {
        const prisma = getPrismaClient()
        try {
            const updated = await prisma.recruitment.update({ where: { id }, data: { status } })
            return toRecruitment(updated)
        } catch (error) {
            console.error('Error updating recruitment status:', error)
            return null
        }
    }
}

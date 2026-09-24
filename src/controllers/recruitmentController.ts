import { AuthRepository } from '../models/repositories/authRepository.ts'
import { RecruitmentRepository } from '../models/repositories/recruitmentRepository.ts'
import { fail, ok } from '../utils/actionResult.ts'
import { isBuiltInFieldName, normalizeFieldName } from '../utils/builtInFields.ts'
import type { ActionResult } from '../types/actionResult.ts'
import type { FieldCategory } from '../types/fieldCategory.ts'
import type { FieldType } from '../types/fieldType.ts'
import type { Recruitment } from '../models/entities/recruitment.ts'
import type { RecruitmentDetail } from '../types/recruitments/recruitmentDetail.ts'
import type { RecruitmentInput } from '../types/inputs/recruitmentInput.ts'
import type { RecruitmentStatus } from '../types/recruitmentStatus.ts'

// UC-05, UC-06, UC-09, UC-10, UC-11. AL-05: custom form field settings.

const FIELD_TYPES: FieldType[] = ['TEXT', 'CHOICE', 'NUMBER', 'DATE', 'FILE']
const FIELD_CATEGORIES: FieldCategory[] = ['REQUIRED', 'OPTIONAL']
const RECRUITMENT_STATUSES: RecruitmentStatus[] = ['OPEN', 'CLOSED']

const RECRUITMENT_COLUMN_LABELS: Record<string, string> = {
    title: 'Position Title',
    division: 'Division',
    description: 'Description',
    requirements: 'Requirements',
}

export class RecruitmentController {
    constructor(
        private readonly recruitmentRepository = new RecruitmentRepository(),
        private readonly authRepository = new AuthRepository(),
    ) {}

    // UC-05 and UC-09. AB-09: the recruitment list is visible without signing in.
    public async loadRecruitments(): Promise<Recruitment[]> {
        return this.recruitmentRepository.list()
    }

    // UC-05: the public "Openings" page only shows recruitments the admin has left open (AB-04).
    public async loadOpenRecruitments(): Promise<Recruitment[]> {
        return this.recruitmentRepository.listOpen()
    }

    // UC-06 and UC-11.
    public async loadRecruitmentDetail(id: string): Promise<RecruitmentDetail | null> {
        if (!id) return null
        return this.recruitmentRepository.getDetail(id)
    }

    // UC-10 (null id) and UC-11 (id set). Admin only (L-5).
    public async submitRecruitment(
        input: RecruitmentInput,
        id: string | null = null,
    ): Promise<ActionResult<{ id: string }>> {
        const user = await this.authRepository.getSessionUser()
        if (!user) return fail('Session not found. Please sign in again.', 'UNAUTHENTICATED')
        if (user.role !== 'ADMIN') return fail('You are not allowed to change recruitment data.', 'FORBIDDEN')

        const validation = this.validateRecruitment(input)
        if (!validation.ok) return validation

        const sanitized = validation.data

        if (id) {
            const existing = await this.recruitmentRepository.getDetail(id)
            if (!existing) return fail('Recruitment not found.', 'NOT_FOUND')

            // AB-13: fields missing from the input are deleted, but answers on
            // applications that were already submitted are kept as they are.
            const existingIds = new Set(existing.fields.map((field) => field.id))
            const unknownField = sanitized.fields.find(
                (field) => field.id !== null && !existingIds.has(field.id),
            )
            if (unknownField) return fail('A form field is not recognized in this recruitment.', 'VALIDATION')

            const updated = await this.recruitmentRepository.update(id, sanitized)
            if (!updated) return fail('Could not save the recruitment. Please try again.', 'INTERNAL')
            return ok({ id: updated.id })
        }

        const created = await this.recruitmentRepository.create({
            ...sanitized,
            fields: sanitized.fields.map((field) => ({ ...field, id: null })),
        })
        if (!created) return fail('Could not save the recruitment. Please try again.', 'INTERNAL')
        return ok({ id: created.id })
    }

    // AB-04: opens or closes a recruitment. Admin only (L-5).
    public async setStatus(
        id: string,
        status: RecruitmentStatus,
    ): Promise<ActionResult<{ id: string; status: RecruitmentStatus }>> {
        const user = await this.authRepository.getSessionUser()
        if (!user) return fail('Session not found. Please sign in again.', 'UNAUTHENTICATED')
        if (user.role !== 'ADMIN') return fail('You are not allowed to change recruitment data.', 'FORBIDDEN')

        if (!RECRUITMENT_STATUSES.includes(status)) return fail('Unknown recruitment status.', 'VALIDATION')

        const existing = await this.recruitmentRepository.getDetail(id)
        if (!existing) return fail('Recruitment not found.', 'NOT_FOUND')

        const updated = await this.recruitmentRepository.updateStatus(id, status)
        if (!updated) return fail('Could not update the recruitment status. Please try again.', 'INTERNAL')
        return ok({ id: updated.id, status: updated.status })
    }

    // AB-11: field names must be neither empty nor duplicated (including built-in fields),
    // and Choice fields must have at least one option.
    private validateRecruitment(input: RecruitmentInput): ActionResult<RecruitmentInput> {
        const title = input.title?.trim() ?? ''
        const division = input.division?.trim() ?? ''
        const description = input.description?.trim() ?? ''
        const requirements = input.requirements?.trim() ?? ''

        const columns: Array<[string, string]> = [
            ['title', title],
            ['division', division],
            ['description', description],
            ['requirements', requirements],
        ]
        const firstEmpty = columns.find(([, value]) => value === '')
        if (firstEmpty) {
            const label = RECRUITMENT_COLUMN_LABELS[firstEmpty[0]]
            return fail(`${label} cannot be empty.`, 'VALIDATION', {
                [firstEmpty[0]]: `${label} cannot be empty.`,
            })
        }

        const fieldErrors: Record<string, string> = {}
        const seenNames = new Set<string>()
        const fields = (input.fields ?? []).map((field, index) => {
            const name = field.name?.trim() ?? ''
            const prefix = `fields.${index}`

            if (name === '') {
                fieldErrors[`${prefix}.name`] = 'Field name cannot be empty.'
            } else if (isBuiltInFieldName(name)) {
                fieldErrors[`${prefix}.name`] = 'This field name is already used by a built-in field.'
            } else if (seenNames.has(normalizeFieldName(name))) {
                fieldErrors[`${prefix}.name`] = 'This field name is already used by another field.'
            } else {
                seenNames.add(normalizeFieldName(name))
            }

            if (!FIELD_TYPES.includes(field.type)) {
                fieldErrors[`${prefix}.type`] = 'Unknown field type.'
            }
            if (!FIELD_CATEGORIES.includes(field.category)) {
                fieldErrors[`${prefix}.category`] = 'Unknown field category.'
            }

            const options =
                field.type === 'CHOICE'
                    ? (field.options ?? []).map((option) => option.trim()).filter((option) => option !== '')
                    : []

            if (field.type === 'CHOICE') {
                if (options.length === 0) {
                    fieldErrors[`${prefix}.options`] = 'Choice fields must have at least one option.'
                } else if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
                    fieldErrors[`${prefix}.options`] = 'Options must not be duplicated.'
                }
            }

            return { id: field.id ?? null, name, type: field.type, category: field.category, options }
        })

        if (Object.keys(fieldErrors).length > 0) {
            return fail('Please review the form field settings.', 'VALIDATION', fieldErrors)
        }

        return ok({ title, division, description, requirements, fields })
    }
}

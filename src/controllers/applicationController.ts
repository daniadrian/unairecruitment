import { z } from 'zod'
import { ApplicationRepository } from '../models/repositories/applicationRepository.ts'
import { AuthRepository } from '../models/repositories/authRepository.ts'
import { FileRepository } from '../models/repositories/fileRepository.ts'
import { RecruitmentRepository } from '../models/repositories/recruitmentRepository.ts'
import { fail, ok } from '../utils/actionResult.ts'
import {
    CV_MIME_TYPE,
    MAX_FILE_SIZE_MB,
    hasPdfExtension,
    hasPdfMagicBytes,
    isWithinSizeLimit,
} from '../utils/fileConstraints.ts'
import type { ActionResult } from '../types/actionResult.ts'
import type { ApplicationFormData } from '../types/applications/applicationFormData.ts'
import type { ApplicationSummary } from '../types/applications/applicationSummary.ts'
import type { UploadedFile } from '../types/applications/uploadedFile.ts'
import type { ApplicationAnswerRecord } from '../types/inputs/applicationAnswerRecord.ts'
import type { ApplicationInput } from '../types/inputs/applicationInput.ts'
import type { RecruitmentField } from '../models/entities/recruitmentField.ts'
import type { FileBucket } from '../types/fileBucket.ts'

// UC-07, UC-08, UC-15. AL-02 (application submission) and AL-07 (private file upload).

export type UploadPurpose = 'CV' | 'ATTACHMENT'

export interface UploadFileInput {
    purpose: UploadPurpose
    fileName: string
    mimeType: string
    data: Uint8Array
}

const emailSchema = z.string().trim().min(1).email()
const contactNumberSchema = z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,19}$/)
const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/)

function isValidCalendarDate(value: string): boolean {
    const parsed = new Date(`${value}T00:00:00Z`)
    if (Number.isNaN(parsed.getTime())) return false
    return parsed.toISOString().slice(0, 10) === value
}

export class ApplicationController {
    constructor(
        private readonly applicationRepository = new ApplicationRepository(),
        private readonly recruitmentRepository = new RecruitmentRepository(),
        private readonly fileRepository = new FileRepository(),
        private readonly authRepository = new AuthRepository(),
    ) {}

    // UC-07 step 2. AB-09: signed-in applicants only.
    public async loadApplicationForm(recruitmentId: string): Promise<ActionResult<ApplicationFormData>> {
        const user = await this.authRepository.getSessionUser()
        if (!user) return fail('Please sign in before applying.', 'UNAUTHENTICATED')
        if (user.role !== 'APPLICANT') return fail('Only applicants can fill in the application form.', 'FORBIDDEN')

        const recruitment = await this.recruitmentRepository.getDetail(recruitmentId)
        if (!recruitment) return fail('Recruitment not found.', 'NOT_FOUND')
        if (recruitment.status === 'CLOSED') {
            return fail('This recruitment is closed and is no longer accepting applications.', 'CONFLICT')
        }

        const existing = await this.applicationRepository.existsByUserAndRecruitment(user.id, recruitmentId)
        if (existing.error) return fail('Could not check your previous applications. Please try again.', 'INTERNAL')
        if (existing.exists) return fail('You have already applied to this recruitment.', 'CONFLICT')

        const account = await this.authRepository.findByEmail(user.email)

        return ok({
            recruitment,
            account: {
                name: account?.name ?? user.name,
                email: account?.email ?? user.email,
                contactNumber: account?.contactNumber ?? '',
            },
        })
    }

    // UC-15 and UC-07 step 3. AB-14 and AL-07: size, extension, and magic bytes are
    // checked on the server before the file is stored.
    public async uploadFile(input: UploadFileInput): Promise<ActionResult<UploadedFile>> {
        const user = await this.authRepository.getSessionUser()
        if (!user) return fail('Session not found. Please sign in again.', 'UNAUTHENTICATED')
        if (user.role !== 'APPLICANT') return fail('Only applicants can upload files.', 'FORBIDDEN')

        const fileName = input.fileName?.trim() ?? ''
        if (fileName === '') return fail('Invalid file.', 'VALIDATION')

        if (input.data.byteLength === 0) return fail('Empty files cannot be uploaded.', 'VALIDATION')
        if (!isWithinSizeLimit(input.data.byteLength)) {
            return fail(`Files can be at most ${MAX_FILE_SIZE_MB} MB.`, 'PAYLOAD_TOO_LARGE')
        }

        if (input.purpose === 'CV') {
            if (!hasPdfExtension(fileName)) return fail('The CV file must be a .pdf.', 'VALIDATION')
            if (!hasPdfMagicBytes(input.data.subarray(0, 5))) {
                return fail('The CV file must be a .pdf.', 'VALIDATION')
            }
        }

        const bucket: FileBucket = input.purpose === 'CV' ? 'CV' : 'ATTACHMENTS'
        const mimeType =
            input.purpose === 'CV' ? CV_MIME_TYPE : (input.mimeType || 'application/octet-stream')

        const saved = await this.fileRepository.save(user.id, bucket, {
            data: input.data,
            originalName: fileName,
            mimeType,
        })
        if (!saved) return fail('Could not upload the file. Please try again.', 'INTERNAL')

        return ok({ id: saved.id, originalName: saved.originalName, sizeBytes: saved.sizeBytes })
    }

    // UC-07 step 5. AL-02.
    public async submitApplication(input: ApplicationInput): Promise<ActionResult<{ applicationId: string }>> {
        const user = await this.authRepository.getSessionUser()
        if (!user) return fail('Please sign in before applying.', 'UNAUTHENTICATED')
        if (user.role !== 'APPLICANT') return fail('Only applicants can submit applications.', 'FORBIDDEN')

        const recruitment = await this.recruitmentRepository.getDetail(input.recruitmentId ?? '')
        if (!recruitment) return fail('Recruitment not found.', 'NOT_FOUND')
        if (recruitment.status === 'CLOSED') {
            return fail('This recruitment is closed and is no longer accepting applications.', 'CONFLICT')
        }

        const duplicate = await this.applicationRepository.existsByUserAndRecruitment(
            user.id,
            recruitment.id,
        )
        if (duplicate.error) return fail('Could not check your previous applications. Please try again.', 'INTERNAL')
        if (duplicate.exists) return fail('You have already applied to this recruitment.', 'CONFLICT')

        const fieldErrors: Record<string, string> = {}

        // AB-10: the built-in Name, Email, Contact Number, and Motivation fields are required.
        const name = input.name?.trim() ?? ''
        const email = input.email?.trim().toLowerCase() ?? ''
        const contactNumber = input.contactNumber?.trim() ?? ''
        const motivation = input.motivation?.trim() ?? ''

        if (name === '') fieldErrors.name = 'Name is required.'
        if (email === '') fieldErrors.email = 'Email is required.'
        else if (!emailSchema.safeParse(email).success) fieldErrors.email = 'Invalid email format.'
        if (contactNumber === '') fieldErrors.contactNumber = 'Contact number is required.'
        else if (!contactNumberSchema.safeParse(contactNumber).success) {
            fieldErrors.contactNumber = 'Invalid contact number format.'
        }
        if (motivation === '') fieldErrors.motivation = 'Motivation is required.'

        // AB-12: required custom fields must be filled in and answers are validated by type.
        const answersByFieldId = new Map((input.answers ?? []).map((answer) => [answer.fieldId, answer]))
        const knownFieldIds = new Set(recruitment.fields.map((field) => field.id))
        const unknownAnswer = (input.answers ?? []).find((answer) => !knownFieldIds.has(answer.fieldId))
        if (unknownAnswer) return fail('The answers include a field that does not exist in this recruitment.', 'VALIDATION')

        const records: ApplicationAnswerRecord[] = []

        recruitment.fields.forEach((field, index) => {
            const answer = answersByFieldId.get(field.id)
            const rawValue = answer?.value?.trim() ?? ''
            const fileId = answer?.fileId ?? null
            const key = `answers.${field.id}`
            const isProvided = field.type === 'FILE' ? fileId !== null : rawValue !== ''

            if (!isProvided) {
                if (field.category === 'REQUIRED') {
                    fieldErrors[key] = `${field.name} is required.`
                    return
                }
                records.push(this.buildAnswerRecord(field, index, null, null))
                return
            }

            const normalized = this.normalizeAnswerValue(field, rawValue)
            if (normalized.error) {
                fieldErrors[key] = normalized.error
                return
            }

            records.push(this.buildAnswerRecord(field, index, normalized.value, fileId))
        })

        if (Object.keys(fieldErrors).length > 0) {
            return fail('Please complete the required fields and fix the invalid entries.', 'VALIDATION', fieldErrors)
        }

        // AL-02 and AL-07: referenced files must belong to the applicant and not be used by another application.
        const cvFileId = input.cvFileId ?? null
        const referencedFileIds = [cvFileId, ...records.map((record) => record.fileId)].filter(
            (fileId): fileId is string => fileId !== null,
        )
        if (referencedFileIds.length > 0) {
            const owned = await this.fileRepository.listOwnedUnreferenced(user.id, referencedFileIds)
            const ownedIds = new Set(owned.map((file) => file.id))
            const invalid = referencedFileIds.some((fileId) => !ownedIds.has(fileId))
            if (invalid) return fail('An attached file is invalid. Please upload it again.', 'VALIDATION')
        }

        const created = await this.applicationRepository.create(user.id, {
            recruitmentId: recruitment.id,
            name,
            email,
            contactNumber,
            motivation,
            cvFileId,
            answers: records,
        })

        if (created.error === 'DUPLICATE') return fail('You have already applied to this recruitment.', 'CONFLICT')
        if (!created.application) return fail('Could not submit the application. Please try again.', 'INTERNAL')

        return ok({ applicationId: created.application.id })
    }

    // UC-08. F_UNAIREC_08_03: applicants only see their own applications.
    public async loadMyApplications(): Promise<ApplicationSummary[]> {
        const user = await this.authRepository.getSessionUser()
        if (!user || user.role !== 'APPLICANT') return []
        return this.applicationRepository.listByUser(user.id)
    }

    // AB-13: the field name, type, and order are copied as a snapshot at submission time.
    private buildAnswerRecord(
        field: RecruitmentField,
        position: number,
        value: string | null,
        fileId: string | null,
    ): ApplicationAnswerRecord {
        return {
            fieldId: field.id,
            fieldName: field.name,
            fieldType: field.type,
            value,
            fileId: field.type === 'FILE' ? fileId : null,
            position,
        }
    }

    private normalizeAnswerValue(
        field: RecruitmentField,
        rawValue: string,
    ): { value: string | null; error: string | null } {
        switch (field.type) {
            case 'NUMBER': {
                if (!/^-?\d+(\.\d+)?$/.test(rawValue)) {
                    return { value: null, error: `${field.name} must be a number.` }
                }
                return { value: rawValue, error: null }
            }
            case 'DATE': {
                if (!dateSchema.safeParse(rawValue).success || !isValidCalendarDate(rawValue)) {
                    return { value: null, error: `${field.name} must be a valid date.` }
                }
                return { value: rawValue, error: null }
            }
            case 'CHOICE': {
                if (!field.options.includes(rawValue)) {
                    return { value: null, error: `${field.name} must be one of the available options.` }
                }
                return { value: rawValue, error: null }
            }
            case 'FILE': {
                return { value: null, error: null }
            }
            case 'TEXT':
            default: {
                return { value: rawValue, error: null }
            }
        }
    }
}

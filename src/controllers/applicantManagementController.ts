import { ApplicationRepository } from '../models/repositories/applicationRepository.ts'
import { AuthRepository } from '../models/repositories/authRepository.ts'
import { FileRepository } from '../models/repositories/fileRepository.ts'
import { RecruitmentRepository } from '../models/repositories/recruitmentRepository.ts'
import { fail, ok } from '../utils/actionResult.ts'
import { DOWNLOAD_URL_TTL_SECONDS } from '../utils/authPolicy.ts'
import { buildCsv } from '../utils/csv.ts'
import { formatDateTime } from '../utils/dateFormat.ts'
import { APPLICATION_STATUS_LABELS } from '../utils/fieldLabels.ts'
import { allowedNextStatuses, canTransition } from '../utils/statusTransition.ts'
import type { ActionResult } from '../types/actionResult.ts'
import type { ApplicationStatus } from '../types/applicationStatus.ts'
import type { ApplicantFilter } from '../types/applications/applicantFilter.ts'
import type { ApplicationDetail } from '../types/applications/applicationDetail.ts'
import type { ApplicationSummary } from '../types/applications/applicationSummary.ts'
import type { Recruitment } from '../models/entities/recruitment.ts'

// UC-12, UC-13, UC-14, UC-16, UC-17. AL-01 (status transition) and AL-06 (CSV export).
// AB-07: admins can only view applicant data and change its status.

const VALID_STATUSES: ApplicationStatus[] = ['PENDING', 'INTERVIEW', 'ACCEPTED', 'REJECTED']

const FILE_PRESENT_LABEL = 'Attached'
const FILE_ABSENT_LABEL = 'Not attached'

const BASE_CSV_HEADERS = [
    'Application ID',
    'Name',
    'Email',
    'Contact Number',
    'Recruitment ID',
    'Position Title',
    'Division',
    'Submitted At',
    'Status',
    'Motivation',
    'CV',
]

export interface ApplicantListData {
    applications: ApplicationSummary[]
    recruitments: Recruitment[]
    statuses: ApplicationStatus[]
}

export interface ApplicantDetailData {
    application: ApplicationDetail
    allowedStatuses: ApplicationStatus[]
}

export interface CsvExport {
    fileName: string
    content: string
}

export class ApplicantManagementController {
    constructor(
        private readonly applicationRepository = new ApplicationRepository(),
        private readonly recruitmentRepository = new RecruitmentRepository(),
        private readonly fileRepository = new FileRepository(),
        private readonly authRepository = new AuthRepository(),
    ) {}

    // UC-12.
    public async loadApplicants(filter: ApplicantFilter): Promise<ActionResult<ApplicantListData>> {
        const guard = await this.requireAdmin()
        if (!guard.ok) return guard

        const sanitized: ApplicantFilter = {
            keyword: filter.keyword?.trim() ? filter.keyword.trim() : null,
            recruitmentId: filter.recruitmentId ? filter.recruitmentId : null,
            status: filter.status && VALID_STATUSES.includes(filter.status) ? filter.status : null,
        }

        const [applications, recruitments] = await Promise.all([
            this.applicationRepository.listAll(sanitized),
            this.recruitmentRepository.list(),
        ])

        return ok({ applications, recruitments, statuses: VALID_STATUSES })
    }

    // UC-13. The status options shown follow AB-01.
    public async loadApplicantDetail(applicationId: string): Promise<ActionResult<ApplicantDetailData>> {
        const guard = await this.requireAdmin()
        if (!guard.ok) return guard

        const application = await this.applicationRepository.getDetail(applicationId)
        if (!application) return fail('Applicant not found.', 'NOT_FOUND')

        return ok({ application, allowedStatuses: allowedNextStatuses(application.status) })
    }

    // UC-14. AL-01: transitions are validated on the server, not only through the UI options.
    public async saveStatus(
        applicationId: string,
        nextStatus: ApplicationStatus,
    ): Promise<ActionResult<{ status: ApplicationStatus }>> {
        const guard = await this.requireAdmin()
        if (!guard.ok) return guard

        if (!VALID_STATUSES.includes(nextStatus)) return fail('Unknown status.', 'VALIDATION')

        const application = await this.applicationRepository.getDetail(applicationId)
        if (!application) return fail('Applicant not found.', 'NOT_FOUND')

        if (application.status === nextStatus) {
            return fail('The status is unchanged.', 'VALIDATION')
        }
        if (!canTransition(application.status, nextStatus)) {
            return fail('The status cannot be moved back to an earlier stage.', 'VALIDATION')
        }

        const updated = await this.applicationRepository.updateStatus(applicationId, nextStatus)
        if (!updated) return fail('Could not update the status. Please try again.', 'INTERNAL')

        return ok({ status: nextStatus })
    }

    // UC-16. AL-07: the role is checked and the file is confirmed to belong to the application
    // before a short-lived signed URL is issued.
    public async handleDownloadFile(
        applicationId: string,
        fileId: string,
    ): Promise<ActionResult<{ url: string }>> {
        const guard = await this.requireAdmin()
        if (!guard.ok) return guard

        const application = await this.applicationRepository.getDetail(applicationId)
        if (!application) return fail('Applicant not found.', 'NOT_FOUND')

        const belongsToApplication =
            application.cvFile?.id === fileId ||
            application.answers.some((answer) => answer.file?.id === fileId)
        if (!belongsToApplication) return fail('File not found in this application.', 'NOT_FOUND')

        const url = await this.fileRepository.createDownloadUrl(fileId, DOWNLOAD_URL_TTL_SECONDS)
        if (!url) return fail('Could not prepare the file. Please try again.', 'INTERNAL')

        return ok({ url })
    }

    // UC-17 (optional). AB-15: one column per custom field name; files are only a marker.
    public async handleExportCsv(filter: ApplicantFilter): Promise<ActionResult<CsvExport>> {
        const guard = await this.requireAdmin()
        if (!guard.ok) return guard

        const sanitized: ApplicantFilter = {
            keyword: filter.keyword?.trim() ? filter.keyword.trim() : null,
            recruitmentId: filter.recruitmentId ? filter.recruitmentId : null,
            status: filter.status && VALID_STATUSES.includes(filter.status) ? filter.status : null,
        }

        const [applications, recruitments] = await Promise.all([
            this.applicationRepository.listAllWithAnswers(sanitized),
            this.recruitmentRepository.listWithFields(),
        ])

        // Column names come from the field definitions of every recruitment and from the name
        // snapshots on older answers, so changed or deleted fields are still exported (AB-13).
        const fieldNames = new Set<string>()
        for (const recruitment of recruitments) {
            for (const field of recruitment.fields) fieldNames.add(field.name)
        }
        for (const application of applications) {
            for (const answer of application.answers) fieldNames.add(answer.fieldName)
        }
        const additionalColumns = [...fieldNames].sort((a, b) => a.localeCompare(b, 'en'))

        const rows = applications.map((application) => {
            const answerByName = new Map(application.answers.map((answer) => [answer.fieldName, answer]))
            const baseRow = [
                application.id,
                application.name,
                application.email,
                application.contactNumber,
                application.recruitmentId,
                application.recruitmentTitle,
                application.recruitmentDivision,
                formatDateTime(application.submittedAt),
                APPLICATION_STATUS_LABELS[application.status],
                application.motivation,
                application.cvFile ? FILE_PRESENT_LABEL : FILE_ABSENT_LABEL,
            ]

            const additionalRow = additionalColumns.map((columnName) => {
                const answer = answerByName.get(columnName)
                // The cell is left empty when the recruitment of this application has no such field.
                if (!answer) return ''
                if (answer.fieldType === 'FILE') {
                    return answer.file ? FILE_PRESENT_LABEL : FILE_ABSENT_LABEL
                }
                return answer.value ?? ''
            })

            return [...baseRow, ...additionalRow]
        })

        const content = buildCsv([...BASE_CSV_HEADERS, ...additionalColumns], rows)
        const stamp = new Date().toISOString().slice(0, 10)

        return ok({ fileName: `applicants-${stamp}.csv`, content })
    }

    // L-5: every admin action checks the role on the server.
    private async requireAdmin(): Promise<ActionResult<undefined>> {
        const user = await this.authRepository.getSessionUser()
        if (!user) return fail('Session not found. Please sign in again.', 'UNAUTHENTICATED')
        if (user.role !== 'ADMIN') return fail('You are not allowed to access applicant data.', 'FORBIDDEN')
        return ok()
    }
}

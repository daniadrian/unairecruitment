import { Download, File } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ApplicantManagementController } from '../../controllers/applicantManagementController.ts'
import { formatCalendarDate, formatDateTime } from '../../utils/dateFormat.ts'
import { formatFileSize } from '../../utils/numberFormat.ts'
import { shortReference } from '../../utils/textFormat.ts'
import AdminHeader from '../components/admin/adminHeader.tsx'
import StatusControl from '../components/admin/statusControl.tsx'
import ContentSheet from '../components/brand/contentSheet.tsx'
import StatusTag from '../components/brand/statusTag.tsx'
import ErrorPanel from '../components/feedback/errorPanel.tsx'
import { redirectOnFailure } from '../components/guards/redirectOnFailure.ts'
import { requireViewer } from '../components/guards/requireViewer.ts'
import { buttonVariants } from '../components/ui/button.tsx'
import type { ApplicationStatus } from '../../types/applicationStatus.ts'
import type { ApplicationAnswerDetail } from '../../types/applications/applicationAnswerDetail.ts'
import type { ApplicationFile } from '../../types/applications/applicationFile.ts'
import type { FormAction } from '../../types/formAction.ts'

// Screen 12: UC-13 (details, answers, and files), UC-14 (change status), and UC-16 (view and
// download files). Answers show the field name as it was when the application was sent (AB-13);
// an empty optional answer reads "Not filled in" and a missing file "Not attached" (13_02, 13_03,
// 16_03). Files open through a short-lived signed URL issued after the admin check (AL-07).

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
    return (
        <section className="grid gap-3 border-t border-hairline py-5 first:border-t-0 md:grid-cols-[170px_minmax(0,1fr)] md:gap-6">
            <h2 className="font-display text-[19px] font-medium text-ink">{title}</h2>
            <div className="min-w-0">{children}</div>
        </section>
    )
}

function answerText(answer: ApplicationAnswerDetail): ReactNode {
    if (answer.value === null || answer.value.trim() === '') {
        return <span className="font-normal text-ink-soft italic">Not filled in</span>
    }
    if (answer.fieldType === 'DATE') return formatCalendarDate(answer.value)
    if (answer.fieldType === 'NUMBER') return <span className="font-mono">{answer.value}</span>
    return <span className="whitespace-pre-line">{answer.value}</span>
}

function FileRow({
    label,
    file,
    applicationId,
}: {
    label: string
    file: ApplicationFile | null
    applicationId: string
}) {
    const href = file ? `/admin/files/${file.id}?application=${applicationId}` : null
    return (
        <li className="flex flex-wrap items-center gap-3 border-b border-row-line px-3.5 py-3 last:border-b-0">
            <File aria-hidden="true" size={20} strokeWidth={1.8} className="shrink-0 text-secondary" />
            <div className="min-w-0 flex-1">
                {file && href ? (
                    <a
                        href={href}
                        className="block truncate text-[14.5px] font-semibold text-ink no-underline hover:text-link hover:underline"
                    >
                        {file.originalName}
                    </a>
                ) : (
                    <p className="text-[14.5px] font-semibold text-ink">{label}</p>
                )}
                <p className="font-mono text-[12.5px] text-ink-soft">
                    {file ? `${label} · ${formatFileSize(file.sizeBytes)}` : 'Not attached'}
                </p>
            </div>
            {href ? (
                <a
                    href={href}
                    className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                    aria-label={`Download ${label}`}
                >
                    <Download aria-hidden="true" size={15} strokeWidth={2} />
                    Download
                </a>
            ) : null}
        </li>
    )
}

export default async function AdminApplicantDetailScreen({
    applicationId,
    saveStatusAction,
}: {
    applicationId: string
    saveStatusAction: FormAction<{ status: ApplicationStatus }>
}) {
    const path = `/admin/applicants/${applicationId}`
    const [, result] = await Promise.all([
        requireViewer('ADMIN', path),
        new ApplicantManagementController().loadApplicantDetail(applicationId),
    ])
    redirectOnFailure(result, path)

    if (!result.ok) {
        return (
            <>
                <AdminHeader title="Applicant" />
                <div className="px-3 py-6 sm:px-6 lg:px-12">
                    <div className="mx-auto w-full max-w-[1104px]">
                        <ErrorPanel
                            title="The applicant could not be loaded."
                            message={result.error}
                            action={
                                <Link
                                    href="/admin/applicants"
                                    className={buttonVariants({ variant: 'outline' })}
                                >
                                    Back to applicants
                                </Link>
                            }
                        />
                    </div>
                </div>
            </>
        )
    }

    const { application, allowedStatuses } = result.data
    const reference = shortReference(application.id)
    const questions = application.answers.filter((answer) => answer.fieldType !== 'FILE')
    const fileAnswers = application.answers.filter((answer) => answer.fieldType === 'FILE')
    const attachedCount = (application.cvFile ? 1 : 0) + fileAnswers.filter((answer) => answer.file).length

    return (
        <>
            <AdminHeader
                breadcrumb={
                    <ol className="flex flex-wrap gap-1.5">
                        <li>
                            <Link
                                href="/admin/applicants"
                                transitionTypes={['nav-back']}
                                className="text-white"
                            >
                                Applicants
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page" className="font-mono" title={application.id}>
                            {reference}
                        </li>
                    </ol>
                }
                title={
                    <span className="flex flex-wrap items-center gap-3.5">
                        {application.name}
                        <StatusTag status={application.status} className="font-sans tracking-normal" />
                    </span>
                }
                description={
                    <>
                        <span className="font-mono text-white" title={application.id}>
                            {reference}
                        </span>
                        {` · ${application.recruitmentTitle} · submitted ${formatDateTime(application.submittedAt)}`}
                    </>
                }
            />

            <div className="px-3 pt-6 pb-16 sm:px-6 lg:px-12 lg:pt-7">
                <div className="mx-auto grid w-full max-w-[1104px] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
                    <ContentSheet className="min-w-0 px-4 sm:px-7">
                        <Section title="Application details">
                            <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-y-2.5 text-[15px] sm:grid-cols-[140px_minmax(0,1fr)]">
                                <dt className="text-ink-soft">Email</dt>
                                <dd className="min-w-0 truncate">
                                    <a href={`mailto:${application.email}`}>{application.email}</a>
                                </dd>
                                <dt className="text-ink-soft">Contact number</dt>
                                <dd className="font-mono text-sm">{application.contactNumber}</dd>
                                <dt className="text-ink-soft">Recruitment</dt>
                                <dd>
                                    <Link href={`/admin/recruitments/${application.recruitmentId}/edit`}>
                                        {application.recruitmentTitle}
                                    </Link>{' '}
                                    <span className="text-ink-soft">
                                        {'·'} {application.recruitmentDivision}
                                    </span>
                                </dd>
                            </dl>
                        </Section>

                        <Section title="Motivation">
                            <p className="max-w-[620px] text-base leading-[1.65] whitespace-pre-line text-pretty text-ink">
                                {application.motivation}
                            </p>
                        </Section>

                        {questions.length > 0 ? (
                            <Section title="Division questions">
                                <dl className="flex flex-col text-[15px]">
                                    {questions.map((answer) => (
                                        <div
                                            key={`${answer.position}-${answer.fieldName}`}
                                            className="border-b border-row-line py-3 first:pt-0 last:border-b-0 last:pb-0"
                                        >
                                            <dt className="text-[13.5px] text-ink-soft">
                                                {answer.fieldName}
                                            </dt>
                                            <dd className="mt-1 font-semibold text-ink">
                                                {answerText(answer)}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </Section>
                        ) : null}

                        <Section
                            title={
                                <>
                                    Files{' '}
                                    <span className="font-mono text-[13px] font-medium text-ink-faint">
                                        {attachedCount}
                                    </span>
                                </>
                            }
                        >
                            <ul className="rounded-md border border-hairline bg-mist">
                                <FileRow
                                    label="CV"
                                    file={application.cvFile}
                                    applicationId={application.id}
                                />
                                {fileAnswers.map((answer) => (
                                    <FileRow
                                        key={`${answer.position}-${answer.fieldName}`}
                                        label={answer.fieldName}
                                        file={answer.file}
                                        applicationId={application.id}
                                    />
                                ))}
                            </ul>
                        </Section>
                    </ContentSheet>

                    <aside aria-label="Status" className="lg:sticky lg:top-6">
                        <StatusControl
                            applicationId={application.id}
                            applicantName={application.name}
                            current={application.status}
                            allowed={allowedStatuses}
                            action={saveStatusAction}
                        />
                    </aside>
                </div>
            </div>
        </>
    )
}

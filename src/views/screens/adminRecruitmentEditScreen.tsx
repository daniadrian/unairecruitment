import { Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DashboardController } from '../../controllers/dashboardController.ts'
import { formatDate } from '../../utils/dateFormat.ts'
import AdminHeader from '../components/admin/adminHeader.tsx'
import EditRecruitmentForm from '../components/admin/recruitmentForm/editRecruitmentForm.tsx'
import ShortRef from '../components/brand/shortRef.tsx'
import Notice from '../components/feedback/notice.tsx'
import { redirectOnFailure } from '../components/guards/redirectOnFailure.ts'
import { requireViewer } from '../components/guards/requireViewer.ts'
import { loadRecruitmentDetail } from '../components/recruitments/loadRecruitmentDetail.ts'
import type { FormAction } from '../../types/formAction.ts'
import type { RecruitmentFormValues } from '../../types/recruitments/recruitmentFormValues.ts'

// Screen 10, UC-11: edit a recruitment and its custom fields. The ID is shown and cannot change
// (AB-02). Changes only apply to new applications (AB-13), which the impact note explains.
export default async function AdminRecruitmentEditScreen({
    recruitmentId,
    saveAction,
}: {
    recruitmentId: string
    saveAction: FormAction<{ id: string }>
}) {
    const path = `/admin/recruitments/${recruitmentId}/edit`
    const [, recruitment, statistics] = await Promise.all([
        requireViewer('ADMIN', path),
        loadRecruitmentDetail(recruitmentId),
        new DashboardController().loadStatistics(),
    ])
    if (!recruitment) notFound()
    redirectOnFailure(statistics, path)

    const applicantCount = statistics.ok
        ? (statistics.data.perRecruitment.find((row) => row.recruitmentId === recruitment.id)?.total ?? 0)
        : null
    const applicantsHref = `/admin/applicants?recruitmentId=${recruitment.id}`

    const initial: RecruitmentFormValues = {
        title: recruitment.title,
        division: recruitment.division,
        description: recruitment.description,
        requirements: recruitment.requirements,
        fields: recruitment.fields.map((field) => ({
            key: field.id,
            id: field.id,
            name: field.name,
            type: field.type,
            category: field.category,
            options: field.options,
        })),
    }

    return (
        <>
            <AdminHeader
                breadcrumb={
                    <ol className="flex flex-wrap gap-1.5">
                        <li>
                            <Link href="/admin/recruitments" className="text-white">
                                Recruitments
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li>
                            <ShortRef id={recruitment.id} />
                        </li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page">Edit</li>
                    </ol>
                }
                title={recruitment.title}
                actions={
                    applicantCount === null ? null : (
                        <Link
                            href={applicantsHref}
                            className="inline-flex items-center gap-2 rounded-sm border border-admin-outline px-2.5 py-1.5 text-sm font-semibold text-white no-underline hover:bg-admin-surface hover:text-white"
                        >
                            <Users
                                aria-hidden="true"
                                size={15}
                                strokeWidth={2}
                                className="text-admin-accent"
                            />
                            {applicantCount === 1 ? '1 applicant' : `${applicantCount} applicants`}
                        </Link>
                    )
                }
            />
            <EditRecruitmentForm
                recruitmentId={recruitment.id}
                initial={initial}
                action={saveAction}
                notice={
                    <Notice tone="info">
                        {applicantCount ? (
                            <>
                                <b>
                                    {applicantCount === 1
                                        ? '1 person has already applied.'
                                        : `${applicantCount} people have already applied.`}
                                </b>{' '}
                            </>
                        ) : null}
                        New fields only appear for future applicants. Deleting a field or changing its type
                        won{'’'}t remove answers already received {'—'} they stay visible in each applicant
                        {'’'}s details.
                    </Notice>
                }
                aside={
                    <aside
                        aria-label="About this recruitment"
                        className="flex flex-col border-t-[3px] border-secondary"
                    >
                        <dl className="flex flex-col text-sm">
                            <div className="flex justify-between gap-3 border-b border-hairline py-3">
                                <dt className="text-ink-soft">ID</dt>
                                <dd>
                                    <ShortRef
                                        id={recruitment.id}
                                        className="text-[13.5px] font-semibold text-ink"
                                    />
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-hairline py-3">
                                <dt className="text-ink-soft">Applicants</dt>
                                <dd className="font-mono font-semibold">
                                    {applicantCount === null ? (
                                        '—'
                                    ) : (
                                        <Link href={applicantsHref}>{applicantCount}</Link>
                                    )}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-hairline py-3">
                                <dt className="text-ink-soft">Created</dt>
                                <dd className="text-ink">{formatDate(recruitment.createdAt)}</dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-hairline py-3">
                                <dt className="text-ink-soft">Last edited</dt>
                                <dd className="text-ink">{formatDate(recruitment.updatedAt)}</dd>
                            </div>
                        </dl>
                        <Link
                            href={`/recruitments/${recruitment.id}`}
                            className="py-3.5 text-sm font-semibold"
                        >
                            View public page
                        </Link>
                    </aside>
                }
            />
        </>
    )
}

import Link from 'next/link'
import { ApplicantManagementController } from '../../controllers/applicantManagementController.ts'
import { formatDate } from '../../utils/dateFormat.ts'
import AdminHeader from '../components/admin/adminHeader.tsx'
import ApplicantFilters, { type ApplicantFilterValues } from '../components/admin/applicantFilters.tsx'
import Pagination from '../components/admin/pagination.tsx'
import ShortRef from '../components/brand/shortRef.tsx'
import StatusTag from '../components/brand/statusTag.tsx'
import ErrorPanel from '../components/feedback/errorPanel.tsx'
import { redirectOnFailure } from '../components/guards/redirectOnFailure.ts'
import { requireViewer } from '../components/guards/requireViewer.ts'
import type { ApplicantFilter } from '../../types/applications/applicantFilter.ts'

// Screen 11, UC-12 and UC-17: every application (one row per applicant per recruitment), with
// search, filters, and CSV export. Admins only view applicant data here (AB-07). The list comes
// back whole from the controller, so it is paged in the view.

const PAGE_SIZE = 20

export default async function AdminApplicantListScreen({
    filter,
    page,
    currentPath,
}: {
    filter: ApplicantFilter
    page: number
    currentPath: string
}) {
    const [, result] = await Promise.all([
        requireViewer('ADMIN', currentPath),
        new ApplicantManagementController().loadApplicants(filter),
    ])
    redirectOnFailure(result, currentPath)

    if (!result.ok) {
        return (
            <>
                <AdminHeader title="Applicants" />
                <div className="px-3 py-6 sm:px-6 lg:px-12">
                    <div className="mx-auto w-full max-w-[1104px]">
                        <ErrorPanel title="The applicant list could not be loaded." message={result.error} />
                    </div>
                </div>
            </>
        )
    }

    const { applications, recruitments, statuses } = result.data
    const filtered = Boolean(filter.keyword || filter.recruitmentId || filter.status)
    const pending = applications.filter((application) => application.status === 'PENDING').length
    const pageCount = Math.max(1, Math.ceil(applications.length / PAGE_SIZE))
    const currentPage = Math.min(Math.max(1, page), pageCount)
    const rows = applications.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    const values: ApplicantFilterValues = {
        keyword: filter.keyword ?? '',
        recruitmentId: filter.recruitmentId ?? '',
        status: filter.status ?? '',
    }
    function hrefFor(target: number): string {
        const params = new URLSearchParams()
        if (values.keyword) params.set('keyword', values.keyword)
        if (values.recruitmentId) params.set('recruitmentId', values.recruitmentId)
        if (values.status) params.set('status', values.status)
        if (target > 1) params.set('page', String(target))
        const query = params.toString()
        return query ? `/admin/applicants?${query}` : '/admin/applicants'
    }

    const description = [
        `${applications.length} ${applications.length === 1 ? 'application' : 'applications'}${filtered ? ' match' : ''}`,
        `${pending} pending`,
    ].join(' · ')

    return (
        <>
            <AdminHeader title="Applicants" description={description} className="pb-14 lg:pb-[60px]" />

            <div className="relative -mt-9 px-3 pb-14 sm:px-6 lg:px-12">
                <div className="mx-auto flex w-full max-w-[1104px] flex-col gap-4">
                    <ApplicantFilters
                        values={values}
                        recruitments={recruitments.map((recruitment) => ({
                            id: recruitment.id,
                            title: recruitment.title,
                        }))}
                        statuses={statuses}
                        resultCount={applications.length}
                    />

                    <div className="overflow-hidden rounded-md border border-hairline bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] border-collapse text-left">
                                <thead>
                                    <tr className="h-11 border-b-2 border-secondary text-[12.5px] text-ink-soft">
                                        <th scope="col" className="w-[140px] px-4 font-semibold">
                                            Registration no.
                                        </th>
                                        <th scope="col" className="px-4 font-semibold">
                                            Applicant
                                        </th>
                                        <th scope="col" className="px-4 font-semibold">
                                            Recruitment
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-[130px] px-4 font-semibold"
                                            aria-sort="descending"
                                        >
                                            Submitted <span aria-hidden="true">{'↓'}</span>
                                        </th>
                                        <th scope="col" className="w-[130px] px-4 font-semibold">
                                            Status
                                        </th>
                                        <th scope="col" className="w-[64px] px-4">
                                            <span className="sr-only">Open</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center">
                                                <p className="font-display text-lg font-medium text-ink">
                                                    {filtered
                                                        ? 'No applicants match your search or filters.'
                                                        : 'No applications yet.'}
                                                </p>
                                                <p className="mt-1.5 text-sm text-ink-soft">
                                                    {filtered ? (
                                                        <Link href="/admin/applicants">
                                                            Clear the search and filters
                                                        </Link>
                                                    ) : (
                                                        'Applications appear here as soon as applicants submit them.'
                                                    )}
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((application) => (
                                            <tr
                                                key={application.id}
                                                className="relative border-b border-row-line last:border-b-0 hover:bg-row-hover"
                                            >
                                                <td className="px-4 py-3">
                                                    <ShortRef
                                                        id={application.id}
                                                        className="text-[13px] font-medium text-link"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/admin/applicants/${application.id}`}
                                                        transitionTypes={['nav-forward']}
                                                        className="block truncate text-[15px] font-semibold text-ink no-underline after:absolute after:inset-0 hover:text-link"
                                                    >
                                                        {application.name}
                                                    </Link>
                                                    <span className="block max-w-[280px] truncate text-[13.5px] text-ink-soft">
                                                        {application.email}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm leading-[1.35] text-ink">
                                                    {application.recruitmentTitle}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-ink">
                                                    {formatDate(application.submittedAt)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusTag status={application.status} />
                                                </td>
                                                <td
                                                    aria-hidden="true"
                                                    className="px-4 py-3 text-right text-[13.5px] font-semibold text-link"
                                                >
                                                    Open
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {applications.length > 0 ? (
                            <Pagination
                                page={currentPage}
                                pageCount={pageCount}
                                total={applications.length}
                                pageSize={PAGE_SIZE}
                                hrefFor={hrefFor}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    )
}

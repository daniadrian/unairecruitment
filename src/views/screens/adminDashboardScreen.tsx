import Link from 'next/link'
import { DashboardController } from '../../controllers/dashboardController.ts'
import { APPLICATION_STATUS_LABELS } from '../../utils/fieldLabels.ts'
import { formatDateTime } from '../../utils/dateFormat.ts'
import { formatPercent } from '../../utils/numberFormat.ts'
import AdminHeader from '../components/admin/adminHeader.tsx'
import StatusBreakdownChart from '../components/admin/statusBreakdownChart.tsx'
import ContentSheet from '../components/brand/contentSheet.tsx'
import StatusTag from '../components/brand/statusTag.tsx'
import ErrorPanel from '../components/feedback/errorPanel.tsx'
import { redirectOnFailure } from '../components/guards/redirectOnFailure.ts'
import { requireViewer } from '../components/guards/requireViewer.ts'
import type { ApplicationStatus } from '../../types/applicationStatus.ts'

// Screen 13, UC-18 (F_UNAIREC_18_01): total applications, the count per status, and the count per
// recruitment. The numbers form one ruled strip on the dark header rather than KPI cards. The data
// has totals per recruitment only, so each recruitment row shows one bar.

const PATH = '/admin/dashboard'
const STATUSES: ApplicationStatus[] = ['PENDING', 'INTERVIEW', 'ACCEPTED', 'REJECTED']
const LEGEND: Record<ApplicationStatus, string> = {
    PENDING: 'bg-chart-pending',
    INTERVIEW: 'bg-primary',
    ACCEPTED: 'bg-teal',
    REJECTED: 'bg-[repeating-linear-gradient(45deg,#0E1B2A_0_3px,#3B4F66_3px_5px)]',
}

export default async function AdminDashboardScreen() {
    const [, result] = await Promise.all([
        requireViewer('ADMIN', PATH),
        new DashboardController().loadStatistics(),
    ])
    redirectOnFailure(result, PATH)

    if (!result.ok) {
        return (
            <>
                <AdminHeader title="Dashboard" />
                <div className="px-3 py-6 sm:px-6 lg:px-12">
                    <div className="mx-auto w-full max-w-[1104px]">
                        <ErrorPanel title="The statistics could not be loaded." message={result.error} />
                    </div>
                </div>
            </>
        )
    }

    const { totalApplications, countByStatus, perRecruitment } = result.data
    const largest = Math.max(1, ...perRecruitment.map((row) => row.total))

    return (
        <>
            <AdminHeader
                title="Dashboard"
                description={`Updated ${formatDateTime(new Date())}`}
                className="pb-0 lg:pb-0"
            >
                <dl className="mt-7 grid grid-cols-2 border-t border-admin-rule sm:grid-cols-[1.2fr_repeat(4,1fr)]">
                    <div className="col-span-2 flex flex-col gap-1.5 py-5 pr-5 sm:col-span-1 sm:pb-6">
                        <dt className="text-sm text-admin-muted">Total applications</dt>
                        <dd className="font-display text-[46px] leading-none font-medium text-white">
                            {totalApplications}
                        </dd>
                        <dd className="font-mono text-[12.5px] text-admin-muted">
                            across {perRecruitment.length}{' '}
                            {perRecruitment.length === 1 ? 'recruitment' : 'recruitments'}
                        </dd>
                    </div>
                    {STATUSES.map((status, index) => (
                        <div
                            key={status}
                            className={
                                index % 2 === 0
                                    ? 'flex flex-col items-start gap-2 border-t border-admin-rule py-5 pr-5 sm:border-t-0 sm:border-l sm:px-5'
                                    : 'flex flex-col items-start gap-2 border-t border-l border-admin-rule px-5 py-5 sm:border-t-0'
                            }
                        >
                            <dt>
                                <StatusTag status={status} />
                            </dt>
                            <dd className="font-display text-4xl leading-none font-medium text-white">
                                {countByStatus[status]}
                            </dd>
                            <dd className="font-mono text-[12.5px] text-admin-muted">
                                {formatPercent(countByStatus[status], totalApplications)}
                            </dd>
                        </div>
                    ))}
                </dl>
            </AdminHeader>

            <div className="px-3 pt-6 pb-16 sm:px-6 lg:px-12 lg:pt-7">
                <div className="mx-auto w-full max-w-[1104px]">
                    <ContentSheet className="flex flex-col gap-7 p-5 sm:px-7 sm:py-6">
                        <section aria-labelledby="breakdown-heading" className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-4">
                                <h2
                                    id="breakdown-heading"
                                    className="font-display text-[21px] font-medium text-ink"
                                >
                                    Status breakdown
                                </h2>
                                <ul
                                    className="flex flex-wrap gap-[18px] text-[13px] text-ink"
                                    aria-label="Legend"
                                >
                                    {STATUSES.map((status) => (
                                        <li key={status} className="flex items-center gap-1.5">
                                            <span aria-hidden="true" className={`size-3 ${LEGEND[status]}`} />
                                            {APPLICATION_STATUS_LABELS[status]}
                                            {status === 'REJECTED' ? ' (hatched)' : ''}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <StatusBreakdownChart counts={countByStatus} />
                        </section>

                        <section
                            aria-labelledby="per-recruitment-heading"
                            className="flex flex-col gap-1 border-t border-hairline pt-2"
                        >
                            <h2
                                id="per-recruitment-heading"
                                className="mt-3 mb-2.5 font-display text-[21px] font-medium text-ink"
                            >
                                Applications per recruitment
                            </h2>
                            {perRecruitment.length === 0 ? (
                                <p className="text-sm text-ink-soft">No recruitments yet.</p>
                            ) : (
                                <ul className="flex flex-col">
                                    {perRecruitment.map((row) => (
                                        <li key={row.recruitmentId} className="border-b border-row-line">
                                            <Link
                                                href={`/admin/applicants?recruitmentId=${row.recruitmentId}`}
                                                aria-label={`${row.title}, ${row.division}: ${row.total} ${row.total === 1 ? 'application' : 'applications'}`}
                                                className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-x-4 gap-y-2 py-2.5 text-ink no-underline hover:bg-row-hover md:grid-cols-[290px_minmax(0,1fr)_48px]"
                                            >
                                                <span className="flex min-w-0 flex-col gap-[3px]">
                                                    <span className="truncate font-display text-base leading-[1.25] font-medium">
                                                        {row.title}
                                                    </span>
                                                    <span className="truncate font-mono text-xs text-ink-soft">
                                                        {row.division}
                                                    </span>
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    className="order-last col-span-2 flex h-[22px] md:order-none md:col-span-1"
                                                >
                                                    <span
                                                        className="h-full bg-primary"
                                                        style={{
                                                            width: `${(row.total / largest) * 100}%`,
                                                            minWidth: row.total > 0 ? 4 : 0,
                                                        }}
                                                    />
                                                </span>
                                                <span className="text-right font-mono text-base font-semibold">
                                                    {row.total}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p className="mt-2 text-[12.5px] text-ink-soft">
                                Select a recruitment to see its applicants.
                            </p>
                        </section>
                    </ContentSheet>
                </div>
            </div>
        </>
    )
}

import { CircleCheck, Plus } from 'lucide-react'
import Link from 'next/link'
import { DashboardController } from '../../controllers/dashboardController.ts'
import { RecruitmentController } from '../../controllers/recruitmentController.ts'
import { formatDate } from '../../utils/dateFormat.ts'
import AdminHeader from '../components/admin/adminHeader.tsx'
import RecruitmentRowMenu from '../components/admin/recruitmentRowMenu.tsx'
import EmptyRegister from '../components/brand/emptyRegister.tsx'
import ShortRef from '../components/brand/shortRef.tsx'
import Notice from '../components/feedback/notice.tsx'
import { redirectOnFailure } from '../components/guards/redirectOnFailure.ts'
import { requireViewer } from '../components/guards/requireViewer.ts'
import { buttonVariants } from '../components/ui/button.tsx'

// Screen 08, UC-09: every recruitment with its ID, title, division, and a summary of the
// description (F_UNAIREC_09_01), plus buttons to add and edit. There is no delete, close, or
// visibility control (AB-04). Applicant totals come from the dashboard statistics.

const PATH = '/admin/recruitments'

export default async function AdminRecruitmentListScreen({ saved }: { saved: boolean }) {
    const [, recruitments, statistics] = await Promise.all([
        requireViewer('ADMIN', PATH),
        new RecruitmentController().loadRecruitments(),
        new DashboardController().loadStatistics(),
    ])
    redirectOnFailure(statistics, PATH)

    const totals = new Map(
        statistics.ok
            ? statistics.data.perRecruitment.map((row) => [row.recruitmentId, row.total] as const)
            : [],
    )
    const summary = [
        recruitments.length === 1 ? 'One recruitment' : `${recruitments.length} recruitments`,
        statistics.ok
            ? `${statistics.data.totalApplications} ${statistics.data.totalApplications === 1 ? 'application' : 'applications'} received`
            : null,
    ]
        .filter(Boolean)
        .join(' · ')

    return (
        <>
            <AdminHeader
                title="Recruitments"
                description={summary}
                actions={
                    <Link href="/admin/recruitments/new" className={buttonVariants()}>
                        <Plus aria-hidden="true" size={18} strokeWidth={2.2} />
                        Add recruitment
                    </Link>
                }
            />

            <div className="px-3 pt-6 pb-16 sm:px-6 lg:px-12">
                <div className="mx-auto flex w-full max-w-[1104px] flex-col gap-4">
                    {saved ? (
                        <Notice tone="success" icon={CircleCheck}>
                            The recruitment was saved.
                        </Notice>
                    ) : null}

                    {recruitments.length === 0 ? (
                        <EmptyRegister
                            title="No recruitments yet."
                            action={
                                <Link
                                    href="/admin/recruitments/new"
                                    className={buttonVariants({ size: 'lg' })}
                                >
                                    <Plus aria-hidden="true" size={18} strokeWidth={2.2} />
                                    Add recruitment
                                </Link>
                            }
                        >
                            <p>
                                Add the first role to start receiving applications. It appears on the public
                                Openings page right away.
                            </p>
                        </EmptyRegister>
                    ) : (
                        <div className="overflow-x-auto rounded-md border border-hairline bg-white">
                            <table className="w-full min-w-[760px] border-collapse text-left">
                                <thead>
                                    <tr className="h-11 border-b-2 border-secondary text-[12.5px] font-semibold text-ink-soft">
                                        <th scope="col" className="w-[110px] px-4 font-semibold">
                                            ID
                                        </th>
                                        <th scope="col" className="px-4 font-semibold">
                                            Role &amp; division
                                        </th>
                                        <th scope="col" className="w-[130px] px-4 font-semibold">
                                            Posted
                                        </th>
                                        <th scope="col" className="w-[100px] px-4 font-semibold">
                                            Applicants
                                        </th>
                                        <th scope="col" className="w-[120px] px-4">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recruitments.map((recruitment) => {
                                        const total = totals.get(recruitment.id)
                                        return (
                                            <tr
                                                key={recruitment.id}
                                                className="border-b border-row-line align-top last:border-b-0 hover:bg-row-hover"
                                            >
                                                <td className="px-4 py-3.5">
                                                    <ShortRef
                                                        id={recruitment.id}
                                                        className="text-[13.5px] font-medium text-link"
                                                    />
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex min-w-0 flex-col gap-0.5">
                                                        <span className="font-display text-[17px] leading-[1.3] font-medium text-ink">
                                                            {recruitment.title}
                                                        </span>
                                                        <span className="text-[13.5px] text-ink-soft">
                                                            {recruitment.division}
                                                        </span>
                                                        <span className="mt-1 line-clamp-2 max-w-[560px] text-[13.5px] leading-[1.45] text-ink-soft">
                                                            {recruitment.description}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-[13.5px] whitespace-nowrap text-ink">
                                                    {formatDate(recruitment.createdAt)}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {total === undefined ? (
                                                        <span className="font-mono text-sm text-ink-faint">
                                                            {'—'}
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            href={`/admin/applicants?recruitmentId=${recruitment.id}`}
                                                            aria-label={`${total} applicants for ${recruitment.title}`}
                                                            className="font-mono text-sm font-semibold"
                                                        >
                                                            {total}
                                                        </Link>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        <Link
                                                            href={`/admin/recruitments/${recruitment.id}/edit`}
                                                            aria-label={`Edit ${recruitment.title}`}
                                                            className={buttonVariants({
                                                                variant: 'secondary',
                                                                size: 'sm',
                                                            })}
                                                        >
                                                            Edit
                                                        </Link>
                                                        <RecruitmentRowMenu
                                                            recruitmentId={recruitment.id}
                                                            title={recruitment.title}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

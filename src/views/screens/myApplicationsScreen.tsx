import { ArrowRight, CircleCheck } from 'lucide-react'
import Link from 'next/link'
import { ApplicationController } from '../../controllers/applicationController.ts'
import { formatDate } from '../../utils/dateFormat.ts'
import ContentSheet from '../components/brand/contentSheet.tsx'
import EmptyRegister from '../components/brand/emptyRegister.tsx'
import HeroBand from '../components/brand/heroBand.tsx'
import ShortRef from '../components/brand/shortRef.tsx'
import StageTrack from '../components/brand/stageTrack.tsx'
import StatusTag from '../components/brand/statusTag.tsx'
import Notice from '../components/feedback/notice.tsx'
import { requireViewer } from '../components/guards/requireViewer.ts'
import { buttonVariants } from '../components/ui/button.tsx'
import type { ApplicationStatus } from '../../types/applicationStatus.ts'

// Screen 07, UC-08: the applicant's own applications (F_UNAIREC_08_03), one register entry each
// with the shared reference number, the status tag, and the stage track. The data model keeps no
// per-application note from the team, so each entry explains its current status instead.

const STATUS_EXPLANATION: Record<ApplicationStatus, string> = {
    PENDING: 'Your application has been received and is waiting for review by the recruitment team.',
    INTERVIEW: 'You have moved on to the interview stage of this role.',
    ACCEPTED: 'Your application for this role was accepted.',
    REJECTED: 'Your application was not successful this time. You can still apply for other roles.',
}

export default async function MyApplicationsScreen({ submittedId }: { submittedId: string | null }) {
    const [, applications] = await Promise.all([
        requireViewer('APPLICANT', '/my-applications'),
        new ApplicationController().loadMyApplications(),
    ])
    const submitted = submittedId
        ? applications.find((application) => application.id === submittedId)
        : undefined

    return (
        <>
            <HeroBand tone="applicant" className="px-4 pt-6 pb-5 sm:px-6 lg:px-16 lg:pt-9 lg:pb-8">
                <div className="mx-auto flex w-full max-w-[1072px] flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="font-display text-[29px] leading-[1.1] font-medium tracking-[-0.02em] text-ink lg:text-[40px]">
                            My applications
                        </h1>
                        {applications.length > 0 ? (
                            <p className="text-[15px] text-ink-soft">
                                {applications.length === 1
                                    ? 'One application'
                                    : `${applications.length} applications`}
                            </p>
                        ) : null}
                    </div>
                    {applications.length > 0 ? (
                        <Link href="/recruitments" className={buttonVariants({ variant: 'secondary' })}>
                            See other roles
                        </Link>
                    ) : null}
                </div>
            </HeroBand>

            <div className="px-3 pt-4 pb-16 sm:px-6 lg:px-16 lg:pt-7 lg:pb-[72px]">
                <div className="mx-auto flex w-full max-w-[1072px] flex-col gap-4">
                    {submitted ? (
                        <Notice tone="success" icon={CircleCheck}>
                            Your application for <b>{submitted.recruitmentTitle}</b> was submitted. Its status
                            is Pending until the recruitment team reviews it.
                        </Notice>
                    ) : null}

                    {applications.length === 0 ? (
                        <EmptyRegister
                            title="No names in this register yet."
                            action={
                                <Link href="/recruitments" className={buttonVariants({ size: 'lg' })}>
                                    Browse open roles
                                    <ArrowRight aria-hidden="true" size={18} strokeWidth={2.2} />
                                </Link>
                            }
                        >
                            <p>
                                You haven{'’'}t applied for any role yet. Every application you submit is
                                recorded here with its status.
                            </p>
                        </EmptyRegister>
                    ) : (
                        <ContentSheet className="px-4 sm:px-7">
                            <ul aria-label="Your applications">
                                {applications.map((application) => (
                                    <li
                                        key={application.id}
                                        className="grid gap-2.5 border-b border-hairline py-4 last:border-b-0 md:grid-cols-[150px_minmax(0,1fr)] md:gap-7 md:py-[26px] lg:grid-cols-[150px_minmax(0,1fr)_360px]"
                                    >
                                        <div className="flex items-center justify-between gap-3 md:flex-col md:items-start md:justify-start md:gap-1">
                                            <ShortRef
                                                id={application.id}
                                                className="text-[12.5px] font-semibold text-link md:text-sm"
                                            />
                                            <span className="hidden text-[13px] text-ink-soft md:block">
                                                Submitted {formatDate(application.submittedAt)}
                                            </span>
                                            <StatusTag status={application.status} className="md:hidden" />
                                        </div>
                                        <div className="flex min-w-0 flex-col gap-2">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h2 className="font-display text-lg leading-[1.25] font-medium md:text-[21px]">
                                                    <Link
                                                        href={`/recruitments/${application.recruitmentId}`}
                                                        className="text-ink no-underline hover:text-link hover:underline"
                                                    >
                                                        {application.recruitmentTitle}
                                                    </Link>
                                                </h2>
                                                <StatusTag
                                                    status={application.status}
                                                    className="hidden md:inline-flex"
                                                />
                                            </div>
                                            <span className="text-[13.5px] text-ink-soft">
                                                {application.recruitmentDivision}
                                                <span className="md:hidden">
                                                    {' · '}Submitted {formatDate(application.submittedAt)}
                                                </span>
                                            </span>
                                            <p className="mt-1 text-sm leading-[1.55] text-pretty text-ink md:text-[15px]">
                                                {STATUS_EXPLANATION[application.status]}
                                            </p>
                                        </div>
                                        <div className="pt-1 md:col-span-2 lg:col-span-1">
                                            <div className="lg:hidden">
                                                <StageTrack status={application.status} size="sm" />
                                            </div>
                                            <div className="hidden lg:block">
                                                <StageTrack
                                                    status={application.status}
                                                    submittedLabel={formatDate(application.submittedAt)}
                                                />
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </ContentSheet>
                    )}
                </div>
            </div>
        </>
    )
}

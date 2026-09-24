import Link from 'next/link'
import type { ReactNode } from 'react'
import { ApplicationController } from '../../controllers/applicationController.ts'
import { cn } from '../../utils/cn.ts'
import ApplyForm from '../components/application/applyForm.tsx'
import EmptyRegister from '../components/brand/emptyRegister.tsx'
import HeroBand from '../components/brand/heroBand.tsx'
import ErrorPanel from '../components/feedback/errorPanel.tsx'
import { redirectOnFailure } from '../components/guards/redirectOnFailure.ts'
import { requireViewer } from '../components/guards/requireViewer.ts'
import { loadRecruitmentDetail } from '../components/recruitments/loadRecruitmentDetail.ts'
import { buttonVariants } from '../components/ui/button.tsx'
import type { FormAction } from '../../types/formAction.ts'

// Screen 06, UC-07 and UC-15. Signed-in applicants only (AB-09). The applicant workspace has a
// calmer tint header than the public hero; the form's content comes from loadApplicationForm,
// including the admin-defined questions (AB-11).

function ApplicantHeader({
    recruitmentId,
    title,
    division,
    showRequiredNote,
}: {
    recruitmentId: string
    title: string
    division: string
    showRequiredNote: boolean
}) {
    return (
        <HeroBand tone="applicant" className="px-4 py-6 sm:px-6 lg:px-12 lg:py-7">
            <div className="mx-auto w-full max-w-[1104px] lg:pl-[220px]">
                <div className="flex flex-col gap-2">
                    <nav aria-label="Breadcrumb" className="text-[13.5px] text-ink-soft">
                        <ol className="flex flex-wrap gap-1.5">
                            <li>
                                <Link href={`/recruitments/${recruitmentId}`} transitionTypes={['nav-back']}>
                                    {title}
                                </Link>
                            </li>
                            <li aria-hidden="true">/</li>
                            <li aria-current="page">Application</li>
                        </ol>
                    </nav>
                    <h1 className="font-display text-[28px] leading-[1.12] font-medium tracking-[-0.02em] text-ink lg:text-4xl">
                        Application form
                    </h1>
                    <p className="text-[14.5px] text-ink-soft">
                        {division}
                        {showRequiredNote ? (
                            <>
                                {' · '}
                                <span aria-hidden="true" className="font-bold text-link">
                                    *
                                </span>{' '}
                                required
                            </>
                        ) : null}
                    </p>
                </div>
            </div>
        </HeroBand>
    )
}

function Body({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-3 py-6 sm:px-6 lg:px-12 lg:py-7', className)}>
            <div className="mx-auto w-full max-w-[1104px] lg:pl-[220px]">{children}</div>
        </div>
    )
}

export default async function ApplyScreen({
    recruitmentId,
    submitAction,
}: {
    recruitmentId: string
    submitAction: FormAction<{ applicationId: string }>
}) {
    const currentPath = `/recruitments/${recruitmentId}/apply`
    // The controller authorizes on its own (L-5), so the guard and the load run together.
    const [, result] = await Promise.all([
        requireViewer('APPLICANT', currentPath),
        new ApplicationController().loadApplicationForm(recruitmentId),
    ])

    if (!result.ok && result.code === 'CONFLICT') {
        const recruitment = await loadRecruitmentDetail(recruitmentId)
        return (
            <>
                <ApplicantHeader
                    recruitmentId={recruitmentId}
                    title={recruitment?.title ?? 'Role'}
                    division={recruitment?.division ?? ''}
                    showRequiredNote={false}
                />
                <Body>
                    <EmptyRegister
                        title={result.error}
                        action={
                            <Link href="/my-applications" className={buttonVariants({ size: 'lg' })}>
                                View My applications
                            </Link>
                        }
                    >
                        <p>
                            Each role accepts one application per person, and a role stops accepting new
                            applications once it{'’'}s closed. You can follow your existing applications in My
                            applications.
                        </p>
                    </EmptyRegister>
                </Body>
            </>
        )
    }

    if (!result.ok) {
        redirectOnFailure(result, currentPath)
        return (
            <Body>
                <ErrorPanel
                    title="The application form could not be loaded."
                    message={result.error}
                    action={
                        <Link
                            href={`/recruitments/${recruitmentId}`}
                            className={buttonVariants({ variant: 'outline' })}
                        >
                            Back to the role
                        </Link>
                    }
                />
            </Body>
        )
    }

    const { recruitment } = result.data
    return (
        <>
            <ApplicantHeader
                recruitmentId={recruitment.id}
                title={recruitment.title}
                division={recruitment.division}
                showRequiredNote
            />
            <ApplyForm data={result.data} action={submitAction} />
        </>
    )
}

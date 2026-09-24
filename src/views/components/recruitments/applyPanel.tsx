import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '../../../utils/cn.ts'
import { formatDate } from '../../../utils/dateFormat.ts'
import { MAX_FILE_SIZE_MB } from '../../../utils/fileConstraints.ts'
import ContentSheet from '../brand/contentSheet.tsx'
import StatusTag from '../brand/statusTag.tsx'
import { buttonVariants } from '../ui/button.tsx'
import type { SessionUser } from '../../../types/auth/sessionUser.ts'
import type { ApplicationSummary } from '../../../types/applications/applicationSummary.ts'
import type { RecruitmentDetail } from '../../../types/recruitments/recruitmentDetail.ts'

// The apply panel of screen 02: the key action zone, a white sheet with a Primary Blue rule that
// breaks through the hero. What it offers depends on who is looking (AB-09: guests are sent to
// sign in first), and it lists what to prepare, derived from the recruitment's form settings.

function PreparationList({ recruitment }: { recruitment: RecruitmentDetail }) {
    const fileFields = recruitment.fields.filter((field) => field.type === 'FILE')
    const questions = recruitment.fields.filter((field) => field.type !== 'FILE')
    const requiredQuestions = questions.filter((field) => field.category === 'REQUIRED').length

    const rows: Array<{ label: string; note: string }> = [{ label: 'Motivation statement', note: 'Required' }]
    for (const field of fileFields) {
        rows.push({
            label: `${field.name}, file up to ${MAX_FILE_SIZE_MB} MB`,
            note: field.category === 'REQUIRED' ? 'Required' : 'Optional',
        })
    }
    rows.push({ label: `CV as PDF, up to ${MAX_FILE_SIZE_MB} MB`, note: 'Optional' })
    if (questions.length > 0) {
        rows.push({
            label:
                questions.length === 1
                    ? 'One question for this role'
                    : `${questions.length} questions for this role`,
            note:
                requiredQuestions === 0
                    ? 'Optional'
                    : requiredQuestions === questions.length
                      ? 'Required'
                      : `${requiredQuestions} required`,
        })
    }

    return (
        <div className="flex flex-col gap-2.5 border-t border-hairline pt-4">
            <h2 className="text-sm font-semibold text-ink">Prepare before you start</h2>
            <ul className="flex flex-col gap-2.5">
                {rows.map((row) => (
                    <li key={row.label} className="flex justify-between gap-3 text-sm text-ink">
                        <span>{row.label}</span>
                        <span className="shrink-0 text-ink-soft">{row.note}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function CallToAction({
    recruitment,
    viewer,
    application,
}: {
    recruitment: RecruitmentDetail
    viewer: SessionUser | null
    application: ApplicationSummary | null
}) {
    const applyPath = `/recruitments/${recruitment.id}/apply`
    const ctaClass = cn(buttonVariants({ size: 'xl' }), 'w-full')

    if (!viewer) {
        const next = encodeURIComponent(applyPath)
        return (
            <>
                <Link href={`/login?next=${next}`} className={ctaClass}>
                    Apply for this role
                    <ArrowRight aria-hidden="true" size={18} strokeWidth={2.2} />
                </Link>
                <p className="text-sm leading-[1.5] text-ink-soft">
                    You need to <Link href={`/login?next=${next}`}>sign in</Link> to apply. No account yet?{' '}
                    <Link href={`/register?next=${next}`}>Create one</Link> {'—'} it takes a minute.
                </p>
            </>
        )
    }

    if (viewer.role === 'ADMIN') {
        return (
            <>
                <p className="text-sm leading-[1.5] text-ink-soft">
                    You are signed in as an admin. Applicants apply for this role from this page.
                </p>
                <Link
                    href={`/admin/recruitments/${recruitment.id}/edit`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}
                >
                    Edit recruitment
                </Link>
            </>
        )
    }

    if (application) {
        return (
            <>
                <div className="flex flex-col items-start gap-2">
                    <StatusTag status={application.status} />
                    <p className="text-sm leading-[1.5] text-ink">
                        You applied for this role on {formatDate(application.submittedAt)}.
                    </p>
                </div>
                <Link
                    href="/my-applications"
                    className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'w-full')}
                >
                    View in My applications
                </Link>
            </>
        )
    }

    return (
        <Link href={applyPath} transitionTypes={['nav-forward']} className={ctaClass}>
            Apply for this role
            <ArrowRight aria-hidden="true" size={18} strokeWidth={2.2} />
        </Link>
    )
}

export default function ApplyPanel({
    recruitment,
    viewer,
    application,
    className,
}: {
    recruitment: RecruitmentDetail
    viewer: SessionUser | null
    application: ApplicationSummary | null
    className?: string
}) {
    return (
        <ContentSheet rule="action" className={cn('flex flex-col gap-[18px] p-6', className)}>
            <div className="flex flex-col gap-1">
                <span className="text-[13px] text-ink-soft">Posted</span>
                <span className="font-display text-[22px] font-medium text-ink">
                    {formatDate(recruitment.createdAt)}
                </span>
            </div>
            <CallToAction recruitment={recruitment} viewer={viewer} application={application} />
            {application ? null : <PreparationList recruitment={recruitment} />}
        </ContentSheet>
    )
}

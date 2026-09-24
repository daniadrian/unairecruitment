import { Megaphone } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApplicationController } from '../../controllers/applicationController.ts'
import { splitLines } from '../../utils/textFormat.ts'
import HeroBand from '../components/brand/heroBand.tsx'
import { getViewer } from '../components/guards/getViewer.ts'
import ApplyPanel from '../components/recruitments/applyPanel.tsx'
import { loadRecruitmentDetail } from '../components/recruitments/loadRecruitmentDetail.ts'

// Screen 02, UC-06 (AB-09: visible without signing in). The title and the apply action get the
// strongest contrast: white title on the hero and a white apply panel that breaks through it.
// Requirements are the admin's text split per line into a numbered list.

const SELECTION_STAGES = [
    { title: 'Submit the form', text: 'Answer the questions for this role and attach your files.' },
    { title: 'Interview', text: 'Shortlisted applicants are invited to an interview.' },
    { title: 'Decision', text: 'The final result appears in My applications.' },
]

export default async function RecruitmentDetailScreen({ recruitmentId }: { recruitmentId: string }) {
    const [recruitment, viewer, myApplications] = await Promise.all([
        loadRecruitmentDetail(recruitmentId),
        getViewer(),
        new ApplicationController().loadMyApplications(),
    ])
    if (!recruitment) notFound()

    const application = myApplications.find((item) => item.recruitmentId === recruitment.id) ?? null
    const requirements = splitLines(recruitment.requirements)

    return (
        <>
            <HeroBand
                tone="public"
                className="px-4 pt-6 pb-10 sm:px-6 lg:min-h-[280px] lg:px-16 lg:pt-8 lg:pb-16"
            >
                <div className="mx-auto w-full max-w-[1072px]">
                    <div className="flex max-w-[660px] flex-col gap-3.5">
                        <nav aria-label="Breadcrumb" className="text-[13.5px] text-hero-eyebrow">
                            <ol className="flex flex-wrap gap-2">
                                <li>
                                    <Link
                                        href="/recruitments"
                                        transitionTypes={['nav-back']}
                                        className="text-white"
                                    >
                                        Openings
                                    </Link>
                                </li>
                                <li aria-hidden="true">/</li>
                                <li aria-current="page">{recruitment.title}</li>
                            </ol>
                        </nav>
                        <span className="mt-2.5 inline-flex items-center gap-2 self-start rounded-sm border border-white/45 px-2.5 py-[5px] text-[13px] font-semibold text-white">
                            <Megaphone aria-hidden="true" size={14} strokeWidth={2} />
                            {recruitment.division}
                        </span>
                        <h1 className="font-display text-[32px] leading-[1.1] font-medium tracking-[-0.02em] text-balance text-white lg:text-5xl lg:leading-[1.06]">
                            {recruitment.title}
                        </h1>
                        <p className="text-base leading-[1.6] font-medium whitespace-pre-line text-pretty text-hero-lead lg:text-lg">
                            {recruitment.description}
                        </p>
                    </div>
                </div>
            </HeroBand>

            <div className="px-3 pb-16 sm:px-6 lg:px-16 lg:pb-[72px]">
                <div className="mx-auto grid w-full max-w-[1072px] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
                    <ApplyPanel
                        recruitment={recruitment}
                        viewer={viewer}
                        application={application}
                        className="-mt-6 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:-mt-[236px]"
                    />

                    <article className="flex min-w-0 flex-col gap-7 px-1 lg:col-start-1 lg:row-start-1 lg:px-0 lg:pt-7">
                        <section
                            aria-labelledby="requirements-heading"
                            className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6"
                        >
                            <h2
                                id="requirements-heading"
                                className="font-display text-xl font-medium text-ink"
                            >
                                Requirements
                            </h2>
                            <ol className="flex flex-col gap-2.5 text-base leading-[1.55] text-ink">
                                {requirements.map((requirement, index) => (
                                    <li key={`${index}-${requirement}`} className="grid grid-cols-[32px_1fr]">
                                        <span className="pt-0.5 font-mono text-sm font-medium text-link">
                                            {index + 1}.
                                        </span>
                                        {requirement}
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section
                            aria-labelledby="stages-heading"
                            className="grid gap-4 border-t border-rule pt-6 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6"
                        >
                            <h2 id="stages-heading" className="font-display text-xl font-medium text-ink">
                                Selection stages
                            </h2>
                            <ol className="grid gap-5 sm:grid-cols-3">
                                {SELECTION_STAGES.map((stage, index) => (
                                    <li
                                        key={stage.title}
                                        className={
                                            index === 0
                                                ? 'flex flex-col gap-1.5 border-t-[3px] border-primary pt-2.5'
                                                : 'flex flex-col gap-1.5 border-t-[3px] border-sky pt-2.5'
                                        }
                                    >
                                        <span
                                            className={
                                                index === 0
                                                    ? 'font-mono text-[13px] font-medium text-link'
                                                    : 'font-mono text-[13px] font-medium text-ink-faint'
                                            }
                                        >
                                            Stage {index + 1}
                                        </span>
                                        <b className="text-[15px] font-semibold text-ink">{stage.title}</b>
                                        <span className="text-sm leading-[1.5] text-ink-soft">
                                            {stage.text}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </article>
                </div>
            </div>
        </>
    )
}

import { Check, X } from 'lucide-react'
import { cn } from '../../../utils/cn.ts'
import type { ApplicationStatus } from '../../../types/applicationStatus.ts'

// The stage track of "My applications": done = Secondary Blue fill with a check, current =
// glowing Primary Blue ring, upcoming = dashed, and the decision is teal (accepted) or
// blue-black (rejected). Only the submission date is known, so later steps carry no date.

type StepState = 'done' | 'current' | 'upcoming' | 'accepted' | 'rejected'

const STEP_NAMES = ['Submitted', 'Interview', 'Decision'] as const

const STATES: Record<ApplicationStatus, [StepState, StepState, StepState]> = {
    PENDING: ['current', 'upcoming', 'upcoming'],
    INTERVIEW: ['done', 'current', 'upcoming'],
    ACCEPTED: ['done', 'done', 'accepted'],
    REJECTED: ['done', 'done', 'rejected'],
}

const STATE_TEXT: Record<StepState, string> = {
    done: 'completed',
    current: 'current step',
    upcoming: 'not reached yet',
    accepted: 'accepted',
    rejected: 'not successful',
}

function Marker({ state }: { state: StepState }) {
    if (state === 'done') {
        return (
            <span className="grid size-[18px] place-items-center rounded-full bg-secondary">
                <Check aria-hidden="true" size={12} strokeWidth={3.2} className="text-white" />
            </span>
        )
    }
    if (state === 'current') {
        return (
            <span className="grid size-[18px] place-items-center rounded-full border-2 border-primary bg-white shadow-[0_0_0_3px_var(--color-glow)]">
                <span className="size-2 rounded-full bg-primary" />
            </span>
        )
    }
    if (state === 'accepted') {
        return (
            <span className="grid size-[18px] place-items-center rounded-full bg-teal">
                <Check aria-hidden="true" size={12} strokeWidth={3.2} className="text-white" />
            </span>
        )
    }
    if (state === 'rejected') {
        return (
            <span className="grid size-[18px] place-items-center rounded-full bg-ink">
                <X aria-hidden="true" size={11} strokeWidth={3.4} className="text-white" />
            </span>
        )
    }
    return <span className="size-[18px] rounded-full border-[1.5px] border-dashed border-field bg-white" />
}

export default function StageTrack({
    status,
    submittedLabel,
    size = 'md',
}: {
    status: ApplicationStatus
    submittedLabel?: string
    size?: 'md' | 'sm'
}) {
    const compact = size === 'sm'
    const states = STATES[status]
    return (
        <ol aria-label="Selection stages" className="flex items-start">
            {STEP_NAMES.map((name, index) => (
                <li key={name} className={cn('flex items-start', index > 0 && 'flex-1')}>
                    {index > 0 ? (
                        <span aria-hidden="true" className="mt-2 h-0.5 min-w-4 flex-1 bg-sky" />
                    ) : null}
                    <span
                        className={cn(
                            'flex flex-col items-center gap-1.5 text-center',
                            compact ? 'w-20' : 'w-[100px]',
                        )}
                    >
                        <Marker state={states[index]} />
                        <span
                            className={cn(
                                'font-semibold text-ink',
                                compact ? 'text-[12.5px]' : 'text-[13px]',
                            )}
                        >
                            {name}
                            <span className="sr-only">, {STATE_TEXT[states[index]]}</span>
                        </span>
                        {index === 0 && submittedLabel && !compact ? (
                            <span className="font-mono text-xs text-ink-faint">{submittedLabel}</span>
                        ) : null}
                    </span>
                </li>
            ))}
        </ol>
    )
}

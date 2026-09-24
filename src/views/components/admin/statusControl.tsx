'use client'

import { CircleCheck, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { useState } from 'react'
import { cn } from '../../../utils/cn.ts'
import { APPLICATION_STATUS_LABELS } from '../../../utils/fieldLabels.ts'
import ContentSheet from '../brand/contentSheet.tsx'
import StatusTag from '../brand/statusTag.tsx'
import Notice from '../feedback/notice.tsx'
import { formErrorOf } from '../forms/actionErrors.ts'
import { useFormAction } from '../forms/useFormAction.ts'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../ui/alertDialog.tsx'
import { Button } from '../ui/button.tsx'
import type { ApplicationStatus } from '../../../types/applicationStatus.ts'
import type { FormAction } from '../../../types/formAction.ts'

// UC-14 on screen 12: a vertical radio group of the four statuses. The options the admin may pick
// come from the controller (allowedStatuses, AB-01); passed stages are locked with a padlock and
// a written reason instead of only being greyed out. Saving asks for confirmation first, and the
// controller validates the transition again on the server (AL-01).

const ORDER: ApplicationStatus[] = ['PENDING', 'INTERVIEW', 'ACCEPTED', 'REJECTED']

type OptionState = 'current' | 'locked' | 'available' | 'chosen'

function Indicator({ state }: { state: OptionState }) {
    if (state === 'locked')
        return <Lock aria-hidden="true" size={16} strokeWidth={2.2} className="text-ink-faint" />
    if (state === 'current') {
        return (
            <span className="grid size-[18px] place-items-center rounded-full border-2 border-ink">
                <span className="size-2 rounded-full bg-ink" />
            </span>
        )
    }
    if (state === 'chosen') {
        return (
            <span className="grid size-[18px] place-items-center rounded-full border-2 border-primary bg-white">
                <span className="size-2 rounded-full bg-primary" />
            </span>
        )
    }
    return <span className="size-[18px] rounded-full border-[1.5px] border-field bg-white" />
}

const OPTION_STYLES: Record<OptionState, string> = {
    current: 'border-[1.5px] border-ink bg-white',
    locked: 'cursor-not-allowed border border-hairline bg-page',
    available: 'cursor-pointer border border-field bg-white hover:border-primary hover:bg-mist',
    chosen: 'cursor-pointer border-2 border-primary bg-tint',
}

export default function StatusControl({
    applicationId,
    applicantName,
    current,
    allowed,
    action,
}: {
    applicationId: string
    applicantName: string
    current: ApplicationStatus
    allowed: ApplicationStatus[]
    action: FormAction<{ status: ApplicationStatus }>
}) {
    const router = useRouter()
    const [choice, setChoice] = useState<ApplicationStatus | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saved, setSaved] = useState<ApplicationStatus | null>(null)
    const { state, isPending, submit } = useFormAction(action, (data) => {
        setSaved(data.status)
        setChoice(null)
        router.refresh()
    })

    const decided = current === 'ACCEPTED' || current === 'REJECTED'
    const error = formErrorOf(state)

    function noteFor(status: ApplicationStatus): string {
        if (status === current) return 'Current status'
        if (!allowed.includes(status)) return 'Already passed — cannot go back'
        if (decided) return 'Correct the decision'
        return status === 'INTERVIEW' ? 'Move to the next stage' : 'Final decision'
    }

    function stateOf(status: ApplicationStatus): OptionState {
        if (status === current) return 'current'
        if (!allowed.includes(status)) return 'locked'
        return status === choice ? 'chosen' : 'available'
    }

    function confirm() {
        if (!choice) return
        const formData = new FormData()
        formData.set('applicationId', applicationId)
        formData.set('status', choice)
        setSaved(null)
        submit(formData)
    }

    const choiceLabel = choice ? APPLICATION_STATUS_LABELS[choice] : ''
    const consequence = decided
        ? `${applicantName} will see the corrected status in My applications.`
        : `${applicantName} will see the new status in My applications. Once saved, the status can’t move back to an earlier stage.`

    return (
        <ContentSheet rule="action" className="flex flex-col gap-3.5 p-5">
            <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-medium text-ink">Change status</h2>
                <p className="text-[13.5px] leading-[1.5] text-ink-soft">
                    Status can only move forward. Accepted and Rejected can be swapped to correct a decision.
                </p>
            </div>

            <RadioGroupPrimitive.Root
                aria-label="Application status"
                value={choice ?? ''}
                onValueChange={(value) => setChoice(value as ApplicationStatus)}
                className="flex flex-col gap-2"
            >
                {ORDER.map((status) => {
                    const optionState = stateOf(status)
                    return (
                        <RadioGroupPrimitive.Item
                            key={status}
                            value={status}
                            disabled={optionState === 'current' || optionState === 'locked'}
                            className={cn(
                                'grid grid-cols-[20px_minmax(0,1fr)] items-center gap-3 rounded-md px-3 py-2.5 text-left',
                                OPTION_STYLES[optionState],
                            )}
                        >
                            <Indicator state={optionState} />
                            <span
                                className={cn(
                                    'flex min-w-0 flex-col items-start gap-[5px]',
                                    optionState === 'locked' && 'opacity-80',
                                )}
                            >
                                <StatusTag status={status} />
                                <span
                                    className={cn(
                                        'text-[12.5px]',
                                        optionState === 'current' && 'font-semibold text-ink',
                                        optionState === 'chosen' && 'font-semibold text-interview-ink',
                                        (optionState === 'available' || optionState === 'locked') &&
                                            'text-ink-soft',
                                    )}
                                >
                                    {optionState === 'chosen'
                                        ? `New status · ${noteFor(status)}`
                                        : noteFor(status)}
                                </span>
                            </span>
                        </RadioGroupPrimitive.Item>
                    )
                })}
            </RadioGroupPrimitive.Root>

            {choice ? (
                <div className="flex gap-2">
                    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button className="h-11 flex-1" disabled={isPending}>
                                Change to {choiceLabel}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogTitle>
                                Change {applicantName}
                                {'’'}s status to {choiceLabel}?
                            </AlertDialogTitle>
                            <div className="flex items-center gap-2.5">
                                <StatusTag status={current} />
                                <span aria-hidden="true" className="font-mono text-[15px] text-ink-faint">
                                    {'→'}
                                </span>
                                <span className="sr-only">to</span>
                                <StatusTag status={choice} />
                            </div>
                            <AlertDialogDescription>{consequence}</AlertDialogDescription>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirm}>
                                    Yes, change to {choiceLabel}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" className="h-11" onClick={() => setChoice(null)}>
                        Cancel
                    </Button>
                </div>
            ) : (
                <Button disabled className="h-11 w-full">
                    {isPending ? 'Saving…' : 'Choose a new status'}
                </Button>
            )}

            <div aria-live="polite">
                {error ? <Notice tone="error">{error}</Notice> : null}
                {saved && !error && !isPending ? (
                    <Notice tone="success" icon={CircleCheck}>
                        Status changed to {APPLICATION_STATUS_LABELS[saved]}.
                    </Notice>
                ) : null}
            </div>
        </ContentSheet>
    )
}

'use client'

import { CircleCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { formErrorOf } from '../forms/actionErrors.ts'
import { useFormAction } from '../forms/useFormAction.ts'
import RecruitmentStatusTag from '../brand/recruitmentStatusTag.tsx'
import Notice from '../feedback/notice.tsx'
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
import type { FormAction } from '../../../types/formAction.ts'
import type { RecruitmentStatus } from '../../../types/recruitmentStatus.ts'

// UC-09 (AB-04): a binary open/close toggle on the recruitment's own management screen, the same
// place a single record's status is changed elsewhere in the admin (StatusControl on the
// applicant detail screen). Saving asks for confirmation first, and the controller re-checks the
// admin role on the server (AL-05, L-5).

export default function RecruitmentStatusControl({
    recruitmentId,
    title,
    status,
    action,
}: {
    recruitmentId: string
    title: string
    status: RecruitmentStatus
    action: FormAction<{ id: string; status: RecruitmentStatus }>
}) {
    const router = useRouter()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saved, setSaved] = useState<RecruitmentStatus | null>(null)
    const { state, isPending, submit } = useFormAction(action, (data) => {
        setSaved(data.status)
        router.refresh()
    })

    const error = formErrorOf(state)
    const nextStatus: RecruitmentStatus = status === 'OPEN' ? 'CLOSED' : 'OPEN'
    const actionLabel = nextStatus === 'CLOSED' ? 'Close recruitment' : 'Reopen recruitment'
    const consequence =
        nextStatus === 'CLOSED'
            ? `Applicants will no longer be able to apply for ${title}. It disappears from the public Openings page, but everyone who already applied stays exactly as they are — you can reopen it anytime.`
            : `${title} will accept new applications again and reappear on the public Openings page.`

    function confirm() {
        const formData = new FormData()
        formData.set('id', recruitmentId)
        formData.set('status', nextStatus)
        setSaved(null)
        submit(formData)
    }

    return (
        <div className="flex flex-col gap-2.5 border-b border-hairline py-3">
            <div className="flex items-center justify-between gap-3">
                <span className="text-ink-soft">Status</span>
                <RecruitmentStatusTag status={status} />
            </div>

            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button
                        variant={nextStatus === 'CLOSED' ? 'outline' : 'secondary'}
                        size="sm"
                        disabled={isPending}
                        className="w-full"
                    >
                        {isPending ? 'Saving…' : actionLabel}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogTitle>{actionLabel}?</AlertDialogTitle>
                    <AlertDialogDescription>{consequence}</AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirm}>Yes, {actionLabel.toLowerCase()}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div aria-live="polite">
                {error ? <Notice tone="error">{error}</Notice> : null}
                {saved && !error && !isPending ? (
                    <Notice tone="success" icon={CircleCheck}>
                        {saved === 'CLOSED' ? 'Recruitment closed.' : 'Recruitment reopened.'}
                    </Notice>
                ) : null}
            </div>
        </div>
    )
}

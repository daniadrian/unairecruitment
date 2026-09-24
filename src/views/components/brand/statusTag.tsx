import { CircleCheck, CircleX, Clock, MessageCircle, type LucideIcon } from 'lucide-react'
import { APPLICATION_STATUS_LABELS } from '../../../utils/fieldLabels.ts'
import { cn } from '../../../utils/cn.ts'
import type { ApplicationStatus } from '../../../types/applicationStatus.ts'

// ui-mockups/StatusTag.dc.html. A status is read three ways: icon shape, label, and colour.
// Pending is a dashed outline on white (untouched), Interview tonal blue, Accepted teal, and
// Rejected the only muted red in the whole system.

const STYLES: Record<ApplicationStatus, string> = {
    PENDING: 'border-dashed border-pending-line bg-white text-pending-ink',
    INTERVIEW: 'border-sky bg-tint text-interview-ink',
    ACCEPTED: 'border-teal-line bg-teal-tint text-accepted-ink',
    REJECTED: 'border-rejected-line bg-rejected-bg text-rejected-ink',
}

const ICONS: Record<ApplicationStatus, LucideIcon> = {
    PENDING: Clock,
    INTERVIEW: MessageCircle,
    ACCEPTED: CircleCheck,
    REJECTED: CircleX,
}

export default function StatusTag({ status, className }: { status: ApplicationStatus; className?: string }) {
    const Icon = ICONS[status]
    return (
        <span
            className={cn(
                'inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border pr-[9px] pl-[7px] text-[12.5px] leading-none font-semibold',
                STYLES[status],
                className,
            )}
        >
            <Icon aria-hidden="true" size={14} strokeWidth={2.2} />
            {APPLICATION_STATUS_LABELS[status]}
        </span>
    )
}

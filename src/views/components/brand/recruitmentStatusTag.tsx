import { DoorClosed, DoorOpen, type LucideIcon } from 'lucide-react'
import { RECRUITMENT_STATUS_LABELS } from '../../../utils/fieldLabels.ts'
import { cn } from '../../../utils/cn.ts'
import type { RecruitmentStatus } from '../../../types/recruitmentStatus.ts'

// A recruitment's own status tag (AB-04), kept visually distinct from application StatusTag: a
// different icon set (door open/closed) so the two never read as the same kind of status. Closed
// uses the neutral/muted style, not the red used for a rejected application — closing a
// recruitment is a deliberate admin action, not a negative outcome.

const STYLES: Record<RecruitmentStatus, string> = {
    OPEN: 'border-teal-line bg-teal-tint text-accepted-ink',
    CLOSED: 'border-hairline bg-page text-ink-soft',
}

const ICONS: Record<RecruitmentStatus, LucideIcon> = {
    OPEN: DoorOpen,
    CLOSED: DoorClosed,
}

export default function RecruitmentStatusTag({
    status,
    className,
}: {
    status: RecruitmentStatus
    className?: string
}) {
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
            {RECRUITMENT_STATUS_LABELS[status]}
        </span>
    )
}

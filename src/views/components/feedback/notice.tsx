import { Info, Mail, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../../utils/cn.ts'

// Inline notices from design system v2:
// - success: the teal "Code sent" status on "Forgot password"
// - info: the blue-tint impact note on "Edit recruitment"
// - error: a blue-black outline with a warning icon; errors are never red.

type Tone = 'success' | 'info' | 'error'

const TONES: Record<Tone, { className: string; icon: LucideIcon; role: 'status' | 'note' | 'alert' }> = {
    success: {
        className: 'border border-teal-line bg-teal-tint text-teal-deep',
        icon: Mail,
        role: 'status',
    },
    info: {
        className: 'border border-sky bg-tint text-ink [&>svg]:text-interview-ink',
        icon: Info,
        role: 'note',
    },
    error: {
        className: 'border-2 border-ink bg-white text-ink',
        icon: TriangleAlert,
        role: 'alert',
    },
}

export default function Notice({
    tone,
    icon,
    className,
    children,
}: {
    tone: Tone
    icon?: LucideIcon
    className?: string
    children: ReactNode
}) {
    const style = TONES[tone]
    const Icon = icon ?? style.icon
    return (
        <div
            role={style.role}
            className={cn(
                'flex items-start gap-2.5 rounded-md px-3.5 py-3 text-[14.5px] leading-[1.5]',
                style.className,
                className,
            )}
        >
            <Icon aria-hidden="true" size={18} strokeWidth={2.2} className="mt-0.5 shrink-0" />
            <div className="min-w-0">{children}</div>
        </div>
    )
}

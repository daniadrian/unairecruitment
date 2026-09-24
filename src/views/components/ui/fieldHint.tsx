import type { ReactNode } from 'react'
import { cn } from '../../../utils/cn.ts'

export default function FieldHint({
    id,
    children,
    className,
}: {
    id?: string
    children: ReactNode
    className?: string
}) {
    return (
        <p id={id} className={cn('text-[13px] leading-[1.45] text-ink-soft', className)}>
            {children}
        </p>
    )
}

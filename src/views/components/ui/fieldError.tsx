import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../../utils/cn.ts'

// Inline field error (design system v2 "FormMessage"): blue-black text with a warning icon,
// so it never relies on colour alone. The text itself comes from the controller (V-9).
export default function FieldError({
    id,
    children,
    className,
}: {
    id?: string
    children: ReactNode
    className?: string
}) {
    if (!children) return null
    return (
        <p
            id={id}
            className={cn(
                'flex items-start gap-1.5 text-[13.5px] leading-[1.45] font-semibold text-ink',
                className,
            )}
        >
            <TriangleAlert aria-hidden="true" size={15} strokeWidth={2.2} className="mt-[1px]" />
            <span>{children}</span>
        </p>
    )
}

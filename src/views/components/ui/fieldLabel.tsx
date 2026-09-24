import type { ComponentProps } from 'react'
import { cn } from '../../../utils/cn.ts'

type Requirement = 'required' | 'optional'

// Label with the design's markers: a Primary Blue asterisk for required fields and a quiet
// "(optional)" for optional ones. The asterisk is spelled out for screen readers.
export default function FieldLabel({
    requirement,
    className,
    children,
    ...props
}: ComponentProps<'label'> & { requirement?: Requirement }) {
    return (
        <label className={cn('text-sm font-semibold text-ink', className)} {...props}>
            {children}
            {requirement === 'required' ? (
                <>
                    {' '}
                    <span aria-hidden="true" className="text-link">
                        *
                    </span>
                    <span className="sr-only">(required)</span>
                </>
            ) : null}
            {requirement === 'optional' ? (
                <span className="font-medium text-ink-soft"> (optional)</span>
            ) : null}
        </label>
    )
}

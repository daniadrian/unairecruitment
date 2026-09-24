import type { ComponentProps } from 'react'
import { cn } from '../../../utils/cn.ts'

// White content sheets over the #EEF4FB tint (principle P1). Registers and forms carry a
// Secondary Blue structural top rule; action panels a thicker Primary Blue rule. There are no
// shadows: depth comes from the colour layers.

type Rule = 'structure' | 'action' | 'quiet'

// Side borders are part of each variant: overriding the border colour from outside would also
// replace the top rule colour.
const RULES: Record<Rule, string> = {
    structure: 'border border-hairline border-t-[3px] border-t-secondary',
    action: 'rounded-md border border-hairline border-t-4 border-t-primary',
    quiet: 'rounded-md border border-hairline border-t-4 border-t-sky',
}

export default function ContentSheet({
    rule = 'structure',
    className,
    ...props
}: ComponentProps<'div'> & { rule?: Rule }) {
    return <div className={cn('bg-white', RULES[rule], className)} {...props} />
}

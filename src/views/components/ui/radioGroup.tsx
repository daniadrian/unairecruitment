'use client'

import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../../../utils/cn.ts'

// shadcn/ui "RadioGroup" on Radix. Options are drawn as the design's option cards: a bordered
// row that turns Primary Blue with a tinted fill when selected.

export function RadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
    return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} />
}

export function RadioCard({
    className,
    children,
    ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>) {
    return (
        <RadioGroupPrimitive.Item
            className={cn(
                'group flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-field bg-white px-3 py-2 text-left text-[15px] text-ink hover:border-primary data-[state=checked]:border-[1.5px] data-[state=checked]:border-primary data-[state=checked]:bg-tint data-[state=checked]:font-semibold aria-invalid:border-2 aria-invalid:border-ink',
                className,
            )}
            {...props}
        >
            <span className="grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] border-field bg-white group-data-[state=checked]:border-2 group-data-[state=checked]:border-primary">
                <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-primary" />
            </span>
            <span className="min-w-0">{children}</span>
        </RadioGroupPrimitive.Item>
    )
}

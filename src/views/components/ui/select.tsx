'use client'

import { Check, ChevronDown } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../../../utils/cn.ts'

// shadcn/ui "Select" on Radix, restyled to design system v2: the trigger looks like an input
// with a Secondary Blue chevron; the list is a bordered white panel without shadow.
// Radix reserves the empty string, so "all" style options use an explicit sentinel value.

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({
    className,
    children,
    ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
    return (
        <SelectPrimitive.Trigger
            className={cn(
                'flex h-[42px] w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-field bg-white px-3 text-left text-[15px] text-ink focus:border-primary focus:shadow-[0_0_0_3px_var(--color-glow)] focus:outline-none data-[placeholder]:text-ink-faint aria-invalid:border-2 aria-invalid:border-ink [&>span]:truncate',
                className,
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDown
                    aria-hidden="true"
                    size={16}
                    strokeWidth={2}
                    className="shrink-0 text-secondary"
                />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    )
}

export function SelectContent({
    className,
    children,
    ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                position="popper"
                sideOffset={4}
                className={cn(
                    'z-50 max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-field bg-white p-1.5',
                    className,
                )}
                {...props}
            >
                <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    )
}

export function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
    return (
        <SelectPrimitive.Item
            className={cn(
                'relative flex min-h-9 cursor-pointer items-center rounded-sm py-2 pr-9 pl-2.5 text-[14.5px] text-ink outline-none select-none data-[highlighted]:bg-tint data-[state=checked]:font-semibold',
                className,
            )}
            {...props}
        >
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator className="absolute right-2.5 inline-flex">
                <Check aria-hidden="true" size={15} strokeWidth={2.4} className="text-primary" />
            </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
    )
}

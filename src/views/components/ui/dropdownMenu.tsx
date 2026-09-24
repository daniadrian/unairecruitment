'use client'

import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../../../utils/cn.ts'

// shadcn/ui "DropdownMenu" on Radix, drawn like the design's "Add field" menu: a bordered white
// panel, rows highlighted with the header tint.

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({
    className,
    sideOffset = 6,
    align = 'end',
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                sideOffset={sideOffset}
                align={align}
                className={cn(
                    'z-50 min-w-[220px] rounded-md border border-field bg-white p-1.5 text-ink',
                    className,
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    )
}

export function DropdownMenuItem({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
    return (
        <DropdownMenuPrimitive.Item
            className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-ink no-underline outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:text-ink-faint data-[highlighted]:bg-tint data-[highlighted]:text-ink',
                className,
            )}
            {...props}
        />
    )
}

export function DropdownMenuLabel({
    className,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
    return <DropdownMenuPrimitive.Label className={cn('px-2.5 py-2', className)} {...props} />
}

export function DropdownMenuSeparator({
    className,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
    return <DropdownMenuPrimitive.Separator className={cn('my-1 h-px bg-hairline', className)} {...props} />
}

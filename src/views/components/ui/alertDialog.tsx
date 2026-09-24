'use client'

import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../../../utils/cn.ts'
import { buttonVariants } from './button.tsx'

// shadcn/ui "AlertDialog" on Radix, as drawn in "Status change confirmation": a white sheet
// with a Primary Blue top rule over a dimmed page, a Literata title, and right-aligned actions.

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

export function AlertDialogContent({
    className,
    ...props
}: ComponentProps<typeof AlertDialogPrimitive.Content>) {
    return (
        <AlertDialogPrimitive.Portal>
            <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/60 data-[state=open]:animate-overlay-in motion-reduce:animate-none" />
            <AlertDialogPrimitive.Content
                className={cn(
                    'fixed top-1/2 left-1/2 z-50 flex w-[440px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3.5 rounded-lg border-t-4 border-primary bg-white p-6 focus:outline-none data-[state=open]:animate-dialog-in motion-reduce:animate-none',
                    className,
                )}
                {...props}
            />
        </AlertDialogPrimitive.Portal>
    )
}

export function AlertDialogTitle({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Title>) {
    return (
        <AlertDialogPrimitive.Title
            className={cn('font-display text-[21px] leading-[1.25] font-medium text-ink', className)}
            {...props}
        />
    )
}

export function AlertDialogDescription({
    className,
    ...props
}: ComponentProps<typeof AlertDialogPrimitive.Description>) {
    return (
        <AlertDialogPrimitive.Description
            className={cn('text-[14.5px] leading-[1.55] text-ink-soft', className)}
            {...props}
        />
    )
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<'div'>) {
    return <div className={cn('mt-1 flex flex-wrap justify-end gap-2.5', className)} {...props} />
}

export function AlertDialogCancel({
    className,
    ...props
}: ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
    return (
        <AlertDialogPrimitive.Cancel
            className={cn(buttonVariants({ variant: 'outline' }), className)}
            {...props}
        />
    )
}

export function AlertDialogAction({
    className,
    ...props
}: ComponentProps<typeof AlertDialogPrimitive.Action>) {
    return (
        <AlertDialogPrimitive.Action
            className={cn(buttonVariants({ variant: 'primary' }), className)}
            {...props}
        />
    )
}

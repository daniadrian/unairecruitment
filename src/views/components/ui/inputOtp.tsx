'use client'

import { OTPInput, OTPInputContext } from 'input-otp'
import { use, type ComponentProps } from 'react'
import { cn } from '../../../utils/cn.ts'

// shadcn/ui "InputOTP" (input-otp), as drawn in "Forgot password": one 52 x 56 mono box per
// digit; the active box gets the Primary Blue focus glow and a blinking caret.

export function InputOtp({ className, containerClassName, ...props }: ComponentProps<typeof OTPInput>) {
    return (
        <OTPInput
            containerClassName={cn('flex items-center gap-2 has-disabled:opacity-60', containerClassName)}
            className={cn('disabled:cursor-not-allowed', className)}
            {...props}
        />
    )
}

export function InputOtpSlot({ index, invalid = false }: { index: number; invalid?: boolean }) {
    const context = use(OTPInputContext)
    const slot = context.slots[index]
    const char = slot?.char ?? null
    const isActive = slot?.isActive ?? false
    const hasFakeCaret = slot?.hasFakeCaret ?? false

    return (
        <div
            className={cn(
                'relative grid h-14 w-[46px] place-items-center rounded-md border border-field bg-white font-mono text-2xl font-medium text-ink sm:w-[52px]',
                invalid && 'border-2 border-ink',
                isActive && 'z-10 border-primary shadow-[0_0_0_3px_var(--color-glow)]',
            )}
        >
            {char}
            {hasFakeCaret ? (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="h-6 w-[1.5px] animate-caret-blink bg-ink motion-reduce:animate-none" />
                </div>
            ) : null}
        </div>
    )
}

import type { ComponentProps } from 'react'
import { cn } from '../../../utils/cn.ts'

// Shared look of text controls (design system v2 "Fields"): input border #7390B8, focus is a
// Primary Blue border with a soft glow, and an invalid control gets a 2px blue-black outline
// (never red). Read-only controls sit on a faint tint so it is clear they are prefilled.
export const fieldControlClass =
    'w-full rounded-md border border-field bg-white px-3 text-[15px] text-ink placeholder:text-ink-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--color-glow)] focus:outline-none disabled:cursor-not-allowed disabled:bg-page disabled:text-ink-faint read-only:bg-mist aria-invalid:border-2 aria-invalid:border-ink aria-invalid:px-[11px]'

export function Input({ className, ...props }: ComponentProps<'input'>) {
    return <input className={cn(fieldControlClass, 'h-[42px]', className)} {...props} />
}

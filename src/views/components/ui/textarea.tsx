import type { ComponentProps } from 'react'
import { cn } from '../../../utils/cn.ts'
import { fieldControlClass } from './input.tsx'

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
    return (
        <textarea
            className={cn(
                fieldControlClass,
                'min-h-32 resize-y py-3 leading-[1.6] aria-invalid:py-[11px]',
                className,
            )}
            {...props}
        />
    )
}

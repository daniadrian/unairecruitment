'use client'

import { useState, type ComponentProps } from 'react'
import { cn } from '../../../utils/cn.ts'
import { fieldControlClass } from '../ui/input.tsx'

// Password field with the "Show" toggle drawn inside the input on "Sign in".
export default function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
    const [visible, setVisible] = useState(false)
    return (
        <div className="relative">
            <input
                type={visible ? 'text' : 'password'}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                className={cn(fieldControlClass, 'h-11 pr-16', className)}
                {...props}
            />
            <button
                type="button"
                onClick={() => setVisible((current) => !current)}
                aria-pressed={visible}
                aria-label={visible ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 cursor-pointer rounded-r-md px-3 text-[13px] font-semibold text-ink hover:text-link"
            >
                {visible ? 'Hide' : 'Show'}
            </button>
        </div>
    )
}

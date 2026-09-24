'use client'

import { Switch as SwitchPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../../../utils/cn.ts'

// shadcn/ui "Switch" on Radix: Primary Blue when on. The off track uses the input border
// colour so the control keeps a 3:1 contrast against white.
export default function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
    return (
        <SwitchPrimitive.Root
            className={cn(
                'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-field transition-colors data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-60',
                className,
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[18px] motion-reduce:transition-none" />
        </SwitchPrimitive.Root>
    )
}

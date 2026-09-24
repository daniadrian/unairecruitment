import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../../../utils/cn.ts'

// shadcn/ui "Button" restyled to design system v2: Primary Blue fill (hover Bright Blue),
// Teal outline for secondary actions, and no red even for destructive actions: a trash
// icon plus a label is enough. Links reuse `buttonVariants` so they look identical
// without wrapping a server-rendered <Link> in a client Slot.
export const buttonVariants = cva(
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold no-underline transition-colors disabled:cursor-not-allowed aria-disabled:pointer-events-none [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                primary:
                    'bg-primary text-white hover:bg-primary-bright disabled:bg-disabled disabled:text-ink-faint aria-disabled:bg-disabled aria-disabled:text-ink-faint',
                secondary:
                    'border-[1.5px] border-teal bg-white text-teal-ink hover:bg-teal-hover disabled:border-hairline disabled:text-ink-faint',
                outline:
                    'border border-field bg-white text-ink hover:bg-mist disabled:border-hairline disabled:text-ink-faint',
                ghost: 'bg-transparent text-ink hover:bg-tint disabled:text-ink-faint',
                link: 'bg-transparent px-0 text-link underline underline-offset-2 hover:text-link-hover',
                onDark: 'bg-transparent text-white hover:bg-admin-surface',
                onDarkOutline:
                    'border-[1.5px] border-admin-accent bg-transparent text-white hover:bg-admin-surface',
            },
            size: {
                xs: 'h-8 px-2.5 text-[13.5px]',
                sm: 'h-[34px] px-3 text-[13.5px]',
                md: 'h-[42px] px-4 text-[14.5px]',
                lg: 'h-12 px-5 text-base',
                xl: 'h-[52px] px-6 text-[17px]',
                icon: 'size-9 px-0',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>

export function Button({
    className,
    variant,
    size,
    type = 'button',
    ...props
}: ComponentProps<'button'> & ButtonVariantProps) {
    return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

import type { ReactNode } from 'react'
import { cn } from '../../../utils/cn.ts'
import HeroBand from '../brand/heroBand.tsx'

// Header of every admin screen: the dark teal layer (#12363A to #287C7C) with the graticule,
// a Literata title, and optional breadcrumb, description, actions, and a bottom area (for
// example the dashboard's number strip).
export default function AdminHeader({
    breadcrumb,
    title,
    description,
    actions,
    className,
    children,
}: {
    breadcrumb?: ReactNode
    title: ReactNode
    description?: ReactNode
    actions?: ReactNode
    className?: string
    children?: ReactNode
}) {
    return (
        <HeroBand tone="admin" className={cn('px-4 pt-6 pb-7 sm:px-6 lg:px-12 lg:pt-8 lg:pb-8', className)}>
            <div className="mx-auto w-full max-w-[1104px]">
                <div className="flex flex-wrap items-end justify-between gap-4 lg:gap-6">
                    <div className="flex min-w-0 flex-col gap-1.5">
                        {breadcrumb ? (
                            <nav aria-label="Breadcrumb" className="text-[13.5px] text-admin-muted">
                                {breadcrumb}
                            </nav>
                        ) : null}
                        <h1 className="font-display text-[28px] leading-[1.1] font-medium tracking-[-0.02em] text-white lg:text-4xl">
                            {title}
                        </h1>
                        {description ? <p className="text-[14.5px] text-admin-muted">{description}</p> : null}
                    </div>
                    {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
                </div>
                {children}
            </div>
        </HeroBand>
    )
}

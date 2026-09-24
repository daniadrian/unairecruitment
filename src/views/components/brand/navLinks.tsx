'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../../utils/cn.ts'
import type { NavItem } from '../../../types/navigation/navItem.ts'

// BrandNav links. The active link carries a 3px underline rule (Primary Blue on white, Bright
// Blue on the dark admin bar). Layouts do not re-render on navigation, so the active state is
// read here from the pathname.

const TONES = {
    light: {
        idle: 'font-medium text-ink-soft hover:text-ink',
        active: 'font-semibold text-ink shadow-[inset_0_-3px_0_var(--color-primary)]',
    },
    dark: {
        idle: 'font-medium text-admin-muted hover:text-white',
        active: 'font-semibold text-white shadow-[inset_0_-3px_0_var(--color-primary-bright)]',
    },
}

export function isActivePath(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`)
}

export default function NavLinks({
    items,
    tone,
    className,
}: {
    items: NavItem[]
    tone: 'light' | 'dark'
    className?: string
}) {
    const pathname = usePathname()
    return (
        <nav aria-label="Main" className={cn('h-full gap-1', className)}>
            {items.map((item) => {
                const active = isActivePath(pathname, item.href)
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'flex h-full items-center px-3 text-[14.5px] no-underline',
                            active ? TONES[tone].active : TONES[tone].idle,
                        )}
                    >
                        {item.label}
                    </Link>
                )
            })}
        </nav>
    )
}

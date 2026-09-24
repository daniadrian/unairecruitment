import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '../../../utils/cn.ts'
import { getViewer } from '../guards/getViewer.ts'
import { homePathFor } from '../guards/homePath.ts'
import { buttonVariants } from '../ui/button.tsx'
import MobileMenu from './mobileMenu.tsx'
import NavLinks from './navLinks.tsx'
import UserMenu from './userMenu.tsx'
import type { SessionUser } from '../../../types/auth/sessionUser.ts'
import type { SignOutAction } from '../../../types/auth/signOutAction.ts'
import type { NavItem } from '../../../types/navigation/navItem.ts'

// ui-mockups/BrandNav.dc.html. Public pages: white bar with a Primary Blue top rule and the
// full UNA Indonesia logo. Admin: the dark teal bar (#0B2226) with the white logo and an
// "Admin panel" badge, a clear "you're in admin" signal. Below 1024 px the bar keeps the
// emblem and wordmark and the rest moves into the mobile menu. The header keeps a fixed
// view-transition name so it stays anchored while pages slide.

type Variant = 'public' | 'admin'

const OPENINGS: NavItem = { href: '/recruitments', label: 'Openings' }
const MY_APPLICATIONS: NavItem = { href: '/my-applications', label: 'My applications' }
const ADMIN_PANEL: NavItem = { href: '/admin/dashboard', label: 'Admin panel' }
const PUBLIC_SITE: NavItem = { href: '/recruitments', label: 'View public site' }
const ADMIN_LINKS: NavItem[] = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/recruitments', label: 'Recruitments' },
    { href: '/admin/applicants', label: 'Applicants' },
]

function linksFor(
    variant: Variant,
    viewer: SessionUser | null,
): { items: NavItem[]; shortcut: NavItem | null } {
    if (variant === 'admin') return { items: ADMIN_LINKS, shortcut: PUBLIC_SITE }
    if (viewer?.role === 'APPLICANT') return { items: [OPENINGS, MY_APPLICATIONS], shortcut: null }
    if (viewer?.role === 'ADMIN') return { items: [OPENINGS], shortcut: ADMIN_PANEL }
    return { items: [OPENINGS], shortcut: null }
}

function BrandBar({
    variant,
    homeHref,
    children,
}: {
    variant: Variant
    homeHref: string
    children?: ReactNode
}) {
    const dark = variant === 'admin'
    return (
        <header
            style={{ viewTransitionName: 'site-header' }}
            className={cn(
                'relative z-40 h-[60px] border-t-[3px] border-b lg:h-[68px]',
                dark
                    ? 'border-t-admin-teal border-b-admin-line bg-admin-nav'
                    : 'border-t-primary border-b-hairline bg-white',
            )}
        >
            <div className="flex h-full items-center gap-8 pr-2 pl-4 lg:px-10">
                <Link href={homeHref} className="flex shrink-0 items-center gap-3.5 no-underline">
                    <Image
                        src={dark ? '/brand/una-logo-white.png' : '/brand/una-logo.png'}
                        alt="United Nations Association Indonesia"
                        width={252}
                        height={63}
                        loading="eager"
                        className="hidden h-10 w-auto lg:block"
                    />
                    <Image
                        src={dark ? '/brand/una-emblem-white.png' : '/brand/una-emblem.png'}
                        alt="United Nations Association Indonesia"
                        width={68}
                        height={63}
                        loading="eager"
                        className="h-[34px] w-auto lg:hidden"
                    />
                    <span
                        aria-hidden="true"
                        className={cn('h-6 w-px lg:h-[30px]', dark ? 'bg-admin-rule' : 'bg-rule')}
                    />
                    <span
                        className={cn(
                            'font-display text-base leading-none font-semibold tracking-[-0.01em] lg:text-lg',
                            dark ? 'text-white' : 'text-ink',
                        )}
                    >
                        Recruitment
                    </span>
                    {dark ? (
                        <span className="hidden rounded-sm border border-admin-outline px-2 py-1 text-[11.5px] leading-none font-semibold whitespace-nowrap text-admin-muted sm:inline">
                            Admin panel
                        </span>
                    ) : null}
                </Link>
                {children}
            </div>
        </header>
    )
}

// Shown while the signed-in user is being read, with the same height so nothing shifts.
export function BrandNavFallback({ variant }: { variant: Variant }) {
    return (
        <BrandBar variant={variant} homeHref={variant === 'admin' ? '/admin/dashboard' : '/recruitments'} />
    )
}

export default async function BrandNav({ variant, signOut }: { variant: Variant; signOut: SignOutAction }) {
    const viewer = await getViewer()
    const { items, shortcut } = linksFor(variant, viewer)
    const tone = variant === 'admin' ? 'dark' : 'light'

    return (
        <BrandBar
            variant={variant}
            homeHref={homePathFor(variant === 'admin' ? 'ADMIN' : (viewer?.role ?? null))}
        >
            <NavLinks items={items} tone={tone} className="hidden lg:flex" />
            <div className="ml-auto hidden items-center gap-2.5 lg:flex">
                {viewer ? (
                    <UserMenu viewer={viewer} tone={tone} shortcut={shortcut} signOut={signOut} />
                ) : (
                    <>
                        <Link
                            href="/login"
                            className={cn(
                                buttonVariants({ variant: 'ghost' }),
                                'h-[38px] px-3.5 text-[14.5px] hover:bg-page',
                            )}
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/register"
                            className={cn(buttonVariants(), 'h-[38px] px-4 text-[14.5px]')}
                        >
                            Create account
                        </Link>
                    </>
                )}
            </div>
            <MobileMenu
                items={items}
                viewer={viewer}
                shortcut={shortcut}
                tone={tone}
                signOut={signOut}
                className="ml-auto lg:hidden"
            />
        </BrandBar>
    )
}

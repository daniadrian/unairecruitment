'use client'

import { LogOut, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog } from 'radix-ui'
import { useState } from 'react'
import { cn } from '../../../utils/cn.ts'
import { buttonVariants } from '../ui/button.tsx'
import { isActivePath } from './navLinks.tsx'
import { useSignOut } from './useSignOut.ts'
import type { SessionUser } from '../../../types/auth/sessionUser.ts'
import type { SignOutAction } from '../../../types/auth/signOutAction.ts'
import type { NavItem } from '../../../types/navigation/navItem.ts'

// Mobile navigation (390 px reflow): the bar keeps the emblem and wordmark, everything else
// moves into this sheet. The mockup only draws the menu button, so the sheet repeats the
// desktop links and account actions with 48 px touch targets.
export default function MobileMenu({
    items,
    viewer,
    shortcut,
    tone,
    signOut,
    className,
}: {
    items: NavItem[]
    viewer: SessionUser | null
    shortcut: NavItem | null
    tone: 'light' | 'dark'
    signOut: SignOutAction
    className?: string
}) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()
    const { isSigningOut, handleSignOut } = useSignOut(signOut)
    const dark = tone === 'dark'

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
                aria-label="Open menu"
                className={cn(
                    'grid size-11 cursor-pointer place-items-center rounded-md',
                    dark ? 'text-white hover:bg-admin-surface' : 'text-ink hover:bg-page',
                    className,
                )}
            >
                <Menu aria-hidden="true" size={22} strokeWidth={2} />
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/60 data-[state=open]:animate-overlay-in motion-reduce:animate-none" />
                <Dialog.Content
                    className={cn(
                        'fixed inset-y-0 right-0 z-50 flex w-[min(320px,86vw)] flex-col gap-6 p-4 focus:outline-none data-[state=open]:animate-sheet-in motion-reduce:animate-none',
                        dark ? 'bg-admin-nav text-white' : 'bg-white text-ink',
                    )}
                >
                    <div className="flex items-center justify-between">
                        <Dialog.Title className="font-display text-lg font-semibold">Menu</Dialog.Title>
                        <Dialog.Close
                            aria-label="Close menu"
                            className={cn(
                                'grid size-11 cursor-pointer place-items-center rounded-md',
                                dark ? 'hover:bg-admin-surface' : 'hover:bg-page',
                            )}
                        >
                            <X aria-hidden="true" size={20} strokeWidth={2} />
                        </Dialog.Close>
                    </div>
                    <Dialog.Description className="sr-only">Navigate UNAI Recruitment</Dialog.Description>

                    <nav aria-label="Main">
                        <ul
                            className={cn(
                                'flex flex-col border-t',
                                dark ? 'border-admin-line' : 'border-hairline',
                            )}
                        >
                            {items.map((item) => {
                                const active = isActivePath(pathname, item.href)
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            aria-current={active ? 'page' : undefined}
                                            onClick={() => setOpen(false)}
                                            className={cn(
                                                'flex h-12 items-center border-b px-3 text-[15px] no-underline',
                                                dark
                                                    ? 'border-admin-line text-admin-muted'
                                                    : 'border-hairline text-ink-soft',
                                                active &&
                                                    (dark
                                                        ? 'font-semibold text-white shadow-[inset_3px_0_0_var(--color-primary-bright)]'
                                                        : 'bg-tint font-semibold text-ink shadow-[inset_3px_0_0_var(--color-primary)]'),
                                            )}
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>

                    <div className="mt-auto flex flex-col gap-3">
                        {viewer ? (
                            <>
                                <div>
                                    <p className="truncate text-sm font-semibold">{viewer.name}</p>
                                    <p
                                        className={cn(
                                            'truncate text-[13px]',
                                            dark ? 'text-admin-muted' : 'text-ink-soft',
                                        )}
                                    >
                                        {viewer.email}
                                    </p>
                                </div>
                                {shortcut ? (
                                    <Link
                                        href={shortcut.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            buttonVariants({
                                                variant: dark ? 'onDarkOutline' : 'outline',
                                                size: 'lg',
                                            }),
                                            'w-full',
                                        )}
                                    >
                                        {shortcut.label}
                                    </Link>
                                ) : null}
                                <button
                                    type="button"
                                    disabled={isSigningOut}
                                    onClick={handleSignOut}
                                    className={cn(
                                        buttonVariants({ variant: dark ? 'onDark' : 'ghost', size: 'lg' }),
                                        'w-full',
                                    )}
                                >
                                    <LogOut aria-hidden="true" size={18} strokeWidth={2} />
                                    {isSigningOut ? 'Signing out…' : 'Sign out'}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/register"
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        buttonVariants({ variant: 'primary', size: 'lg' }),
                                        'w-full',
                                    )}
                                >
                                    Create account
                                </Link>
                                <Link
                                    href="/login"
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        buttonVariants({ variant: 'outline', size: 'lg' }),
                                        'w-full',
                                    )}
                                >
                                    Sign in
                                </Link>
                            </>
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

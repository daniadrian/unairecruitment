'use client'

import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { cn } from '../../../utils/cn.ts'
import { getInitials } from '../../../utils/textFormat.ts'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdownMenu.tsx'
import { useSignOut } from './useSignOut.ts'
import type { SessionUser } from '../../../types/auth/sessionUser.ts'
import type { SignOutAction } from '../../../types/auth/signOutAction.ts'
import type { NavItem } from '../../../types/navigation/navItem.ts'

// Account menu behind the name and avatar of BrandNav. The mockups show the signed-in state
// but no way out; UC-04 requires "Sign out" in the navigation, so it lives here together with
// the shortcut to the other area of the application.
export default function UserMenu({
    viewer,
    tone,
    shortcut,
    signOut,
}: {
    viewer: SessionUser
    tone: 'light' | 'dark'
    shortcut: NavItem | null
    signOut: SignOutAction
}) {
    const { isSigningOut, handleSignOut } = useSignOut(signOut)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`Account menu for ${viewer.name}`}
                className={cn(
                    'flex h-11 cursor-pointer items-center gap-2.5 rounded-md px-2 text-sm',
                    tone === 'light'
                        ? 'text-ink-soft hover:bg-page'
                        : 'text-admin-muted hover:bg-admin-surface',
                )}
            >
                <span className="max-w-48 truncate">{viewer.name}</span>
                <span
                    aria-hidden="true"
                    className={cn(
                        'grid size-[34px] place-items-center rounded-full text-xs font-bold',
                        tone === 'light'
                            ? 'border border-sky bg-tint text-interview-ink'
                            : 'bg-admin-teal text-white',
                    )}
                >
                    {getInitials(viewer.name)}
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>
                    <span className="block truncate text-sm font-semibold text-ink">{viewer.name}</span>
                    <span className="block truncate text-[13px] font-normal text-ink-soft">
                        {viewer.email}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {shortcut ? (
                    <DropdownMenuItem asChild>
                        <Link href={shortcut.href}>{shortcut.label}</Link>
                    </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                    disabled={isSigningOut}
                    onSelect={(event) => {
                        event.preventDefault()
                        handleSignOut()
                    }}
                >
                    <LogOut aria-hidden="true" size={16} strokeWidth={2} />
                    {isSigningOut ? 'Signing out…' : 'Sign out'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

import { ViewTransition, type ReactNode } from 'react'

// Page wrapper for list <-> detail navigation (Next.js 16 guide "Designing view transitions"):
// links tagged `nav-forward` slide the content left, `nav-back` slides it right (globals.css).
// Navigations without a type (browser back/forward, router.refresh(), Suspense reveals) do not
// animate. Used in each participating page.tsx, since layouts never enter or exit.
const DIRECTIONS = {
    'nav-forward': 'nav-forward',
    'nav-back': 'nav-back',
    default: 'none',
}

export default function DirectionalPage({ children }: { children: ReactNode }) {
    return (
        <ViewTransition enter={DIRECTIONS} exit={DIRECTIONS} default="none">
            {children}
        </ViewTransition>
    )
}

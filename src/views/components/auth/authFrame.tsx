import type { ReactNode } from 'react'
import Graticule from '../brand/graticule.tsx'

// Shared frame of "Sign in" and "Create account": the context column on a gradient blue panel
// (the graticule rises from the bottom like the UN emblem) and the form on a white sheet over
// the page tint.
export default function AuthFrame({ intro, children }: { intro: ReactNode; children: ReactNode }) {
    return (
        <div className="grid flex-1 lg:min-h-[620px] lg:grid-cols-[minmax(0,1fr)_560px]">
            <div className="relative overflow-hidden bg-[linear-gradient(160deg,#2A5F96_0%,#3B78B8_50%,#5B92E5_100%)] px-4 py-10 sm:px-6 lg:px-16 lg:py-[72px]">
                <Graticule tone="blue" at="bottom" />
                <div className="relative flex max-w-[460px] flex-col gap-[18px]">{intro}</div>
            </div>
            <div className="flex items-start px-3 py-8 sm:px-6 lg:px-14 lg:py-16">{children}</div>
        </div>
    )
}

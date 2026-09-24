import type { ReactNode } from 'react'
import { cn } from '../../../utils/cn.ts'
import Graticule from './graticule.tsx'

// Principle P1, three layers of depth: a gradient blue hero for public pages, a light tint for
// the applicant workspace, and dark teal for the admin area. The graticule sits behind the
// content of each band.

type Tone = 'public' | 'applicant' | 'admin'

const BACKGROUNDS: Record<Tone, string> = {
    public: 'bg-[linear-gradient(100deg,#2A5F96_0%,#3B78B8_45%,#4586C6_70%,#5B92E5_100%)] text-white',
    applicant: 'border-b border-hairline bg-[linear-gradient(180deg,#DCE8F7_0%,#EEF4FB_100%)] text-ink',
    admin: 'bg-[linear-gradient(100deg,#0F2B30_0%,#12363A_50%,#287C7C_100%)] text-white',
}

const GRATICULE_TONE: Record<Tone, 'blue' | 'light' | 'dark'> = {
    public: 'blue',
    applicant: 'light',
    admin: 'dark',
}

export default function HeroBand({
    tone,
    className,
    children,
}: {
    tone: Tone
    className?: string
    children: ReactNode
}) {
    return (
        <div className={cn('relative overflow-hidden', BACKGROUNDS[tone], className)}>
            <Graticule tone={GRATICULE_TONE[tone]} />
            <div className="relative">{children}</div>
        </div>
    )
}

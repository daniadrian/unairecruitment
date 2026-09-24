import type { CSSProperties } from 'react'
import { cn } from '../../../utils/cn.ts'

// ui-mockups/Graticule.dc.html: the latitude rings and meridians of the UN emblem, drawn with
// radial and conic gradients and faded out with a mask. It is the only motif of the design
// and only appears behind heroes and headers, never behind body text.

type Tone = 'blue' | 'light' | 'dark'
type Anchor = 'right' | 'bottom'

function pattern(background: string, mask: string): CSSProperties {
    return { backgroundImage: background, maskImage: mask, WebkitMaskImage: mask }
}

const PATTERNS: Record<'blue-right' | 'blue-bottom' | 'light' | 'dark', CSSProperties> = {
    'blue-right': pattern(
        'repeating-radial-gradient(circle at 84% 46%, transparent 0 55px, rgba(255,255,255,.22) 55px 56px), repeating-conic-gradient(from 0deg at 84% 46%, rgba(255,255,255,.17) 0deg .28deg, transparent .28deg 30deg)',
        'radial-gradient(circle at 84% 46%, #000 0%, #000 20%, transparent 52%)',
    ),
    'blue-bottom': pattern(
        'repeating-radial-gradient(circle at 50% 108%, transparent 0 55px, rgba(255,255,255,.22) 55px 56px), repeating-conic-gradient(from 0deg at 50% 108%, rgba(255,255,255,.16) 0deg .28deg, transparent .28deg 30deg)',
        'radial-gradient(circle at 50% 108%, #000 0%, #000 30%, transparent 72%)',
    ),
    light: pattern(
        'repeating-radial-gradient(circle at 88% 50%, transparent 0 47px, rgba(73,129,206,.26) 47px 48px), repeating-conic-gradient(from 0deg at 88% 50%, rgba(73,129,206,.2) 0deg .3deg, transparent .3deg 30deg)',
        'radial-gradient(circle at 88% 50%, #000 0%, #000 14%, transparent 42%)',
    ),
    dark: pattern(
        'repeating-radial-gradient(circle at 88% 50%, transparent 0 51px, rgba(158,211,211,.2) 51px 52px), repeating-conic-gradient(from 0deg at 88% 50%, rgba(158,211,211,.15) 0deg .3deg, transparent .3deg 30deg)',
        'radial-gradient(circle at 88% 50%, #000 0%, #000 16%, transparent 46%)',
    ),
}

export default function Graticule({
    tone,
    at = 'right',
    className,
}: {
    tone: Tone
    at?: Anchor
    className?: string
}) {
    const key = tone === 'blue' ? (`blue-${at}` as const) : tone
    return (
        <div
            aria-hidden="true"
            className={cn('pointer-events-none absolute inset-0', className)}
            style={PATTERNS[key]}
        />
    )
}

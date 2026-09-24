import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { JetBrains_Mono, Literata, Public_Sans } from 'next/font/google'
import './globals.css'

// Design system v2: Literata for titles, Public Sans for the interface, JetBrains Mono for
// numbers, dates, and file sizes.
const literata = Literata({
    subsets: ['latin'],
    axes: ['opsz'],
    variable: '--font-literata',
    display: 'swap',
})

const publicSans = Public_Sans({
    subsets: ['latin'],
    variable: '--font-public-sans',
    display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains-mono',
    display: 'swap',
})

export const metadata: Metadata = {
    title: {
        default: 'UNAI Recruitment',
        template: '%s | UNAI Recruitment',
    },
    description:
        'Volunteer and program staff recruitment of the United Nations Association Indonesia: browse open roles, apply, and follow your application.',
}

export const viewport: Viewport = {
    themeColor: '#4586C6',
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className={`${literata.variable} ${publicSans.variable} ${jetbrainsMono.variable}`}>
            <body>{children}</body>
        </html>
    )
}

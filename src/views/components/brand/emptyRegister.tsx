import type { ReactNode } from 'react'
import ContentSheet from './contentSheet.tsx'

// "My applications — empty": dashed placeholder rows of an unwritten register next to a short
// message that says what to do next. Reused for every empty list in the application.

const PLACEHOLDER_WIDTHS = ['60%', '44%', '52%']

export default function EmptyRegister({
    title,
    children,
    action,
}: {
    title: string
    children: ReactNode
    action?: ReactNode
}) {
    return (
        <ContentSheet className="grid gap-8 p-6 md:grid-cols-[minmax(0,1fr)_420px] md:gap-14 md:p-7">
            <div aria-hidden="true" className="hidden flex-col md:flex">
                {PLACEHOLDER_WIDTHS.map((width) => (
                    <div
                        key={width}
                        className="grid grid-cols-[150px_1fr] gap-6 border-b border-dashed border-sky py-[18px] font-mono text-sm text-field"
                    >
                        <span>{'·'.repeat(8)}</span>
                        <span className="mt-1 h-2.5 rounded-xs bg-tint" style={{ width }} />
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-3.5">
                <h2 className="font-display text-[26px] leading-[1.2] font-medium text-ink">{title}</h2>
                <div className="text-base leading-[1.6] text-ink-soft">{children}</div>
                {action ? <div className="mt-1">{action}</div> : null}
            </div>
        </ContentSheet>
    )
}

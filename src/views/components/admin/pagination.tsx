import Link from 'next/link'
import { cn } from '../../../utils/cn.ts'

// Numbered pagination of the applicant register ("Showing 1-20 of 128"). Pages are links that
// keep the active filters, so the browser's back button and shared URLs work.

function pageList(current: number, total: number): Array<number | 'gap'> {
    const pages = new Set([1, total, current - 1, current, current + 1])
    const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)
    const result: Array<number | 'gap'> = []
    sorted.forEach((page, index) => {
        if (index > 0 && page - sorted[index - 1] > 1) result.push('gap')
        result.push(page)
    })
    return result
}

const BOX =
    'grid h-[34px] min-w-[34px] place-items-center rounded-md px-2 font-mono text-[13px] font-semibold no-underline'

export default function Pagination({
    page,
    pageCount,
    total,
    pageSize,
    hrefFor,
}: {
    page: number
    pageCount: number
    total: number
    pageSize: number
    hrefFor: (page: number) => string
}) {
    const first = total === 0 ? 0 : (page - 1) * pageSize + 1
    const last = Math.min(total, page * pageSize)

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-ink-soft">
            <span>
                Showing{' '}
                <b className="text-ink">
                    {first}
                    {'–'}
                    {last}
                </b>{' '}
                of {total}
            </span>
            {pageCount > 1 ? (
                <nav aria-label="Pages" className="flex flex-wrap items-center gap-1">
                    {page > 1 ? (
                        <Link
                            href={hrefFor(page - 1)}
                            className={cn(BOX, 'border border-field bg-white font-sans text-ink')}
                        >
                            Previous
                        </Link>
                    ) : (
                        <span
                            aria-disabled="true"
                            className={cn(BOX, 'border border-hairline bg-white font-sans text-ink-faint')}
                        >
                            Previous
                        </span>
                    )}
                    {pageList(page, pageCount).map((item, index) =>
                        item === 'gap' ? (
                            <span key={`gap-${index}`} aria-hidden="true" className="px-1.5">
                                {'…'}
                            </span>
                        ) : (
                            <Link
                                key={item}
                                href={hrefFor(item)}
                                aria-label={`Page ${item}`}
                                aria-current={item === page ? 'page' : undefined}
                                className={cn(
                                    BOX,
                                    item === page
                                        ? 'bg-primary text-white hover:text-white'
                                        : 'border border-hairline bg-white text-ink',
                                )}
                            >
                                {item}
                            </Link>
                        ),
                    )}
                    {page < pageCount ? (
                        <Link
                            href={hrefFor(page + 1)}
                            className={cn(BOX, 'border border-field bg-white font-sans text-ink')}
                        >
                            Next
                        </Link>
                    ) : (
                        <span
                            aria-disabled="true"
                            className={cn(BOX, 'border border-hairline bg-white font-sans text-ink-faint')}
                        >
                            Next
                        </span>
                    )}
                </nav>
            ) : null}
        </div>
    )
}

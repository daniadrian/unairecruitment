'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ToggleGroup } from 'radix-ui'
import { startTransition, useState, ViewTransition } from 'react'
import { cn } from '../../../utils/cn.ts'
import ContentSheet from '../brand/contentSheet.tsx'
import type { OpeningItem } from '../../../types/recruitments/openingItem.ts'

// Screen 01 "Openings": the roles as a numbered register (principle P4, rows not cards) on a
// white sheet that rises over the hero. The division filter is a ToggleGroup in the margin
// column on desktop and a scrollable chip row on mobile. Filtering is view state only.

const ALL = 'all'

function countByDivision(items: OpeningItem[]): Array<{ division: string; count: number }> {
    const counts = new Map<string, number>()
    for (const item of items) counts.set(item.division, (counts.get(item.division) ?? 0) + 1)
    return [...counts.entries()].map(([division, count]) => ({ division, count }))
}

function DivisionFilter({
    value,
    onChange,
    total,
    divisions,
    layout,
    className,
}: {
    value: string
    onChange: (value: string) => void
    total: number
    divisions: Array<{ division: string; count: number }>
    layout: 'list' | 'chips'
    className?: string
}) {
    const options = [{ value: ALL, label: layout === 'list' ? 'All divisions' : 'All', count: total }].concat(
        divisions.map(({ division, count }) => ({ value: division, label: division, count })),
    )

    return (
        <ToggleGroup.Root
            type="single"
            value={value}
            onValueChange={(next) => onChange(next === '' ? ALL : next)}
            aria-label="Filter by division"
            orientation={layout === 'list' ? 'vertical' : 'horizontal'}
            className={cn(
                layout === 'list'
                    ? 'flex flex-col border-t border-rule'
                    : 'flex gap-2 overflow-x-auto border-b border-hairline p-3 [scrollbar-width:none]',
                className,
            )}
        >
            {options.map((option) => (
                <ToggleGroup.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                        'flex shrink-0 cursor-pointer items-center text-left text-sm',
                        layout === 'list'
                            ? 'h-10 justify-between gap-3 border-b border-hairline px-2.5 font-medium text-ink hover:bg-tint data-[state=on]:mt-1 data-[state=on]:rounded-md data-[state=on]:border-b-0 data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-white'
                            : 'h-10 gap-2 rounded-full border border-field bg-white px-3.5 font-medium text-ink data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-white',
                    )}
                >
                    <span className={cn(layout === 'list' && 'truncate')}>{option.label}</span>
                    <span
                        className={cn(
                            'font-mono text-[12.5px]',
                            value === option.value ? 'text-white' : 'text-ink-faint',
                        )}
                    >
                        {option.count}
                    </span>
                </ToggleGroup.Item>
            ))}
        </ToggleGroup.Root>
    )
}

export default function OpeningsRegister({ items }: { items: OpeningItem[] }) {
    const [division, setDivision] = useState(ALL)
    const divisions = countByDivision(items)
    const visible = division === ALL ? items : items.filter((item) => item.division === division)

    function selectDivision(next: string) {
        startTransition(() => setDivision(next))
    }

    return (
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden flex-col gap-3.5 pt-20 lg:flex">
                <span id="division-filter-label" className="text-[12.5px] font-semibold text-ink-soft">
                    Filter by division
                </span>
                <DivisionFilter
                    value={division}
                    onChange={selectDivision}
                    total={items.length}
                    divisions={divisions}
                    layout="list"
                />
            </aside>

            <ContentSheet className="min-w-0">
                <DivisionFilter
                    value={division}
                    onChange={selectDivision}
                    total={items.length}
                    divisions={divisions}
                    layout="chips"
                    className="lg:hidden"
                />
                <div className="px-3.5 pb-2 sm:px-7">
                    <div
                        aria-hidden="true"
                        className="hidden grid-cols-[44px_minmax(0,1fr)_160px_24px] gap-5 border-b border-hairline pt-3.5 pb-2.5 text-[12.5px] font-semibold text-ink-soft md:grid"
                    >
                        <span>No.</span>
                        <span>Role</span>
                        <span>Posted</span>
                        <span />
                    </div>
                    <ViewTransition key={division} enter="auto" exit="auto" default="none">
                        <ul aria-label={division === ALL ? 'Open roles' : `Open roles in ${division}`}>
                            {visible.map((item, index) => (
                                <li key={item.id} className="border-b border-hairline last:border-b-0">
                                    <Link
                                        href={`/recruitments/${item.id}`}
                                        transitionTypes={['nav-forward']}
                                        className="grid grid-cols-[28px_minmax(0,1fr)] gap-2 py-4 text-ink no-underline hover:bg-row-hover md:grid-cols-[44px_minmax(0,1fr)_160px_24px] md:gap-5 md:py-[22px]"
                                    >
                                        <span className="pt-1 font-mono text-[13px] font-medium text-link md:text-sm">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <span className="flex min-w-0 flex-col gap-1.5">
                                            <span className="font-display text-[17px] leading-[1.25] font-medium md:text-[21px]">
                                                {item.title}
                                            </span>
                                            <span className="text-[12.5px] font-semibold text-link md:text-[13.5px]">
                                                {item.division}
                                            </span>
                                            <span className="line-clamp-2 text-[14.5px] leading-[1.5] text-pretty text-ink-soft max-md:hidden">
                                                {item.description}
                                            </span>
                                            <span className="text-[13px] text-ink-soft md:hidden">
                                                Posted {item.postedLabel}
                                            </span>
                                        </span>
                                        <span className="hidden pt-1 text-sm font-semibold md:block">
                                            {item.postedLabel}
                                        </span>
                                        <ArrowRight
                                            aria-hidden="true"
                                            size={20}
                                            strokeWidth={2.2}
                                            className="mt-1.5 hidden text-primary md:block"
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </ViewTransition>
                </div>
            </ContentSheet>
        </div>
    )
}

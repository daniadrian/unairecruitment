'use client'

import { Download, LoaderCircle, Search } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { cn } from '../../../utils/cn.ts'
import { APPLICATION_STATUS_LABELS } from '../../../utils/fieldLabels.ts'
import { buttonVariants } from '../ui/button.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.tsx'
import type { ApplicationStatus } from '../../../types/applicationStatus.ts'

// Screen 11 toolbar (UC-12, UC-17): search by name or email and filter by recruitment and status.
// The filters live in the URL, so the list is rendered by the server and can be shared; the CSV
// export uses the same filters so it matches what the admin sees.

const ALL = 'all'
const SEARCH_DELAY_MS = 350

export interface ApplicantFilterValues {
    keyword: string
    recruitmentId: string
    status: ApplicationStatus | ''
}

function queryOf(values: ApplicantFilterValues): string {
    const params = new URLSearchParams()
    if (values.keyword.trim()) params.set('keyword', values.keyword.trim())
    if (values.recruitmentId) params.set('recruitmentId', values.recruitmentId)
    if (values.status) params.set('status', values.status)
    return params.toString()
}

export default function ApplicantFilters({
    values,
    recruitments,
    statuses,
    resultCount,
}: {
    values: ApplicantFilterValues
    recruitments: Array<{ id: string; title: string }>
    statuses: ApplicationStatus[]
    resultCount: number
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()
    const [keyword, setKeyword] = useState(values.keyword)
    const timer = useRef<number | null>(null)

    useEffect(
        () => () => {
            if (timer.current) window.clearTimeout(timer.current)
        },
        [],
    )

    function apply(next: Partial<ApplicantFilterValues>) {
        const query = queryOf({ ...values, keyword, ...next })
        startTransition(() => {
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
        })
    }

    function handleKeyword(value: string) {
        setKeyword(value)
        if (timer.current) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => apply({ keyword: value }), SEARCH_DELAY_MS)
    }

    const exportQuery = queryOf(values)

    return (
        <search className="flex flex-wrap items-center gap-2.5 rounded-md border border-hairline border-t-[3px] border-t-primary bg-white p-3.5">
            <label htmlFor="applicant-search" className="sr-only">
                Search by name or email
            </label>
            <div className="relative min-w-[220px] flex-1">
                <Search
                    aria-hidden="true"
                    size={17}
                    strokeWidth={2}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-secondary"
                />
                <input
                    id="applicant-search"
                    type="search"
                    value={keyword}
                    onChange={(event) => handleKeyword(event.target.value)}
                    placeholder="Search name or email…"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-[42px] w-full rounded-md border border-field bg-white pr-3 pl-10 text-[15px] text-ink placeholder:text-ink-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--color-glow)] focus:outline-none"
                />
            </div>

            <Select
                value={values.recruitmentId || ALL}
                onValueChange={(value) => apply({ recruitmentId: value === ALL ? '' : value })}
            >
                <SelectTrigger
                    aria-label="Filter by recruitment"
                    className="w-full text-[14.5px] sm:w-[230px]"
                >
                    <span className="text-ink-soft">Recruitment:</span>
                    <span className="min-w-0 flex-1 truncate">
                        <SelectValue />
                    </span>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>All</SelectItem>
                    {recruitments.map((recruitment) => (
                        <SelectItem key={recruitment.id} value={recruitment.id}>
                            {recruitment.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={values.status || ALL}
                onValueChange={(value) =>
                    apply({ status: value === ALL ? '' : (value as ApplicationStatus) })
                }
            >
                <SelectTrigger aria-label="Filter by status" className="w-full text-[14.5px] sm:w-[170px]">
                    <span className="text-ink-soft">Status:</span>
                    <span className="min-w-0 flex-1 truncate">
                        <SelectValue />
                    </span>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>All</SelectItem>
                    {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                            {APPLICATION_STATUS_LABELS[status]}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <a
                href={exportQuery ? `/admin/applicants/export?${exportQuery}` : '/admin/applicants/export'}
                download
                className={cn(buttonVariants({ variant: 'secondary' }), 'w-full sm:w-auto')}
            >
                <Download aria-hidden="true" size={17} strokeWidth={2} />
                Export CSV
                <span className="font-mono text-[12.5px] font-medium text-ink-soft">
                    {resultCount} {resultCount === 1 ? 'row' : 'rows'}
                </span>
            </a>

            <span aria-live="polite" className="sr-only">
                {isPending ? 'Updating the list' : ''}
            </span>
            {isPending ? (
                <LoaderCircle
                    aria-hidden="true"
                    size={18}
                    strokeWidth={2}
                    className="animate-spin text-primary motion-reduce:animate-none"
                />
            ) : null}
        </search>
    )
}

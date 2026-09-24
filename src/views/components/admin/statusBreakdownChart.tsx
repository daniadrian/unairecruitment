'use client'

import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'
import { APPLICATION_STATUS_LABELS } from '../../../utils/fieldLabels.ts'
import type { ApplicationStatus } from '../../../types/applicationStatus.ts'

// "Status breakdown" (screen 13, UC-18): one Recharts stacked bar (layout="vertical") in brand
// colours instead of library defaults. Pending is the light tint, Interview Primary Blue,
// Accepted Teal, and Rejected hatched blue-black; every segment carries its written count, so
// the chart does not rely on colour.

const SEGMENTS: Array<{ status: ApplicationStatus; fill: string; text: string }> = [
    { status: 'PENDING', fill: '#A9C7EA', text: '#0E1B2A' },
    { status: 'INTERVIEW', fill: '#4586C6', text: '#FFFFFF' },
    { status: 'ACCEPTED', fill: '#008080', text: '#FFFFFF' },
    { status: 'REJECTED', fill: 'url(#rejected-hatch)', text: '#FFFFFF' },
]

export default function StatusBreakdownChart({ counts }: { counts: Record<ApplicationStatus, number> }) {
    const total = SEGMENTS.reduce((sum, segment) => sum + counts[segment.status], 0)
    const label = SEGMENTS.map(
        (segment) => `${APPLICATION_STATUS_LABELS[segment.status]} ${counts[segment.status]}`,
    ).join(', ')

    if (total === 0) {
        return <p className="rounded-xs bg-page px-3 py-2.5 text-sm text-ink-soft">No applications yet.</p>
    }

    return (
        <div role="img" aria-label={label}>
            <BarChart
                layout="vertical"
                data={[{ name: 'Applications', ...counts }]}
                responsive
                style={{ width: '100%', height: 40 }}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                barCategoryGap={0}
                accessibilityLayer={false}
            >
                <defs>
                    <pattern
                        id="rejected-hatch"
                        width="10"
                        height="10"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                    >
                        <rect width="10" height="10" fill="#3B4F66" />
                        <rect width="6" height="10" fill="#0E1B2A" />
                    </pattern>
                </defs>
                <XAxis type="number" hide domain={[0, total]} />
                <YAxis type="category" dataKey="name" hide />
                {SEGMENTS.map((segment) => (
                    <Bar
                        key={segment.status}
                        dataKey={segment.status}
                        stackId="status"
                        fill={segment.fill}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        isAnimationActive={false}
                    >
                        <LabelList
                            dataKey={segment.status}
                            position="insideLeft"
                            offset={10}
                            fill={segment.text}
                            style={{
                                fontFamily: 'var(--font-jetbrains-mono)',
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                            formatter={(value) => (Number(value) > 0 ? String(value) : '')}
                        />
                    </Bar>
                ))}
            </BarChart>
        </div>
    )
}

import { cn } from '../../../utils/cn.ts'
import ContentSheet from '../brand/contentSheet.tsx'
import HeroBand from '../brand/heroBand.tsx'

// Shown while a page's data loads (loading.tsx): the header band of the area and an unwritten
// register, so the layout does not jump when the content arrives.

const BAR: Record<'public' | 'applicant' | 'admin', string> = {
    public: 'bg-white/25',
    applicant: 'bg-sky/50',
    admin: 'bg-white/15',
}

const ROW_WIDTHS = ['62%', '48%', '55%', '40%']

export default function PageSkeleton({ tone }: { tone: 'public' | 'applicant' | 'admin' }) {
    return (
        <div aria-busy="true" className="flex flex-1 flex-col">
            <span role="status" className="sr-only">
                Loading{'…'}
            </span>
            <HeroBand tone={tone} className="px-4 pt-8 pb-16 sm:px-6 lg:px-16 lg:pt-12 lg:pb-20">
                <div className="mx-auto flex w-full max-w-[1072px] flex-col gap-4">
                    <span
                        className={cn(
                            'h-10 w-3/5 max-w-[520px] rounded-sm motion-safe:animate-pulse',
                            BAR[tone],
                        )}
                    />
                    <span
                        className={cn(
                            'h-4 w-2/5 max-w-[360px] rounded-sm motion-safe:animate-pulse',
                            BAR[tone],
                        )}
                    />
                </div>
            </HeroBand>
            <div className="relative -mt-8 px-3 pb-16 sm:px-6 lg:px-16">
                <div className="mx-auto w-full max-w-[1072px]">
                    <ContentSheet className="px-5 sm:px-7">
                        {ROW_WIDTHS.map((width) => (
                            <div
                                key={width}
                                className="flex items-center gap-6 border-b border-dashed border-sky py-6 last:border-b-0"
                            >
                                <span className="h-3 w-10 rounded-xs bg-tint" />
                                <span
                                    className="h-3 rounded-xs bg-tint motion-safe:animate-pulse"
                                    style={{ width }}
                                />
                            </div>
                        ))}
                    </ContentSheet>
                </div>
            </div>
        </div>
    )
}

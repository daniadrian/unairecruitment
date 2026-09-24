'use client'

import { useEffect } from 'react'
import ContentSheet from '../brand/contentSheet.tsx'
import { Button } from '../ui/button.tsx'
import Notice from './notice.tsx'

// Content of the route error boundaries (error.tsx): an unexpected failure while rendering. The
// technical detail only goes to the console; the person gets a way to try again.
export default function ErrorScreen({
    error,
    retry,
}: {
    error: Error & { digest?: string }
    retry: () => void
}) {
    useEffect(() => {
        console.error('Error rendering page:', error)
    }, [error])

    return (
        <div className="px-3 py-8 sm:px-6 lg:px-12 lg:py-12">
            <div className="mx-auto w-full max-w-[720px]">
                <ContentSheet className="flex flex-col gap-4 p-6 sm:p-7">
                    <h1 className="font-display text-[26px] leading-[1.2] font-medium text-ink">
                        Something went wrong.
                    </h1>
                    <Notice tone="error">
                        This page could not be shown. Try again; if it keeps happening, come back in a few
                        minutes.
                        {error.digest ? (
                            <span className="mt-1 block font-mono text-[12.5px] text-ink-soft">
                                Reference: {error.digest}
                            </span>
                        ) : null}
                    </Notice>
                    <div>
                        <Button onClick={() => retry()}>Try again</Button>
                    </div>
                </ContentSheet>
            </div>
        </div>
    )
}

import type { ReactNode } from 'react'
import ContentSheet from '../brand/contentSheet.tsx'
import Notice from './notice.tsx'

// A screen that could not load its data: the controller's message (V-9) and a way forward.
export default function ErrorPanel({
    title,
    message,
    action,
}: {
    title: string
    message: string
    action?: ReactNode
}) {
    return (
        <ContentSheet className="flex flex-col gap-4 p-6 sm:p-7">
            <h2 className="font-display text-[22px] font-medium text-ink">{title}</h2>
            <Notice tone="error">{message}</Notice>
            {action ? <div>{action}</div> : null}
        </ContentSheet>
    )
}

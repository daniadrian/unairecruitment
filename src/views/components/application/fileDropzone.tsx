import { Upload } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../../utils/cn.ts'

// Empty state of a file field ("Per-file upload"): a dashed drop area on a faint tint. It is a
// <label> for the (visually hidden) file input, so a click opens the file picker. Without
// `htmlFor` it is a static preview, as on the admin's "Applicant preview".
export default function FileDropzone({
    htmlFor,
    hint,
    active = false,
    className,
    children,
    ...props
}: ComponentProps<'label'> & { hint: ReactNode; active?: boolean }) {
    return (
        <label
            htmlFor={htmlFor}
            className={cn(
                'flex items-center gap-3.5 rounded-md border-[1.5px] border-dashed border-field bg-mist p-4 sm:p-[18px]',
                htmlFor && 'cursor-pointer hover:border-primary',
                active && 'border-primary bg-tint',
                className,
            )}
            {...props}
        >
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-tint text-secondary">
                <Upload aria-hidden="true" size={20} strokeWidth={2} />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[14.5px] font-semibold text-ink">
                    Drag a file here or <span className="text-link underline underline-offset-2">browse</span>
                </span>
                <span className="text-[13px] text-ink-soft">{hint}</span>
            </span>
            {children}
        </label>
    )
}

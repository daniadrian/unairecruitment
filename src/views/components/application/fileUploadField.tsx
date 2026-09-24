'use client'

import { Check, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { CV_EXTENSION, CV_MIME_TYPE, MAX_FILE_SIZE_MB } from '../../../utils/fileConstraints.ts'
import { cn } from '../../../utils/cn.ts'
import { formatFileSize } from '../../../utils/numberFormat.ts'
import { Button } from '../ui/button.tsx'
import FileDropzone from './fileDropzone.tsx'
import { useFileUpload } from './useFileUpload.ts'
import type { FileAnswerState } from '../../../types/applications/fileAnswerState.ts'

// A file field of the application form (UC-15 for the CV, File Upload custom fields for the rest).
// Each file is uploaded on its own as soon as it is chosen; the form only waits for the result.
// States follow "Per-file upload": empty, uploading with progress, uploaded, and failed (a
// blue-black outline and a warning icon, never red). The file input keeps one place in the
// tree so keyboard focus survives the state changes; its focus ring is drawn on the panel.

const FOCUS_RING =
    'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-bright'

export default function FileUploadField({
    id,
    purpose,
    invalid = false,
    describedBy,
    onChange,
}: {
    id: string
    purpose: 'CV' | 'ATTACHMENT'
    invalid?: boolean
    describedBy?: string
    onChange: (state: FileAnswerState) => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)
    const { state, start, cancel, remove } = useFileUpload(purpose, onChange)

    const accept = purpose === 'CV' ? `${CV_EXTENSION},${CV_MIME_TYPE}` : undefined
    const hint =
        purpose === 'CV'
            ? `PDF only · max. ${MAX_FILE_SIZE_MB} MB`
            : `Any file type · max. ${MAX_FILE_SIZE_MB} MB`

    function handleInput(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (file) start(file)
    }

    function handleDrop(event: DragEvent<HTMLLabelElement>) {
        event.preventDefault()
        setDragging(false)
        const file = event.dataTransfer.files?.[0]
        if (file) start(file)
    }

    const percent =
        state.sizeBytes > 0 ? Math.min(100, Math.round((state.loadedBytes / state.sizeBytes) * 100)) : 0

    return (
        <div className="flex flex-col">
            <input
                ref={inputRef}
                id={id}
                type="file"
                accept={accept}
                onChange={handleInput}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                className="peer sr-only"
            />

            {state.status === 'empty' ? (
                <FileDropzone
                    htmlFor={id}
                    hint={hint}
                    active={dragging}
                    onDragOver={(event) => {
                        event.preventDefault()
                        setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={cn(FOCUS_RING, invalid && 'border-2 border-solid border-ink')}
                />
            ) : null}

            {state.status === 'uploading' ? (
                <div
                    className={cn(
                        'flex flex-col gap-2.5 rounded-md border border-field bg-white px-4 py-3.5',
                        FOCUS_RING,
                    )}
                >
                    <div className="flex items-center gap-3">
                        <LoaderCircle
                            aria-hidden="true"
                            size={20}
                            strokeWidth={2}
                            className="shrink-0 animate-spin text-primary motion-reduce:animate-none"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[14.5px] font-semibold text-ink">{state.fileName}</p>
                            <p role="status" className="font-mono text-[12.5px] text-ink-soft">
                                Uploading{'…'} {formatFileSize(state.loadedBytes)} of{' '}
                                {formatFileSize(state.sizeBytes)} {'·'} {percent}%
                            </p>
                        </div>
                        <Button variant="ghost" size="xs" onClick={cancel}>
                            Cancel
                        </Button>
                    </div>
                    <div
                        role="progressbar"
                        aria-label={`Uploading ${state.fileName ?? 'file'}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                        className="h-1 rounded-xs bg-hairline"
                    >
                        <div
                            className="h-full rounded-xs bg-[linear-gradient(90deg,#4586C6,#5B92E5)] transition-[width] motion-reduce:transition-none"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            ) : null}

            {state.status === 'uploaded' ? (
                <div
                    className={cn(
                        'flex flex-wrap items-center gap-3 rounded-md border border-teal-line bg-white px-4 py-3.5',
                        FOCUS_RING,
                    )}
                >
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-teal">
                        <Check aria-hidden="true" size={13} strokeWidth={3} className="text-white" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-semibold text-ink">{state.fileName}</p>
                        <p role="status" className="font-mono text-[12.5px] text-teal-ink">
                            Uploaded {'·'} {formatFileSize(state.sizeBytes)}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="xs" onClick={() => inputRef.current?.click()}>
                            Replace
                        </Button>
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={remove}
                            className="underline underline-offset-2"
                        >
                            Remove
                        </Button>
                    </div>
                </div>
            ) : null}

            {state.status === 'failed' ? (
                <div
                    className={cn(
                        'flex flex-wrap items-start gap-3 rounded-md border-2 border-ink bg-white px-4 py-3.5',
                        FOCUS_RING,
                    )}
                >
                    <TriangleAlert
                        aria-hidden="true"
                        size={20}
                        strokeWidth={2.2}
                        className="shrink-0 text-ink"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-semibold text-ink">
                            {state.fileName}{' '}
                            <span className="font-mono text-[12.5px] font-medium text-ink-soft">
                                {formatFileSize(state.sizeBytes)}
                            </span>
                        </p>
                        <p role="alert" className="text-[13.5px] leading-[1.45] text-ink">
                            <b>Failed:</b> {state.error}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="outline" size="xs" onClick={() => inputRef.current?.click()}>
                            Choose again
                        </Button>
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={remove}
                            className="underline underline-offset-2"
                        >
                            Remove
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

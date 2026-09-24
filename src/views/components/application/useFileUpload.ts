'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../../../utils/fileConstraints.ts'
import type { FileAnswerState } from '../../../types/applications/fileAnswerState.ts'
import type { UploadedFile } from '../../../types/applications/uploadedFile.ts'

// Uploads one file to POST /api/uploads (KA-06: one request per file, at most 3 MB). XHR is used
// because it reports upload progress. The controller validates size, type, and PDF signature;
// the size pre-check here only avoids sending files the server would refuse (and larger than
// the 4.5 MB request limit of the platform), and repeats the controller's wording.

type Purpose = 'CV' | 'ATTACHMENT'

export interface UploadState {
    status: FileAnswerState['status']
    fileName: string | null
    sizeBytes: number
    loadedBytes: number
    uploaded: UploadedFile | null
    error: string | null
}

const EMPTY: UploadState = {
    status: 'empty',
    fileName: null,
    sizeBytes: 0,
    loadedBytes: 0,
    uploaded: null,
    error: null,
}

const UPLOAD_FAILED = 'Could not upload the file. Please try again.'

function readError(xhr: XMLHttpRequest): string {
    try {
        const body: unknown = JSON.parse(xhr.responseText)
        if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string')
            return body.error
    } catch {
        // The platform itself may answer without JSON, e.g. when a request is too large.
    }
    return xhr.status === 413 ? `Files can be at most ${MAX_FILE_SIZE_MB} MB.` : UPLOAD_FAILED
}

function readUploadedFile(xhr: XMLHttpRequest): UploadedFile | null {
    try {
        const body: unknown = JSON.parse(xhr.responseText)
        if (body && typeof body === 'object' && 'id' in body && typeof body.id === 'string')
            return body as UploadedFile
    } catch {
        return null
    }
    return null
}

export function useFileUpload(
    purpose: Purpose,
    onChange?: (state: FileAnswerState) => void,
): { state: UploadState; start: (file: File) => void; cancel: () => void; remove: () => void } {
    const [state, setState] = useState<UploadState>(EMPTY)
    const requestRef = useRef<XMLHttpRequest | null>(null)

    const report = useEffectEvent((next: UploadState) => {
        onChange?.({ status: next.status, fileId: next.uploaded?.id ?? null, fileName: next.fileName })
    })

    useEffect(() => {
        report(state)
    }, [state])

    useEffect(() => () => requestRef.current?.abort(), [])

    function start(file: File) {
        requestRef.current?.abort()
        requestRef.current = null

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setState({
                ...EMPTY,
                status: 'failed',
                fileName: file.name,
                sizeBytes: file.size,
                error: `Files can be at most ${MAX_FILE_SIZE_MB} MB.`,
            })
            return
        }

        const request = new XMLHttpRequest()
        requestRef.current = request
        request.open('POST', '/api/uploads')
        request.upload.onprogress = (event) => {
            setState((current) => ({ ...current, loadedBytes: event.loaded }))
        }
        request.onload = () => {
            requestRef.current = null
            const uploaded = request.status === 201 ? readUploadedFile(request) : null
            if (uploaded) {
                setState({
                    status: 'uploaded',
                    fileName: uploaded.originalName,
                    sizeBytes: uploaded.sizeBytes,
                    loadedBytes: uploaded.sizeBytes,
                    uploaded,
                    error: null,
                })
            } else {
                setState((current) => ({ ...current, status: 'failed', error: readError(request) }))
            }
        }
        request.onerror = () => {
            requestRef.current = null
            setState((current) => ({ ...current, status: 'failed', error: UPLOAD_FAILED }))
        }

        const body = new FormData()
        body.append('file', file)
        body.append('purpose', purpose)
        request.send(body)

        setState({ ...EMPTY, status: 'uploading', fileName: file.name, sizeBytes: file.size })
    }

    function cancel() {
        requestRef.current?.abort()
        requestRef.current = null
        setState(EMPTY)
    }

    function remove() {
        setState(EMPTY)
    }

    return { state, start, cancel, remove }
}

import type { FileBucket } from '../../types/fileBucket.ts'

export interface StoredFile {
    id: string
    ownerId: string
    bucket: FileBucket
    objectPath: string
    originalName: string
    mimeType: string
    sizeBytes: number
    createdAt: Date
}

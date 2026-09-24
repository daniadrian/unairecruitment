import { randomUUID } from 'node:crypto'
import { getPrismaClient } from '../../libs/prisma.ts'
import { ATTACHMENTS_BUCKET_NAME, CV_BUCKET_NAME, getStorageClient } from '../../libs/supabaseStorage.ts'
import type { StoredFile } from '../entities/storedFile.ts'
import type { FileBucket } from '../../types/fileBucket.ts'

// KS-06 and AL-07: private buckets, one object per file, downloads through short-lived signed URLs.
// Size, extension, and magic-byte validation is done by the controller before calling save (R-3).

const BUCKET_NAMES: Record<FileBucket, string> = {
    CV: CV_BUCKET_NAME,
    ATTACHMENTS: ATTACHMENTS_BUCKET_NAME,
}

type StoredFileRow = {
    id: string
    ownerId: string
    bucket: FileBucket
    objectPath: string
    originalName: string
    mimeType: string
    sizeBytes: number
    createdAt: Date
}

function toStoredFile(row: StoredFileRow): StoredFile {
    return {
        id: row.id,
        ownerId: row.ownerId,
        bucket: row.bucket,
        objectPath: row.objectPath,
        originalName: row.originalName,
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
        createdAt: row.createdAt,
    }
}

function extensionOf(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.')
    if (lastDot <= 0 || lastDot === fileName.length - 1) return ''
    return fileName.slice(lastDot).toLowerCase()
}

export class FileRepository {
    // The object is stored first, then its metadata. Storage and the database are not one
    // transaction, so a failure in between is cleaned up immediately or by the daily cron.
    public async save(
        ownerId: string,
        bucket: FileBucket,
        file: { data: Uint8Array; originalName: string; mimeType: string },
    ): Promise<StoredFile | null> {
        const prisma = getPrismaClient()
        const bucketName = BUCKET_NAMES[bucket]
        const objectPath = `${ownerId}/${randomUUID()}${extensionOf(file.originalName)}`

        try {
            const storage = getStorageClient()
            const uploaded = await storage.storage
                .from(bucketName)
                .upload(objectPath, file.data, { contentType: file.mimeType, upsert: false })

            if (uploaded.error) {
                console.error('Error uploading file to storage:', uploaded.error)
                return null
            }

            try {
                const created = await prisma.storedFile.create({
                    data: {
                        ownerId,
                        bucket,
                        objectPath,
                        originalName: file.originalName,
                        mimeType: file.mimeType,
                        sizeBytes: file.data.byteLength,
                    },
                })
                return toStoredFile(created)
            } catch (error) {
                console.error('Error saving file metadata:', error)
                await storage.storage.from(bucketName).remove([objectPath])
                return null
            }
        } catch (error) {
            console.error('Error saving file:', error)
            return null
        }
    }

    // AL-02: ensures the file IDs sent with an application belong to that applicant
    // and are not referenced by any application yet.
    public async listOwnedUnreferenced(ownerId: string, fileIds: string[]): Promise<StoredFile[]> {
        if (fileIds.length === 0) return []
        const prisma = getPrismaClient()
        try {
            const rows = await prisma.storedFile.findMany({
                where: {
                    id: { in: fileIds },
                    ownerId,
                    cvOf: { is: null },
                    answerOf: { is: null },
                },
            })
            return rows.map(toStoredFile)
        } catch (error) {
            console.error('Error listing unreferenced files:', error)
            return []
        }
    }

    public async delete(fileId: string): Promise<boolean> {
        const prisma = getPrismaClient()
        try {
            const row = await prisma.storedFile.findUnique({ where: { id: fileId } })
            if (!row) return false

            const storage = getStorageClient()
            const removed = await storage.storage.from(BUCKET_NAMES[row.bucket]).remove([row.objectPath])
            if (removed.error) {
                console.error('Error removing file from storage:', removed.error)
                return false
            }

            await prisma.storedFile.delete({ where: { id: fileId } })
            return true
        } catch (error) {
            console.error('Error deleting file:', error)
            return false
        }
    }

    // UC-16: short-lived signed URL, issued after the controller checks the role.
    public async createDownloadUrl(fileId: string, expiresInSeconds: number): Promise<string | null> {
        const prisma = getPrismaClient()
        try {
            const row = await prisma.storedFile.findUnique({ where: { id: fileId } })
            if (!row) return null

            const storage = getStorageClient()
            const signed = await storage.storage
                .from(BUCKET_NAMES[row.bucket])
                .createSignedUrl(row.objectPath, expiresInSeconds, { download: row.originalName })

            if (signed.error || !signed.data) {
                console.error('Error creating signed url:', signed.error)
                return null
            }
            return signed.data.signedUrl
        } catch (error) {
            console.error('Error creating download url:', error)
            return null
        }
    }

    // 06 section 6 step 5: orphaned files older than the cutoff are deleted by the daily cron.
    public async deleteUnreferenced(olderThan: Date): Promise<number> {
        const prisma = getPrismaClient()
        try {
            const rows = await prisma.storedFile.findMany({
                where: {
                    createdAt: { lt: olderThan },
                    cvOf: { is: null },
                    answerOf: { is: null },
                },
            })
            if (rows.length === 0) return 0

            const storage = getStorageClient()
            let deleted = 0

            for (const bucket of Object.keys(BUCKET_NAMES) as FileBucket[]) {
                const paths = rows.filter((row) => row.bucket === bucket).map((row) => row.objectPath)
                if (paths.length === 0) continue
                const removed = await storage.storage.from(BUCKET_NAMES[bucket]).remove(paths)
                if (removed.error) {
                    console.error('Error removing orphan files from storage:', removed.error)
                    continue
                }
                const ids = rows.filter((row) => row.bucket === bucket).map((row) => row.id)
                const result = await prisma.storedFile.deleteMany({ where: { id: { in: ids } } })
                deleted += result.count
            }

            return deleted
        } catch (error) {
            console.error('Error deleting unreferenced files:', error)
            return 0
        }
    }
}

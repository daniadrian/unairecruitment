import 'dotenv/config'
import { ATTACHMENTS_BUCKET_NAME, CV_BUCKET_NAME, getStorageClient } from '../src/libs/supabaseStorage.ts'
import { CV_MIME_TYPE, MAX_FILE_SIZE_BYTES } from '../src/utils/fileConstraints.ts'

// KS-06: prepares the private Storage buckets idempotently. Safe to run repeatedly and
// for both the dev and production projects. Bucket limits are defense in depth; the main
// validation still happens on the server before a file is stored (AL-07).
//
//   cv           private, at most 3 MB, application/pdf only (AB-14)
//   attachments  private, at most 3 MB, any format (AB-14)

type BucketSpec = {
    name: string
    allowedMimeTypes: string[] | null
}

const BUCKETS: BucketSpec[] = [
    { name: CV_BUCKET_NAME, allowedMimeTypes: [CV_MIME_TYPE] },
    { name: ATTACHMENTS_BUCKET_NAME, allowedMimeTypes: null },
]

async function ensureBucket(spec: BucketSpec): Promise<void> {
    const storage = getStorageClient().storage
    const options = {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE_BYTES,
        allowedMimeTypes: spec.allowedMimeTypes,
    }

    const existing = await storage.getBucket(spec.name)
    const result = existing.data
        ? await storage.updateBucket(spec.name, options)
        : await storage.createBucket(spec.name, options)

    if (result.error) {
        throw new Error(`Failed to prepare bucket "${spec.name}": ${result.error.message}`)
    }

    const verified = await storage.getBucket(spec.name)
    if (verified.error || !verified.data) {
        throw new Error(`Bucket "${spec.name}" not found after setup`)
    }

    const bucket = verified.data
    const action = existing.data ? 'updated' : 'created'
    console.info(
        `Bucket ${bucket.name} ${action}: public=${bucket.public}, ` +
            `fileSizeLimit=${bucket.file_size_limit ?? 'none'}, ` +
            `allowedMimeTypes=${bucket.allowed_mime_types?.join(',') ?? 'any'}`,
    )
}

async function main(): Promise<void> {
    for (const spec of BUCKETS) {
        await ensureBucket(spec)
    }
}

main().catch((error) => {
    console.error('Storage setup failed:', error)
    process.exit(1)
})

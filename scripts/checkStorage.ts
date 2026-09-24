import 'dotenv/config'
import { getPrismaClient } from '../src/libs/prisma.ts'
import { ATTACHMENTS_BUCKET_NAME, CV_BUCKET_NAME, getStorageClient } from '../src/libs/supabaseStorage.ts'
import { FileRepository } from '../src/models/repositories/fileRepository.ts'
import { MAX_FILE_SIZE_BYTES } from '../src/utils/fileConstraints.ts'

// End-to-end Supabase Storage check through the FileRepository the application uses (AL-07, UC-16).
// Writes test files owned by the admin account, then ALWAYS deletes them again, even when a
// step fails. Safe to run against production: no other files are touched.
//
// The output never prints signed URLs (they contain an access token) or credentials.

const TEST_FILE_NAME = 'storage-check.pdf'
const TEST_PDF = new TextEncoder().encode('%PDF-1.4\n% UNAI Recruitment storage check\n%%EOF\n')
const SIGNED_URL_TTL_SECONDS = 60

type Check = { name: string; passed: boolean; detail: string }
const checks: Check[] = []

function record(name: string, passed: boolean, detail: string): void {
    checks.push({ name, passed, detail })
    console.info(`${passed ? 'OK   ' : 'FAIL '}  ${name}: ${detail}`)
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
    return a.byteLength === b.byteLength && a.every((byte, index) => byte === b[index])
}

async function main(): Promise<void> {
    const prisma = getPrismaClient()
    const files = new FileRepository()
    const createdIds: string[] = []

    try {
        const owner = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } })
        if (!owner) {
            record('test file owner', false, 'no admin account; run db:seed first')
            return
        }

        // 1. Upload through FileRepository.save to the private `cv` bucket.
        const saved = await files.save(owner.id, 'CV', {
            data: TEST_PDF,
            originalName: TEST_FILE_NAME,
            mimeType: 'application/pdf',
        })
        record(
            'upload PDF to the cv bucket',
            saved !== null,
            saved ? `${saved.sizeBytes} bytes stored` : 'save returned null',
        )
        if (!saved) return
        createdIds.push(saved.id)

        // 2. A short-lived signed URL downloads exactly the same content.
        const signedUrl = await files.createDownloadUrl(saved.id, SIGNED_URL_TTL_SECONDS)
        record(
            'issue a signed URL',
            signedUrl !== null,
            signedUrl ? `valid for ${SIGNED_URL_TTL_SECONDS} seconds` : 'null',
        )
        if (signedUrl) {
            const response = await fetch(signedUrl)
            const body = new Uint8Array(await response.arrayBuffer())
            record(
                'download through the signed URL',
                response.ok && sameBytes(body, TEST_PDF),
                `HTTP ${response.status}, ${body.byteLength} bytes, identical content: ${sameBytes(body, TEST_PDF)}`,
            )

            const disposition = response.headers.get('content-disposition') ?? ''
            record(
                'original file name on download',
                disposition.includes(TEST_FILE_NAME),
                disposition ? 'content-disposition contains the original name' : 'no content-disposition',
            )
        }

        // 3. Private bucket: a public URL must not open the file.
        const publicUrl = getStorageClient().storage.from(CV_BUCKET_NAME).getPublicUrl(saved.objectPath)
            .data.publicUrl
        const publicResponse = await fetch(publicUrl)
        await publicResponse.arrayBuffer()
        record('public URL rejected (private bucket)', !publicResponse.ok, `HTTP ${publicResponse.status}`)

        // 4. Defense in depth at the bucket (KS-06): the cv bucket rejects non-PDF types.
        console.info('       (the next two "Error uploading file to storage" messages are expected)')
        const wrongType = await files.save(owner.id, 'CV', {
            data: new TextEncoder().encode('not a pdf'),
            originalName: 'not-a-pdf.txt',
            mimeType: 'text/plain',
        })
        if (wrongType) createdIds.push(wrongType.id)
        record(
            'cv bucket rejects non-PDF types',
            wrongType === null,
            wrongType ? 'file accepted' : 'rejected by Storage',
        )

        // 5. Bucket size limit of 3 MB (AB-14).
        const oversized = await files.save(owner.id, 'ATTACHMENTS', {
            data: new Uint8Array(MAX_FILE_SIZE_BYTES + 1),
            originalName: 'too-large.bin',
            mimeType: 'application/octet-stream',
        })
        if (oversized) createdIds.push(oversized.id)
        record(
            'attachments bucket rejects > 3 MB',
            oversized === null,
            oversized ? 'file accepted' : 'rejected by Storage',
        )
    } finally {
        // 6. Clean up every test file, then confirm it is really gone.
        for (const id of createdIds) {
            const row = await prisma.storedFile.findUnique({
                where: { id },
                select: { objectPath: true, bucket: true },
            })
            const deleted = await files.delete(id)
            const stillInDatabase = await prisma.storedFile.count({ where: { id } })
            let stillInStorage = false
            if (row) {
                const bucketName = row.bucket === 'CV' ? CV_BUCKET_NAME : ATTACHMENTS_BUCKET_NAME
                const folder = row.objectPath.split('/')[0] ?? ''
                const name = row.objectPath.split('/').slice(1).join('/')
                const listed = await getStorageClient()
                    .storage.from(bucketName)
                    .list(folder, { search: name })
                stillInStorage = (listed.data ?? []).some((item) => item.name === name)
            }
            record(
                'test file cleaned up',
                deleted && stillInDatabase === 0 && !stillInStorage,
                `database rows: ${stillInDatabase}, Storage object: ${stillInStorage ? 'still present' : 'gone'}`,
            )
        }
        await prisma.$disconnect()
    }

    if (checks.some((check) => !check.passed)) process.exitCode = 1
}

main().catch((error) => {
    console.error('Storage check failed:', error)
    process.exit(1)
})

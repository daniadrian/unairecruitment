// AB-14: one file size constant for the whole application (U-3, L-6).
export const MAX_FILE_SIZE_MB = 3
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

// CVs must be .pdf; files in File Upload fields may be any format.
export const CV_MIME_TYPE = 'application/pdf'
export const CV_EXTENSION = '.pdf'

// PDF file signature in the first five bytes.
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d]

// 06 section 6 step 5: orphaned files older than this cutoff are deleted by the daily cron.
export const ORPHAN_FILE_MIN_AGE_MS = 24 * 60 * 60 * 1000

export function isWithinSizeLimit(sizeBytes: number): boolean {
    return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES
}

export function hasPdfExtension(fileName: string): boolean {
    return fileName.toLowerCase().endsWith(CV_EXTENSION)
}

export function hasPdfMagicBytes(head: Uint8Array): boolean {
    if (head.length < PDF_MAGIC_BYTES.length) return false
    return PDF_MAGIC_BYTES.every((byte, index) => head[index] === byte)
}

// U-1 and U-4: pure display formatting for numbers shown in views.

const KILOBYTE = 1024
const MEGABYTE = 1024 * 1024

// File sizes as shown in the design: "842 KB", "2.6 MB".
export function formatFileSize(sizeBytes: number): string {
    if (sizeBytes < KILOBYTE) return `${sizeBytes} B`
    if (sizeBytes < MEGABYTE) return `${Math.round(sizeBytes / KILOBYTE)} KB`
    return `${(sizeBytes / MEGABYTE).toFixed(1)} MB`
}

// Whole-number share of a total, e.g. 58 of 128 is "45%". An empty total is "0%".
export function formatPercent(part: number, total: number): string {
    if (total <= 0) return '0%'
    return `${Math.round((part / total) * 100)}%`
}

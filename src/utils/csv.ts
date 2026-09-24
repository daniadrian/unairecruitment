// AB-15 and AL-06: CSV file builder for the applicant data export (UC-17).
// Follows RFC 4180: comma separator, double-quote wrapping when needed, CRLF line endings.

const ROW_SEPARATOR = '\r\n'

export function escapeCsvValue(value: string): string {
    if (value === '') return ''
    const needsQuoting = /[",\r\n]/.test(value)
    if (!needsQuoting) return value
    return `"${value.replace(/"/g, '""')}"`
}

export function buildCsv(headers: string[], rows: string[][]): string {
    const lines = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(','))
    return lines.join(ROW_SEPARATOR) + ROW_SEPARATOR
}

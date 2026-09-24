// U-1 and U-4: pure display formatting for text shown in views.

const REFERENCE_LENGTH = 8
const LIST_MARKER = /^(\d+[.)]|[-*\u2022])\s+/

// Short, human-readable reference for a UUID (the "registration number" of the design).
// It is the last characters of the real ID, so it is a visual reference only; the full ID
// stays available (tooltip, CSV export).
export function shortReference(id: string): string {
    return id.replace(/-/g, '').slice(-REFERENCE_LENGTH).toUpperCase()
}

// Up to two initials for the avatar in the navigation bar.
export function getInitials(name: string): string {
    const words = name
        .trim()
        .split(/\s+/)
        .filter((word) => word !== '')
    if (words.length === 0) return '?'
    const letters = words.length === 1 ? [words[0][0]] : [words[0][0], words[words.length - 1][0]]
    return letters.join('').toUpperCase()
}

// Hides most of the local part of an email address, e.g. d••••••@mail.com.
export function maskEmail(email: string): string {
    const at = email.indexOf('@')
    if (at <= 0) return email
    return `${email[0]}${'\u2022'.repeat(6)}${email.slice(at)}`
}

// Splits multi-line admin text (requirements, descriptions) into non-empty lines,
// dropping list markers the admin may have typed so views can number them consistently.
export function splitLines(text: string): string[] {
    return text
        .split(/\r?\n/)
        .map((line) => line.trim().replace(LIST_MARKER, '').trim())
        .filter((line) => line !== '')
}

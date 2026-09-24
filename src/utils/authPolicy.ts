// AB-16 and the password policy (project owner decision 2026-09-21):
// single source of truth for every identity parameter (U-3, L-6).

// Passwords have at least 8 characters and must contain letters and numbers.
export const PASSWORD_MIN_LENGTH = 8

// Sessions last 7 days from sign-in, with no automatic extension.
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

// 6-digit OTP, valid for 10 minutes, single use, at most 5 wrong attempts.
export const OTP_LENGTH = 6
export const OTP_TTL_MS = 10 * 60 * 1000
export const OTP_TTL_MINUTES = OTP_TTL_MS / 60_000
export const OTP_MAX_ATTEMPTS = 5

// New OTP requests: 60-second cooldown and at most 5 requests per hour per email.
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000
export const OTP_REQUEST_WINDOW_MS = 60 * 60 * 1000
export const OTP_MAX_REQUESTS_PER_WINDOW = 5

// Lifetime of file download signed URLs (AL-07).
export const DOWNLOAD_URL_TTL_SECONDS = 60

export function hasLetterAndDigit(value: string): boolean {
    return /[A-Za-z]/.test(value) && /[0-9]/.test(value)
}

export function isValidPassword(value: string): boolean {
    return value.length >= PASSWORD_MIN_LENGTH && hasLetterAndDigit(value)
}

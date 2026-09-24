// U-1: pure display formatting (06 section 3: Intl.DateTimeFormat('en-GB')).

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeZone: 'Asia/Jakarta',
})

export function formatDateTime(value: Date): string {
    return dateTimeFormatter.format(value)
}

export function formatDate(value: Date): string {
    return dateFormatter.format(value)
}

// Answers of Date fields are stored as calendar dates (YYYY-MM-DD) without a time zone.
const calendarDateFormatter = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeZone: 'UTC',
})

export function formatCalendarDate(value: string): string {
    const date = new Date(`${value}T00:00:00Z`)
    return Number.isNaN(date.getTime()) ? value : calendarDateFormatter.format(date)
}

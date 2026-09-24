// U-1: guards the `next` query parameter used after signing in, so it can only point to a
// page of this application and never to another site (open redirect).
export function safeNextPath(value: string | string[] | undefined | null): string | null {
    if (typeof value !== 'string') return null
    if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
    return value
}

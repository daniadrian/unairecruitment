import { cookies } from 'next/headers'
import { isProduction } from './env.ts'

// L-3: platform bridge for the session cookie, without domain logic.
// KA-07: a random token is stored in an httpOnly cookie; its hash is stored in the database.

export const SESSION_COOKIE_NAME = 'unairec_session'

export async function readSessionToken(): Promise<string | null> {
    const store = await cookies()
    return store.get(SESSION_COOKIE_NAME)?.value ?? null
}

export async function writeSessionCookie(token: string, expiresAt: Date): Promise<void> {
    const store = await cookies()
    store.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction(),
        path: '/',
        expires: expiresAt,
    })
}

export async function clearSessionCookie(): Promise<void> {
    const store = await cookies()
    store.delete(SESSION_COOKIE_NAME)
}

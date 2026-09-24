import { hash as hashSecret, verify as verifySecret } from '@node-rs/argon2'
import { createHash, randomBytes } from 'node:crypto'
import { getPrismaClient } from '../../libs/prisma.ts'
import { clearSessionCookie, readSessionToken, writeSessionCookie } from '../../libs/session.ts'
import type { PasswordResetOtp } from '../entities/passwordResetOtp.ts'
import type { User } from '../entities/user.ts'
import type { SessionUser } from '../../types/auth/sessionUser.ts'

// R-4 is explicitly waived for this repository: it wraps every identity operation,
// including creating, reading, and deleting sessions (05 section 4.8). The exception
// applies only here; other repositories still receive IDs as parameters.
//
// Policies (session and OTP lifetime, attempt limits, password policy) are
// business rules owned by AuthController; the repository only stores and reads (R-3).

type UserRow = {
    id: string
    name: string
    email: string
    contactNumber: string | null
    passwordHash: string
    role: 'APPLICANT' | 'ADMIN'
    createdAt: Date
}

type OtpRow = {
    id: string
    userId: string
    codeHash: string
    expiresAt: Date
    usedAt: Date | null
    attempts: number
    createdAt: Date
}

function toUser(row: UserRow): User {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        contactNumber: row.contactNumber,
        passwordHash: row.passwordHash,
        role: row.role,
        createdAt: row.createdAt,
    }
}

function toSessionUser(row: UserRow): SessionUser {
    return { id: row.id, name: row.name, email: row.email, role: row.role }
}

function toOtp(row: OtpRow): PasswordResetOtp {
    return {
        id: row.id,
        userId: row.userId,
        codeHash: row.codeHash,
        expiresAt: row.expiresAt,
        usedAt: row.usedAt,
        attempts: row.attempts,
        createdAt: row.createdAt,
    }
}

function hashSessionToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
}

export class AuthRepository {
    // UC-01. Distinguished errors: 'EMAIL_TAKEN' and 'UNKNOWN' (R-5, C-2).
    public async register(input: {
        name: string
        email: string
        contactNumber: string
        password: string
    }): Promise<{ user: SessionUser | null; error: string | null }> {
        const prisma = getPrismaClient()
        try {
            const existing = await prisma.user.findUnique({ where: { email: input.email } })
            if (existing) return { user: null, error: 'EMAIL_TAKEN' }

            const created = await prisma.user.create({
                data: {
                    name: input.name,
                    email: input.email,
                    contactNumber: input.contactNumber,
                    passwordHash: await hashSecret(input.password),
                    role: 'APPLICANT',
                },
            })
            return { user: toSessionUser(created), error: null }
        } catch (error) {
            console.error('Error registering user:', error)
            return { user: null, error: 'UNKNOWN' }
        }
    }

    public async findByEmail(email: string): Promise<User | null> {
        const prisma = getPrismaClient()
        try {
            const row = await prisma.user.findUnique({ where: { email } })
            return row ? toUser(row) : null
        } catch (error) {
            console.error('Error finding user by email:', error)
            return null
        }
    }

    // UC-02. Distinguished errors: 'INVALID_CREDENTIALS' and 'UNKNOWN'.
    public async verifyCredentials(
        email: string,
        password: string,
    ): Promise<{ user: SessionUser | null; error: string | null }> {
        const prisma = getPrismaClient()
        try {
            const row = await prisma.user.findUnique({ where: { email } })
            if (!row) return { user: null, error: 'INVALID_CREDENTIALS' }

            const matches = await verifySecret(row.passwordHash, password)
            if (!matches) return { user: null, error: 'INVALID_CREDENTIALS' }

            return { user: toSessionUser(row), error: null }
        } catch (error) {
            console.error('Error verifying credentials:', error)
            return { user: null, error: 'UNKNOWN' }
        }
    }

    // UC-03. Used by the controller to check expiry, usage, and the number of attempts.
    public async findLatestOtp(userId: string): Promise<PasswordResetOtp | null> {
        const prisma = getPrismaClient()
        try {
            const row = await prisma.passwordResetOtp.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            })
            return row ? toOtp(row) : null
        } catch (error) {
            console.error('Error finding latest OTP:', error)
            return null
        }
    }

    // AB-16: the 60-second cooldown and the 5-requests-per-hour limit are computed from OTP rows.
    public async countRecentOtps(userId: string, since: Date): Promise<number> {
        const prisma = getPrismaClient()
        try {
            return await prisma.passwordResetOtp.count({ where: { userId, createdAt: { gte: since } } })
        } catch (error) {
            console.error('Error counting recent OTPs:', error)
            return 0
        }
    }

    // AB-16: the previous OTP is voided when a new OTP is requested.
    public async saveOtp(userId: string, code: string, expiresAt: Date): Promise<boolean> {
        const prisma = getPrismaClient()
        try {
            const codeHash = await hashSecret(code)
            await prisma.$transaction([
                prisma.passwordResetOtp.updateMany({
                    where: { userId, usedAt: null },
                    data: { usedAt: new Date() },
                }),
                prisma.passwordResetOtp.create({ data: { userId, codeHash, expiresAt } }),
            ])
            return true
        } catch (error) {
            console.error('Error saving OTP:', error)
            return false
        }
    }

    // Increments `attempts` when the code is wrong (05 section 4.4). The decision about the
    // remaining attempts is made in the controller.
    public async verifyOtp(otpId: string, code: string): Promise<{ valid: boolean; error: string | null }> {
        const prisma = getPrismaClient()
        try {
            const row = await prisma.passwordResetOtp.findUnique({ where: { id: otpId } })
            if (!row) return { valid: false, error: 'NOT_FOUND' }

            const matches = await verifySecret(row.codeHash, code)
            if (!matches) {
                await prisma.passwordResetOtp.update({
                    where: { id: otpId },
                    data: { attempts: { increment: 1 } },
                })
                return { valid: false, error: 'INVALID_CODE' }
            }
            return { valid: true, error: null }
        } catch (error) {
            console.error('Error verifying OTP:', error)
            return { valid: false, error: 'UNKNOWN' }
        }
    }

    // The password is updated and the OTP is marked as used in one transaction (R-8),
    // so the OTP is truly single use (AB-16).
    public async updatePassword(userId: string, newPassword: string, otpId: string): Promise<boolean> {
        const prisma = getPrismaClient()
        try {
            const passwordHash = await hashSecret(newPassword)
            await prisma.$transaction(async (tx) => {
                await tx.user.update({ where: { id: userId }, data: { passwordHash } })
                await tx.passwordResetOtp.update({ where: { id: otpId }, data: { usedAt: new Date() } })
                // All old sessions end once the password changes.
                await tx.session.deleteMany({ where: { userId } })
            })
            return true
        } catch (error) {
            console.error('Error updating password:', error)
            return false
        }
    }

    // KA-07: a random token is sent through the cookie; only its hash is stored.
    public async createSessionToken(
        userId: string,
        expiresAt: Date,
    ): Promise<{ token: string; expiresAt: Date } | null> {
        const prisma = getPrismaClient()
        try {
            const token = randomBytes(32).toString('base64url')
            await prisma.session.create({
                data: { userId, tokenHash: hashSessionToken(token), expiresAt },
            })
            return { token, expiresAt }
        } catch (error) {
            console.error('Error creating session:', error)
            return null
        }
    }

    public async findSessionUserByToken(token: string): Promise<SessionUser | null> {
        const prisma = getPrismaClient()
        try {
            const row = await prisma.session.findUnique({
                where: { tokenHash: hashSessionToken(token) },
                include: { user: true },
            })
            if (!row) return null
            if (row.expiresAt.getTime() <= Date.now()) return null
            return toSessionUser(row.user)
        } catch (error) {
            console.error('Error reading session:', error)
            return null
        }
    }

    public async deleteSessionByToken(token: string): Promise<boolean> {
        const prisma = getPrismaClient()
        try {
            await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } })
            return true
        } catch (error) {
            console.error('Error deleting session:', error)
            return false
        }
    }

    public async deleteExpiredSessions(now: Date): Promise<number> {
        const prisma = getPrismaClient()
        try {
            const result = await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } })
            return result.count
        } catch (error) {
            console.error('Error deleting expired sessions:', error)
            return 0
        }
    }

    public async createSession(userId: string, expiresAt: Date): Promise<boolean> {
        const created = await this.createSessionToken(userId, expiresAt)
        if (!created) return false
        await writeSessionCookie(created.token, created.expiresAt)
        return true
    }

    // Single identity path (05 section 4.8).
    public async getSessionUser(): Promise<SessionUser | null> {
        const token = await readSessionToken()
        if (!token) return null
        return this.findSessionUserByToken(token)
    }

    public async deleteSession(): Promise<boolean> {
        const token = await readSessionToken()
        if (token) await this.deleteSessionByToken(token)
        await clearSessionCookie()
        return true
    }
}

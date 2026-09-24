import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthController } from './authController.ts'
import {
    OTP_MAX_ATTEMPTS,
    OTP_MAX_REQUESTS_PER_WINDOW,
    OTP_TTL_MS,
    SESSION_DURATION_MS,
} from '../utils/authPolicy.ts'
import type { AuthRepository } from '../models/repositories/authRepository.ts'
import type { MailRepository } from '../models/repositories/mailRepository.ts'
import type { PasswordResetOtp } from '../models/entities/passwordResetOtp.ts'
import type { User } from '../models/entities/user.ts'
import type { RegisterInput } from '../types/inputs/registerInput.ts'
import type { SessionUser } from '../types/auth/sessionUser.ts'

// UC-01 to UC-04, AL-03 and AL-04.

const applicant: SessionUser = {
    id: 'user-1',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    role: 'APPLICANT',
}

type IdentityResult = { user: SessionUser | null; error: string | null }

function createAuthRepository() {
    return {
        register: vi.fn(async (_input: RegisterInput): Promise<IdentityResult> => ({
            user: applicant,
            error: null,
        })),
        findByEmail: vi.fn(async (_email: string): Promise<User | null> => ({
            id: applicant.id,
            name: applicant.name,
            email: applicant.email,
            contactNumber: '081234567890',
            passwordHash: 'hash',
            role: 'APPLICANT',
            createdAt: new Date(),
        })),
        verifyCredentials: vi.fn(
            async (_email: string, _password: string): Promise<IdentityResult> => ({
                user: applicant,
                error: null,
            }),
        ),
        findLatestOtp: vi.fn(async (_userId: string): Promise<PasswordResetOtp | null> => null),
        countRecentOtps: vi.fn(async (_userId: string, _since: Date): Promise<number> => 0),
        saveOtp: vi.fn(
            async (_userId: string, _code: string, _expiresAt: Date): Promise<boolean> => true,
        ),
        verifyOtp: vi.fn(
            async (_otpId: string, _code: string): Promise<{ valid: boolean; error: string | null }> => ({
                valid: true,
                error: null,
            }),
        ),
        updatePassword: vi.fn(
            async (_userId: string, _newPassword: string, _otpId: string): Promise<boolean> => true,
        ),
        createSession: vi.fn(async (_userId: string, _expiresAt: Date): Promise<boolean> => true),
        getSessionUser: vi.fn(async (): Promise<SessionUser | null> => applicant),
        deleteSession: vi.fn(async (): Promise<boolean> => true),
    }
}

function createMailRepository() {
    return {
        sendOtp: vi.fn(
            async (_email: string, _code: string, _validForMinutes: number): Promise<boolean> => true,
        ),
    }
}

function buildOtp(overrides: Partial<PasswordResetOtp> = {}): PasswordResetOtp {
    return {
        id: 'otp-1',
        userId: applicant.id,
        codeHash: 'hash',
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        usedAt: null,
        attempts: 0,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        ...overrides,
    }
}

function buildController(
    authRepository = createAuthRepository(),
    mailRepository = createMailRepository(),
) {
    const controller = new AuthController(
        authRepository as unknown as AuthRepository,
        mailRepository as unknown as MailRepository,
    )
    return { controller, authRepository, mailRepository }
}

describe('AuthController.submitRegister (UC-01)', () => {
    const validInput = {
        name: 'Budi Santoso',
        email: 'Budi@Example.com',
        contactNumber: '081234567890',
        password: 'secret123',
    }

    it('rejects a password shorter than 8 characters', async () => {
        const { controller, authRepository } = buildController()
        const result = await controller.submitRegister({ ...validInput, password: 'sec12' })

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('VALIDATION')
        expect(result.fieldErrors?.password).toContain('at least 8 characters')
        expect(authRepository.register).not.toHaveBeenCalled()
    })

    it('rejects a password without digits or without letters', async () => {
        const { controller } = buildController()

        const withoutDigit = await controller.submitRegister({ ...validInput, password: 'secretword' })
        const withoutLetter = await controller.submitRegister({ ...validInput, password: '12345678' })

        expect(withoutDigit.ok).toBe(false)
        expect(withoutLetter.ok).toBe(false)
        if (withoutDigit.ok || withoutLetter.ok) return
        expect(withoutDigit.fieldErrors?.password).toContain('letters and numbers')
        expect(withoutLetter.fieldErrors?.password).toContain('letters and numbers')
    })

    it('rejects empty fields and invalid email or contact number formats', async () => {
        const { controller } = buildController()

        const empty = await controller.submitRegister({
            name: '',
            email: '',
            contactNumber: '',
            password: '',
        })
        const invalidFormat = await controller.submitRegister({
            ...validInput,
            email: 'not-an-email',
            contactNumber: 'abc',
        })

        expect(empty.ok).toBe(false)
        expect(invalidFormat.ok).toBe(false)
        if (empty.ok || invalidFormat.ok) return
        expect(Object.keys(empty.fieldErrors ?? {})).toEqual(
            expect.arrayContaining(['name', 'email', 'contactNumber', 'password']),
        )
        expect(invalidFormat.fieldErrors?.email).toBe('Invalid email format.')
        expect(invalidFormat.fieldErrors?.contactNumber).toBe('Invalid contact number format.')
    })

    it('rejects an email that is already registered', async () => {
        const authRepository = createAuthRepository()
        authRepository.register.mockResolvedValue({ user: null, error: 'EMAIL_TAKEN' })
        const { controller } = buildController(authRepository)

        const result = await controller.submitRegister(validInput)

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('CONFLICT')
    })

    it('stores the email in lowercase and creates a 7-day session', async () => {
        const { controller, authRepository } = buildController()

        const result = await controller.submitRegister(validInput)

        expect(result.ok).toBe(true)
        expect(authRepository.register).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'budi@example.com' }),
        )

        const [, expiresAt] = authRepository.createSession.mock.calls[0] as unknown as [string, Date]
        const durationMs = expiresAt.getTime() - Date.now()
        expect(durationMs).toBeGreaterThan(SESSION_DURATION_MS - 5_000)
        expect(durationMs).toBeLessThanOrEqual(SESSION_DURATION_MS)
    })

    it('does not create admin accounts through registration (AB-08)', async () => {
        const { controller, authRepository } = buildController()
        await controller.submitRegister(validInput)

        const payload = authRepository.register.mock.calls[0]?.[0] as unknown as Record<string, unknown>
        expect(payload).not.toHaveProperty('role')
    })
})

describe('AuthController.submitLogin (UC-02)', () => {
    it('requires both email and password', async () => {
        const { controller, authRepository } = buildController()
        const result = await controller.submitLogin({ email: '', password: '' })

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('VALIDATION')
        expect(authRepository.verifyCredentials).not.toHaveBeenCalled()
    })

    it('rejects wrong credentials without revealing which one is wrong', async () => {
        const authRepository = createAuthRepository()
        authRepository.verifyCredentials.mockResolvedValue({ user: null, error: 'INVALID_CREDENTIALS' })
        const { controller } = buildController(authRepository)

        const result = await controller.submitLogin({ email: 'budi@example.com', password: 'wrong123' })

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error).toBe('Incorrect email or password.')
        expect(result.code).toBe('UNAUTHENTICATED')
    })

    it('creates a session when the credentials are correct', async () => {
        const { controller, authRepository } = buildController()
        const result = await controller.submitLogin({ email: 'Budi@example.com', password: 'secret123' })

        expect(result.ok).toBe(true)
        expect(authRepository.verifyCredentials).toHaveBeenCalledWith('budi@example.com', 'secret123')
        expect(authRepository.createSession).toHaveBeenCalledOnce()
    })
})

describe('AuthController.submitForgotPassword (UC-03, AB-16)', () => {
    it('rejects an unregistered email and does not send an OTP', async () => {
        const authRepository = createAuthRepository()
        authRepository.findByEmail.mockResolvedValue(null)
        const { controller, mailRepository } = buildController(authRepository)

        const result = await controller.submitForgotPassword('missing@example.com')

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('NOT_FOUND')
        expect(mailRepository.sendOtp).not.toHaveBeenCalled()
    })

    it('rejects a repeat request before the 60-second cooldown', async () => {
        const authRepository = createAuthRepository()
        authRepository.findLatestOtp.mockResolvedValue(buildOtp({ createdAt: new Date(Date.now() - 10_000) }))
        const { controller, mailRepository } = buildController(authRepository)

        const result = await controller.submitForgotPassword('budi@example.com')

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('RATE_LIMITED')
        expect(mailRepository.sendOtp).not.toHaveBeenCalled()
    })

    it('rejects the 6th request within one hour', async () => {
        const authRepository = createAuthRepository()
        authRepository.countRecentOtps.mockResolvedValue(OTP_MAX_REQUESTS_PER_WINDOW)
        const { controller, mailRepository } = buildController(authRepository)

        const result = await controller.submitForgotPassword('budi@example.com')

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('RATE_LIMITED')
        expect(mailRepository.sendOtp).not.toHaveBeenCalled()
    })

    it('sends a 6-digit OTP that is valid for 10 minutes', async () => {
        const { controller, authRepository, mailRepository } = buildController()

        const result = await controller.submitForgotPassword('budi@example.com')

        expect(result.ok).toBe(true)
        const [, code, expiresAt] = authRepository.saveOtp.mock.calls[0] as unknown as [
            string,
            string,
            Date,
        ]
        expect(code).toMatch(/^\d{6}$/)
        const ttl = expiresAt.getTime() - Date.now()
        expect(ttl).toBeGreaterThan(OTP_TTL_MS - 5_000)
        expect(ttl).toBeLessThanOrEqual(OTP_TTL_MS)
        expect(mailRepository.sendOtp).toHaveBeenCalledWith('budi@example.com', code, 10)
    })

    it('reports a failure when sending the email fails', async () => {
        const mailRepository = createMailRepository()
        mailRepository.sendOtp.mockResolvedValue(false)
        const { controller } = buildController(createAuthRepository(), mailRepository)

        const result = await controller.submitForgotPassword('budi@example.com')

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.code).toBe('INTERNAL')
    })
})

describe('AuthController.submitResetPassword (UC-03, AB-16)', () => {
    const validInput = { email: 'budi@example.com', code: '123456', newPassword: 'secret123' }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('rejects a code that is not 6 numeric digits', async () => {
        const { controller } = buildController()
        const result = await controller.submitResetPassword({ ...validInput, code: '12ab' })

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.fieldErrors?.code).toContain('6 digits')
    })

    it('applies the password policy to the new password', async () => {
        const { controller } = buildController()
        const result = await controller.submitResetPassword({ ...validInput, newPassword: 'short' })

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.fieldErrors?.newPassword).toBeDefined()
    })

    it('rejects an expired OTP', async () => {
        const authRepository = createAuthRepository()
        authRepository.findLatestOtp.mockResolvedValue(
            buildOtp({ expiresAt: new Date(Date.now() - 1_000) }),
        )
        const { controller } = buildController(authRepository)

        const result = await controller.submitResetPassword(validInput)

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error).toContain('has expired')
        expect(authRepository.updatePassword).not.toHaveBeenCalled()
    })

    it('rejects an OTP that was already used', async () => {
        const authRepository = createAuthRepository()
        authRepository.findLatestOtp.mockResolvedValue(buildOtp({ usedAt: new Date() }))
        const { controller } = buildController(authRepository)

        const result = await controller.submitResetPassword(validInput)

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(authRepository.verifyOtp).not.toHaveBeenCalled()
    })

    it('rejects an OTP after 5 wrong attempts', async () => {
        const authRepository = createAuthRepository()
        authRepository.findLatestOtp.mockResolvedValue(buildOtp({ attempts: OTP_MAX_ATTEMPTS }))
        const { controller } = buildController(authRepository)

        const result = await controller.submitResetPassword(validInput)

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error).toContain('no longer valid')
        expect(authRepository.verifyOtp).not.toHaveBeenCalled()
    })

    it('reports the remaining attempts when the code is wrong', async () => {
        const authRepository = createAuthRepository()
        authRepository.findLatestOtp.mockResolvedValue(buildOtp({ attempts: 2 }))
        authRepository.verifyOtp.mockResolvedValue({ valid: false, error: 'INVALID_CODE' })
        const { controller } = buildController(authRepository)

        const result = await controller.submitResetPassword(validInput)

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error).toContain('Attempts left: 2')
        expect(authRepository.updatePassword).not.toHaveBeenCalled()
    })

    it('declares the OTP void when wrong attempts reach the limit', async () => {
        const authRepository = createAuthRepository()
        authRepository.findLatestOtp.mockResolvedValue(buildOtp({ attempts: OTP_MAX_ATTEMPTS - 1 }))
        authRepository.verifyOtp.mockResolvedValue({ valid: false, error: 'INVALID_CODE' })
        const { controller } = buildController(authRepository)

        const result = await controller.submitResetPassword(validInput)

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error).toContain('no longer valid')
    })

    it('updates the password and marks the OTP as used when the code is correct', async () => {
        const authRepository = createAuthRepository()
        authRepository.findLatestOtp.mockResolvedValue(buildOtp())
        const { controller } = buildController(authRepository)

        const result = await controller.submitResetPassword(validInput)

        expect(result.ok).toBe(true)
        expect(authRepository.updatePassword).toHaveBeenCalledWith('user-1', 'secret123', 'otp-1')
    })
})

describe('AuthController.handleLogout (UC-04)', () => {
    it('ends the session', async () => {
        const { controller, authRepository } = buildController()
        const result = await controller.handleLogout()

        expect(result.ok).toBe(true)
        expect(authRepository.deleteSession).toHaveBeenCalledOnce()
    })
})

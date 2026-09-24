import { randomInt } from 'node:crypto'
import { z } from 'zod'
import { AuthRepository } from '../models/repositories/authRepository.ts'
import { MailRepository } from '../models/repositories/mailRepository.ts'
import { fail, ok } from '../utils/actionResult.ts'
import {
    OTP_LENGTH,
    OTP_MAX_ATTEMPTS,
    OTP_MAX_REQUESTS_PER_WINDOW,
    OTP_REQUEST_WINDOW_MS,
    OTP_RESEND_COOLDOWN_MS,
    OTP_TTL_MINUTES,
    OTP_TTL_MS,
    PASSWORD_MIN_LENGTH,
    SESSION_DURATION_MS,
    hasLetterAndDigit,
} from '../utils/authPolicy.ts'
import type { ActionResult } from '../types/actionResult.ts'
import type { SessionUser } from '../types/auth/sessionUser.ts'
import type { LoginInput } from '../types/inputs/loginInput.ts'
import type { RegisterInput } from '../types/inputs/registerInput.ts'
import type { ResetPasswordInput } from '../types/inputs/resetPasswordInput.ts'

// UC-01 to UC-04. C-2: all validation, the OTP and session policy, and the
// translation of errors into user messages live here.

const emailSchema = z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Invalid email format.')
    .transform((value) => value.toLowerCase())

// Indonesian contact number: digits, may start with + and contain spaces or hyphens.
const contactNumberSchema = z
    .string()
    .trim()
    .min(1, 'Contact number is required.')
    .regex(/^\+?[0-9][0-9\s-]{7,19}$/, 'Invalid contact number format.')

const passwordSchema = z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
    .refine(hasLetterAndDigit, 'Password must contain both letters and numbers.')

const registerSchema = z.object({
    name: z.string().trim().min(1, 'Full name is required.'),
    email: emailSchema,
    contactNumber: contactNumberSchema,
    password: passwordSchema,
})

const loginSchema = z.object({
    email: z.string().trim().min(1, 'Email is required.'),
    password: z.string().min(1, 'Password is required.'),
})

const forgotPasswordSchema = z.object({
    email: emailSchema,
})

const resetPasswordSchema = z.object({
    email: emailSchema,
    code: z
        .string()
        .trim()
        .min(1, 'OTP code is required.')
        .regex(new RegExp(`^[0-9]{${OTP_LENGTH}}$`), `The OTP code must be ${OTP_LENGTH} digits.`),
    newPassword: passwordSchema,
})

const INCOMPLETE_FORM_MESSAGE = 'Please complete all fields.'

function collectFieldErrors(error: z.ZodError): Record<string, string> {
    const fieldErrors: Record<string, string> = {}
    for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return fieldErrors
}

function generateOtpCode(): string {
    const max = 10 ** OTP_LENGTH
    return randomInt(0, max).toString().padStart(OTP_LENGTH, '0')
}

export class AuthController {
    constructor(
        private readonly authRepository = new AuthRepository(),
        private readonly mailRepository = new MailRepository(),
    ) {}

    // Single identity path for route guards and other controllers (05 section 4.8).
    public async getCurrentUser(): Promise<SessionUser | null> {
        return this.authRepository.getSessionUser()
    }

    // UC-01. F_UNAIREC_01_01 to 01_04.
    public async submitRegister(input: RegisterInput): Promise<ActionResult<SessionUser>> {
        const parsed = registerSchema.safeParse(input)
        if (!parsed.success) {
            return fail(INCOMPLETE_FORM_MESSAGE, 'VALIDATION', collectFieldErrors(parsed.error))
        }

        const { user, error } = await this.authRepository.register(parsed.data)
        if (error === 'EMAIL_TAKEN') {
            return fail('This email is already registered.', 'CONFLICT', { email: 'This email is already registered.' })
        }
        if (!user) {
            return fail('Registration failed. Please try again.', 'INTERNAL')
        }

        const sessionCreated = await this.authRepository.createSession(
            user.id,
            new Date(Date.now() + SESSION_DURATION_MS),
        )
        if (!sessionCreated) {
            return fail('Your account was created, but signing you in failed. Please sign in again.', 'INTERNAL')
        }

        return ok(user)
    }

    // UC-02. F_UNAIREC_02_01 to 02_03 and 02_06.
    public async submitLogin(input: LoginInput): Promise<ActionResult<SessionUser>> {
        const parsed = loginSchema.safeParse(input)
        if (!parsed.success) {
            return fail('Please enter your email and password.', 'VALIDATION', collectFieldErrors(parsed.error))
        }

        const email = parsed.data.email.toLowerCase()
        const { user } = await this.authRepository.verifyCredentials(email, parsed.data.password)
        if (!user) {
            return fail('Incorrect email or password.', 'UNAUTHENTICATED')
        }

        const sessionCreated = await this.authRepository.createSession(
            user.id,
            new Date(Date.now() + SESSION_DURATION_MS),
        )
        if (!sessionCreated) {
            return fail('Could not create a session. Please try again.', 'INTERNAL')
        }

        return ok(user)
    }

    // UC-03 step 3. F_UNAIREC_03_01, 03_02, and 03_08.
    public async submitForgotPassword(email: string): Promise<ActionResult<undefined>> {
        const parsed = forgotPasswordSchema.safeParse({ email })
        if (!parsed.success) {
            return fail('Please enter your email.', 'VALIDATION', collectFieldErrors(parsed.error))
        }

        const user = await this.authRepository.findByEmail(parsed.data.email)
        if (!user) {
            return fail('Email not found.', 'NOT_FOUND', { email: 'Email not found.' })
        }

        const now = Date.now()
        const latestOtp = await this.authRepository.findLatestOtp(user.id)
        if (latestOtp && now - latestOtp.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
            const waitSeconds = Math.ceil(
                (OTP_RESEND_COOLDOWN_MS - (now - latestOtp.createdAt.getTime())) / 1000,
            )
            return fail(`Too many requests. Please try again in ${waitSeconds} seconds.`, 'RATE_LIMITED')
        }

        const recentCount = await this.authRepository.countRecentOtps(
            user.id,
            new Date(now - OTP_REQUEST_WINDOW_MS),
        )
        if (recentCount >= OTP_MAX_REQUESTS_PER_WINDOW) {
            return fail('Too many requests. Please try again in an hour.', 'RATE_LIMITED')
        }

        const code = generateOtpCode()
        const saved = await this.authRepository.saveOtp(user.id, code, new Date(now + OTP_TTL_MS))
        if (!saved) {
            return fail('Could not create an OTP code. Please try again.', 'INTERNAL')
        }

        const sent = await this.mailRepository.sendOtp(user.email, code, OTP_TTL_MINUTES)
        if (!sent) {
            return fail('Could not send the OTP code. Please try again.', 'INTERNAL')
        }

        return ok()
    }

    // UC-03 step 5. F_UNAIREC_03_03 to 03_07.
    public async submitResetPassword(input: ResetPasswordInput): Promise<ActionResult<undefined>> {
        const parsed = resetPasswordSchema.safeParse(input)
        if (!parsed.success) {
            return fail(INCOMPLETE_FORM_MESSAGE, 'VALIDATION', collectFieldErrors(parsed.error))
        }

        const user = await this.authRepository.findByEmail(parsed.data.email)
        if (!user) {
            return fail('Email not found.', 'NOT_FOUND', { email: 'Email not found.' })
        }

        const otp = await this.authRepository.findLatestOtp(user.id)
        if (!otp || otp.usedAt !== null) {
            return fail('This OTP code is invalid. Please request a new code.', 'VALIDATION')
        }
        if (otp.expiresAt.getTime() <= Date.now()) {
            return fail('This OTP code has expired. Please request a new code.', 'VALIDATION')
        }
        if (otp.attempts >= OTP_MAX_ATTEMPTS) {
            return fail('This OTP code is no longer valid. Please request a new code.', 'VALIDATION')
        }

        const verification = await this.authRepository.verifyOtp(otp.id, parsed.data.code)
        if (!verification.valid) {
            const attemptsUsed = otp.attempts + 1
            if (attemptsUsed >= OTP_MAX_ATTEMPTS) {
                return fail('This OTP code is no longer valid. Please request a new code.', 'VALIDATION')
            }
            const remaining = OTP_MAX_ATTEMPTS - attemptsUsed
            return fail(`Incorrect OTP code. Attempts left: ${remaining}.`, 'VALIDATION', {
                code: 'Incorrect OTP code.',
            })
        }

        const updated = await this.authRepository.updatePassword(user.id, parsed.data.newPassword, otp.id)
        if (!updated) {
            return fail('Could not update the password. Please try again.', 'INTERNAL')
        }

        return ok()
    }

    // UC-04.
    public async handleLogout(): Promise<ActionResult<undefined>> {
        const deleted = await this.authRepository.deleteSession()
        if (!deleted) return fail('Could not sign out. Please try again.', 'INTERNAL')
        return ok()
    }
}

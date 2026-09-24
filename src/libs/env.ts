import { z } from 'zod'

// L-2: every credential and endpoint comes from environment variables.
// Validation runs per group on first use, not on module import,
// so unit tests that do not touch infrastructure can run without a .env file.

const databaseSchema = z.object({
    DATABASE_URL: z.string().min(1),
})

const storageSchema = z.object({
    SUPABASE_URL: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})

const smtpSchema = z.object({
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
    SMTP_USER: z.string().min(1),
    SMTP_PASSWORD: z.string().min(1),
    SMTP_FROM: z.string().min(1),
})

const adminSeedSchema = z.object({
    ADMIN_NAME: z.string().min(1),
    ADMIN_EMAIL: z.string().min(1),
    ADMIN_PASSWORD: z.string().min(1),
})

export type DatabaseEnv = z.infer<typeof databaseSchema>
export type StorageEnv = z.infer<typeof storageSchema>
export type SmtpEnv = z.infer<typeof smtpSchema>
export type AdminSeedEnv = z.infer<typeof adminSeedSchema>

function parseOrThrow<T>(schema: z.ZodType<T>, group: string): T {
    const result = schema.safeParse(process.env)
    if (!result.success) {
        const missing = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
        throw new Error(`Missing or invalid environment variables for ${group}: ${missing}`)
    }
    return result.data
}

let databaseEnv: DatabaseEnv | null = null
let storageEnv: StorageEnv | null = null
let adminSeedEnv: AdminSeedEnv | null = null

export function getDatabaseEnv(): DatabaseEnv {
    databaseEnv ??= parseOrThrow(databaseSchema, 'database')
    return databaseEnv
}

export function getStorageEnv(): StorageEnv {
    storageEnv ??= parseOrThrow(storageSchema, 'storage')
    return storageEnv
}

export function getAdminSeedEnv(): AdminSeedEnv {
    adminSeedEnv ??= parseOrThrow(adminSeedSchema, 'admin seed')
    return adminSeedEnv
}

// KS-07: SMTP may be empty during development; the OTP is printed to the console.
// In production the SMTP configuration must be complete.
export function getSmtpEnv(): SmtpEnv | null {
    const result = smtpSchema.safeParse(process.env)
    if (result.success) return result.data
    if (isProduction()) {
        throw new Error('SMTP configuration is required in production')
    }
    return null
}

export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
}

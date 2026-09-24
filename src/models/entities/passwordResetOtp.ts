export interface PasswordResetOtp {
    id: string
    userId: string
    codeHash: string
    expiresAt: Date
    usedAt: Date | null
    attempts: number
    createdAt: Date
}

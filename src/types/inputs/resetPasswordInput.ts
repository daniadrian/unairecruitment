// Payload for UC-03 Forgot Password, the OTP verification and password change step.
export interface ResetPasswordInput {
    email: string
    code: string
    newPassword: string
}

import { sendMail } from '../../libs/mailer.ts'

// R-1: sending email is an outbound call, so it is wrapped in a repository.
// The message is short and contains no sensitive data other than the OTP code itself.

export class MailRepository {
    public async sendOtp(email: string, code: string, validForMinutes: number): Promise<boolean> {
        try {
            await sendMail({
                to: email,
                subject: 'UNAI Recruitment Password Reset Code',
                text: [
                    'Your one-time code to reset your password is:',
                    '',
                    code,
                    '',
                    `The code is valid for ${validForMinutes} minutes and can only be used once.`,
                    'If you did not request a password reset, you can ignore this email.',
                ].join('\n'),
            })
            return true
        } catch (error) {
            console.error('Error sending OTP email:', error)
            return false
        }
    }
}

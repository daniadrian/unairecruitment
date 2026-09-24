import 'dotenv/config'
import { AuthController } from '../src/controllers/authController.ts'
import { getPrismaClient } from '../src/libs/prisma.ts'
import { verifyMailTransport } from '../src/libs/mailer.ts'

// End-to-end SMTP check through AuthController.submitForgotPassword (UC-03, KS-07): verifies
// the SMTP connection and authentication, then sends a real OTP to the seeded admin account's
// email. This is the actual code path UC-03 uses, not a standalone SMTP test.
//
// The output never prints credentials or the OTP code.

type Check = { name: string; passed: boolean; detail: string }
const checks: Check[] = []

function record(name: string, passed: boolean, detail: string): void {
    checks.push({ name, passed, detail })
    console.info(`${passed ? 'OK   ' : 'FAIL '}  ${name}: ${detail}`)
}

async function main(): Promise<void> {
    const prisma = getPrismaClient()

    try {
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { email: true } })
        if (!admin) {
            record('admin account', false, 'no admin account; run db:seed first')
            return
        }

        const smtpConfigured = Boolean(
            process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD,
        )
        if (!smtpConfigured) {
            record(
                'SMTP configuration',
                false,
                'SMTP_* is empty; the OTP is printed to the console (KS-07) instead of being sent',
            )
            return
        }

        const verified = await verifyMailTransport()
        record(
            'SMTP connection and authentication',
            verified,
            verified ? 'transporter.verify() succeeded' : 'transporter.verify() failed, see the log above',
        )
        if (!verified) return

        const result = await new AuthController().submitForgotPassword(admin.email)
        record(
            'send a real OTP (UC-03)',
            result.ok,
            result.ok
                ? `sent to ${admin.email}; check its inbox`
                : `${result.error}${result.code === 'RATE_LIMITED' ? ' (expected when rerun within 60 seconds, AB-16)' : ''}`,
        )
    } finally {
        await prisma.$disconnect()
    }

    if (checks.some((check) => !check.passed)) process.exitCode = 1
}

main().catch((error) => {
    console.error('SMTP check failed:', error)
    process.exit(1)
})

import nodemailer, { type Transporter } from 'nodemailer'
import { getSmtpEnv } from './env.ts'

// L-1 and KS-07: Nodemailer transport for Gmail SMTP.
// When SMTP is not configured (allowed only during development), the transport is a
// jsonTransport, so messages are printed to the console and never sent.

export type MailMessage = {
    to: string
    subject: string
    text: string
}

let transporter: Transporter | null = null
let usesRealSmtp = false

function getTransporter(): Transporter {
    if (!transporter) {
        const smtp = getSmtpEnv()
        if (smtp) {
            transporter = nodemailer.createTransport({
                host: smtp.SMTP_HOST,
                port: smtp.SMTP_PORT,
                secure: smtp.SMTP_PORT === 465,
                auth: { user: smtp.SMTP_USER, pass: smtp.SMTP_PASSWORD },
            })
            usesRealSmtp = true
        } else {
            transporter = nodemailer.createTransport({ jsonTransport: true })
            usesRealSmtp = false
        }
    }
    return transporter
}

// Checks the SMTP connection and authentication without sending a message. Used by `scripts/checkSmtp.ts`
// before trying to send a real OTP.
export async function verifyMailTransport(): Promise<boolean> {
    try {
        await getTransporter().verify()
        return true
    } catch (error) {
        console.error('Error verifying mail transport:', error)
        return false
    }
}

// Sending is always awaited before the action finishes (06 section 4: Vercel stops
// background work after the response is sent).
export async function sendMail(message: MailMessage): Promise<void> {
    const transport = getTransporter()
    const from = process.env.SMTP_FROM ?? 'no-reply@unairecruitment.local'
    const info = await transport.sendMail({ from, ...message })

    if (!usesRealSmtp) {
        console.info('[mailer] SMTP not configured, message not sent:', info.message?.toString())
    }
}

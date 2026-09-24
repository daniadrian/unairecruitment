'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { useEffect, useState, type FormEvent } from 'react'
import { OTP_LENGTH, OTP_RESEND_COOLDOWN_MS, OTP_TTL_MINUTES, OTP_TTL_MS } from '../../../utils/authPolicy.ts'
import { cn } from '../../../utils/cn.ts'
import { maskEmail } from '../../../utils/textFormat.ts'
import ContentSheet from '../brand/contentSheet.tsx'
import HeroBand from '../brand/heroBand.tsx'
import Notice from '../feedback/notice.tsx'
import { fieldErrorOf, formErrorOf } from '../forms/actionErrors.ts'
import { useFormAction } from '../forms/useFormAction.ts'
import { Button } from '../ui/button.tsx'
import FieldError from '../ui/fieldError.tsx'
import FieldLabel from '../ui/fieldLabel.tsx'
import { Input } from '../ui/input.tsx'
import { InputOtp, InputOtpSlot } from '../ui/inputOtp.tsx'
import PasswordInput from './passwordInput.tsx'
import type { FormAction } from '../../../types/formAction.ts'

// Screen 05, UC-03: one route, two steps. Step 1 requests a code by email; step 2 takes the
// 6-digit code and a new password. The countdowns only mirror the policy (AB-16: 10-minute
// codes, 60 seconds between requests); the controller enforces it and its messages are shown.

function formatClock(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function StepMarker({ state, number }: { state: 'done' | 'current' | 'upcoming'; number: number }) {
    if (state === 'done') {
        return (
            <span className="grid size-6 place-items-center rounded-full bg-white">
                <Check aria-hidden="true" size={13} strokeWidth={3} className="text-[#2A5F96]" />
            </span>
        )
    }
    return (
        <span
            className={cn(
                'grid size-6 place-items-center rounded-full border-2 font-mono text-xs font-semibold',
                state === 'current' ? 'border-white text-white' : 'border-white/50 text-white/70',
            )}
        >
            {number}
        </span>
    )
}

export default function ForgotPasswordFlow({
    requestCodeAction,
    resetPasswordAction,
}: {
    requestCodeAction: FormAction<undefined>
    resetPasswordAction: FormAction<undefined>
}) {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [sentTo, setSentTo] = useState<string | null>(null)
    const [sentAt, setSentAt] = useState<number | null>(null)
    const [now, setNow] = useState(() => Date.now())
    const [code, setCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [mismatch, setMismatch] = useState(false)

    const request = useFormAction(requestCodeAction, () => {
        setSentTo(email.trim())
        setSentAt(Date.now())
        setNow(Date.now())
        setCode('')
    })
    const reset = useFormAction(resetPasswordAction, () => {
        router.replace('/login?reset=1')
    })

    useEffect(() => {
        if (sentAt === null) return
        const timer = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(timer)
    }, [sentAt])

    const codeSent = sentTo !== null && sentAt !== null
    const validFor = codeSent ? sentAt + OTP_TTL_MS - now : 0
    const resendIn = codeSent ? sentAt + OTP_RESEND_COOLDOWN_MS - now : 0

    function requestCode(targetEmail: string) {
        const formData = new FormData()
        formData.set('email', targetEmail)
        request.submit(formData)
    }

    function handleRequest(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        requestCode(email)
    }

    function handleReset(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!sentTo) return
        if (newPassword !== confirmPassword) {
            setMismatch(true)
            return
        }
        setMismatch(false)
        const formData = new FormData()
        formData.set('email', sentTo)
        formData.set('code', code)
        formData.set('newPassword', newPassword)
        reset.submit(formData)
    }

    function changeEmail() {
        setSentTo(null)
        setSentAt(null)
        setCode('')
        document.getElementById('forgot-email')?.focus()
    }

    const requestError = formErrorOf(request.state)
    const requestEmailError = fieldErrorOf(request.state, 'email')
    const resetError = formErrorOf(reset.state)
    const codeError = fieldErrorOf(reset.state, 'code')
    const passwordError = fieldErrorOf(reset.state, 'newPassword')

    return (
        <>
            <HeroBand tone="public" className="px-4 pt-8 pb-16 sm:px-6 lg:px-24 lg:pt-11 lg:pb-[100px]">
                <div className="mx-auto flex w-full max-w-[1008px] flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="flex flex-col gap-2">
                        <h1 className="font-display text-[30px] leading-[1.12] font-medium tracking-[-0.02em] text-white lg:text-[38px]">
                            Reset your password
                        </h1>
                        <p className="text-base leading-[1.55] font-medium text-hero-lead">
                            We{'’'}ll send a {OTP_LENGTH}-digit code to your email. The code is valid for{' '}
                            {OTP_TTL_MINUTES} minutes.
                        </p>
                    </div>
                    <ol aria-label="Steps" className="flex gap-7 text-sm text-white">
                        <li className="flex items-center gap-2" aria-current={codeSent ? undefined : 'step'}>
                            <StepMarker state={codeSent ? 'done' : 'current'} number={1} />
                            <span className={cn(!codeSent && 'font-semibold')}>Request code</span>
                        </li>
                        <li className="flex items-center gap-2" aria-current={codeSent ? 'step' : undefined}>
                            <StepMarker state={codeSent ? 'current' : 'upcoming'} number={2} />
                            <span className={cn(codeSent ? 'font-semibold' : 'text-white/80')}>
                                Code &amp; new password
                            </span>
                        </li>
                    </ol>
                </div>
            </HeroBand>

            <div className="relative -mt-10 px-3 pb-16 sm:px-6 lg:-mt-16 lg:px-24 lg:pb-[72px]">
                <div className="mx-auto grid w-full max-w-[1008px] items-start gap-6 lg:grid-cols-2 lg:gap-8">
                    <ContentSheet rule={codeSent ? 'quiet' : 'action'}>
                        <form
                            noValidate
                            onSubmit={handleRequest}
                            className="flex flex-col gap-[18px] p-5 sm:p-7"
                        >
                            <span
                                className={cn(
                                    'font-mono text-[12.5px] font-medium',
                                    codeSent ? 'text-ink-faint' : 'text-link',
                                )}
                            >
                                {codeSent ? 'Step 1 of 2 · done' : 'Step 1 of 2'}
                            </span>
                            <h2 className="font-display text-[22px] font-medium text-ink">
                                Request an OTP code
                            </h2>
                            <p className="text-[15px] leading-[1.55] text-ink-soft">
                                Enter the email you used to create your account.
                            </p>
                            {!codeSent && requestError && !requestEmailError ? (
                                <Notice tone="error">{requestError}</Notice>
                            ) : null}
                            <div className="flex flex-col gap-1.5">
                                <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
                                <Input
                                    id="forgot-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    inputMode="email"
                                    spellCheck={false}
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    readOnly={codeSent}
                                    className="h-11"
                                    aria-invalid={requestEmailError ? true : undefined}
                                    aria-describedby={requestEmailError ? 'forgot-email-error' : undefined}
                                />
                                <FieldError id="forgot-email-error">{requestEmailError}</FieldError>
                            </div>
                            {codeSent ? null : (
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={request.isPending}
                                    aria-disabled={request.isPending}
                                >
                                    {request.isPending ? 'Sending…' : 'Send OTP code'}
                                </Button>
                            )}
                            <Link href="/login" className="self-start text-sm font-semibold">
                                Back to sign in
                            </Link>
                        </form>
                    </ContentSheet>

                    <ContentSheet
                        rule={codeSent ? 'action' : 'quiet'}
                        className={cn(!codeSent && 'opacity-70')}
                    >
                        <form
                            noValidate
                            onSubmit={handleReset}
                            className="flex flex-col gap-[18px] p-5 sm:p-7"
                        >
                            <span
                                className={cn(
                                    'font-mono text-[12.5px] font-medium',
                                    codeSent ? 'text-link' : 'text-ink-faint',
                                )}
                            >
                                Step 2 of 2
                            </span>
                            {codeSent ? (
                                <Notice tone="success">
                                    Code sent to <b>{maskEmail(sentTo)}</b>. Check your spam folder too.
                                </Notice>
                            ) : (
                                <h2 className="font-display text-[22px] font-medium text-ink">
                                    Code and new password
                                </h2>
                            )}
                            {codeSent && requestError ? <Notice tone="error">{requestError}</Notice> : null}
                            {resetError ? <Notice tone="error">{resetError}</Notice> : null}

                            <div className="flex flex-col gap-2">
                                <div className="flex items-baseline justify-between gap-3">
                                    <FieldLabel htmlFor="otp-code">OTP code</FieldLabel>
                                    {codeSent ? (
                                        <span className="font-mono text-[13px] font-semibold text-ink">
                                            {validFor > 0
                                                ? `Valid for ${formatClock(validFor)}`
                                                : 'Code expired'}
                                        </span>
                                    ) : null}
                                </div>
                                <InputOtp
                                    id="otp-code"
                                    name="code"
                                    maxLength={OTP_LENGTH}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    value={code}
                                    onChange={setCode}
                                    disabled={!codeSent}
                                    aria-invalid={codeError ? true : undefined}
                                    aria-describedby={codeError ? 'otp-code-error' : undefined}
                                >
                                    <div className="flex gap-2">
                                        {Array.from({ length: OTP_LENGTH }, (_, index) => (
                                            <InputOtpSlot
                                                key={index}
                                                index={index}
                                                invalid={Boolean(codeError)}
                                            />
                                        ))}
                                    </div>
                                </InputOtp>
                                <FieldError id="otp-code-error">{codeError}</FieldError>
                                {codeSent ? (
                                    <p className="text-[13.5px] text-ink-soft" aria-live="polite">
                                        Didn{'’'}t get a code?{' '}
                                        {resendIn > 0 ? (
                                            <>
                                                Resend in{' '}
                                                <span className="font-mono">{formatClock(resendIn)}</span>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => requestCode(sentTo)}
                                                disabled={request.isPending}
                                                className="cursor-pointer font-semibold text-link underline underline-offset-2"
                                            >
                                                {request.isPending ? 'Sending…' : 'Resend code'}
                                            </button>
                                        )}
                                    </p>
                                ) : null}
                            </div>

                            <div className="grid gap-3.5 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <FieldLabel htmlFor="new-password">New password</FieldLabel>
                                    <PasswordInput
                                        id="new-password"
                                        autoComplete="new-password"
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                        disabled={!codeSent}
                                        aria-invalid={passwordError ? true : undefined}
                                        aria-describedby={passwordError ? 'new-password-error' : undefined}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
                                    <PasswordInput
                                        id="confirm-password"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(event) => {
                                            setConfirmPassword(event.target.value)
                                            setMismatch(false)
                                        }}
                                        disabled={!codeSent}
                                        aria-invalid={mismatch ? true : undefined}
                                        aria-describedby={mismatch ? 'confirm-password-error' : undefined}
                                    />
                                </div>
                            </div>
                            <FieldError id="new-password-error">{passwordError}</FieldError>
                            <FieldError id="confirm-password-error">
                                {mismatch ? 'The two passwords do not match.' : null}
                            </FieldError>

                            <Button
                                type="submit"
                                size="lg"
                                disabled={!codeSent || reset.isPending}
                                aria-disabled={!codeSent || reset.isPending}
                            >
                                {reset.isPending ? 'Saving…' : 'Save new password'}
                            </Button>
                            {codeSent ? (
                                <button
                                    type="button"
                                    onClick={changeEmail}
                                    className="cursor-pointer self-start text-sm font-semibold text-link underline underline-offset-2"
                                >
                                    Change email
                                </button>
                            ) : null}
                        </form>
                    </ContentSheet>
                </div>
            </div>
        </>
    )
}

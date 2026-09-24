'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ContentSheet from '../brand/contentSheet.tsx'
import Notice from '../feedback/notice.tsx'
import { fieldErrorOf, formErrorOf } from '../forms/actionErrors.ts'
import { useFormAction } from '../forms/useFormAction.ts'
import { Button } from '../ui/button.tsx'
import FieldError from '../ui/fieldError.tsx'
import FieldHint from '../ui/fieldHint.tsx'
import FieldLabel from '../ui/fieldLabel.tsx'
import { Input } from '../ui/input.tsx'
import PasswordInput from './passwordInput.tsx'
import PasswordRules from './passwordRules.tsx'
import type { SessionUser } from '../../../types/auth/sessionUser.ts'
import type { FormAction } from '../../../types/formAction.ts'

// Screen 04 form, UC-01. An email that is already registered gets a way out (sign in or reset
// the password); the password rules tick as they are met. The account is an applicant account
// (AB-08). After signing up the page is refreshed with the new session, and the screen sends the
// applicant back to where they started.
export default function RegisterForm({
    action,
    nextPath,
}: {
    action: FormAction<SessionUser>
    nextPath: string | null
}) {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const { state, isPending, handleSubmit } = useFormAction(action, () => {
        router.refresh()
    })

    const formError = formErrorOf(state)
    const errors = {
        name: fieldErrorOf(state, 'name'),
        email: fieldErrorOf(state, 'email'),
        contactNumber: fieldErrorOf(state, 'contactNumber'),
        password: fieldErrorOf(state, 'password'),
    }
    const emailTaken = state !== null && !state.ok && state.code === 'CONFLICT'
    const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'

    return (
        <ContentSheet rule="action" className="w-full">
            <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-[18px] p-5 sm:p-7">
                <h2 className="font-display text-2xl font-medium text-ink">Create account</h2>

                {formError && !emailTaken ? <Notice tone="error">{formError}</Notice> : null}

                <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="register-name">Full name</FieldLabel>
                    <Input
                        id="register-name"
                        name="name"
                        autoComplete="name"
                        className="h-11"
                        aria-invalid={errors.name ? true : undefined}
                        aria-describedby={errors.name ? 'register-name-error' : undefined}
                    />
                    <FieldError id="register-name-error">{errors.name}</FieldError>
                </div>

                <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="register-email">Email</FieldLabel>
                    <Input
                        id="register-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        spellCheck={false}
                        className="h-11"
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={errors.email ? 'register-email-error' : undefined}
                    />
                    {errors.email ? (
                        <FieldError id="register-email-error">
                            {errors.email}
                            {emailTaken ? (
                                <span className="font-normal">
                                    {' '}
                                    <Link href={loginHref} className="font-semibold">
                                        Sign in
                                    </Link>{' '}
                                    or{' '}
                                    <Link href="/forgot-password" className="font-semibold">
                                        reset your password
                                    </Link>
                                    .
                                </span>
                            ) : null}
                        </FieldError>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="register-contact">Contact number</FieldLabel>
                    <Input
                        id="register-contact"
                        name="contactNumber"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="+62 812 3456 7890"
                        className="h-11"
                        aria-invalid={errors.contactNumber ? true : undefined}
                        aria-describedby={
                            errors.contactNumber ? 'register-contact-error' : 'register-contact-hint'
                        }
                    />
                    {errors.contactNumber ? (
                        <FieldError id="register-contact-error">{errors.contactNumber}</FieldError>
                    ) : (
                        <FieldHint id="register-contact-hint">
                            An active number, including the country code, so the team can reach you.
                        </FieldHint>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="register-password">Password</FieldLabel>
                    <PasswordInput
                        id="register-password"
                        name="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        aria-invalid={errors.password ? true : undefined}
                        aria-describedby={
                            errors.password
                                ? 'register-password-error register-password-rules'
                                : 'register-password-rules'
                        }
                    />
                    <FieldError id="register-password-error">{errors.password}</FieldError>
                    <PasswordRules id="register-password-rules" value={password} />
                </div>

                <Button type="submit" size="lg" disabled={isPending} aria-disabled={isPending}>
                    {isPending ? 'Creating account…' : 'Create account'}
                </Button>

                <p className="border-t border-hairline pt-3.5 text-[14.5px] text-ink-soft">
                    Already have an account?{' '}
                    <Link href={loginHref} className="font-semibold">
                        Sign in
                    </Link>
                </p>
            </form>
        </ContentSheet>
    )
}

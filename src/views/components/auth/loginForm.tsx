'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CircleCheck } from 'lucide-react'
import ContentSheet from '../brand/contentSheet.tsx'
import Notice from '../feedback/notice.tsx'
import { fieldErrorOf, formErrorOf } from '../forms/actionErrors.ts'
import { useFormAction } from '../forms/useFormAction.ts'
import { Button } from '../ui/button.tsx'
import FieldError from '../ui/fieldError.tsx'
import FieldLabel from '../ui/fieldLabel.tsx'
import { Input } from '../ui/input.tsx'
import PasswordInput from './passwordInput.tsx'
import type { SessionUser } from '../../../types/auth/sessionUser.ts'
import type { FormAction } from '../../../types/formAction.ts'

// Screen 03 form, UC-02. After a successful sign-in the page is refreshed with the new session:
// the sign-in screen then sends the user on (C-5: the view decides) to the page they came from or
// the home page of their role, and the shared navigation bar re-renders as signed in.
export default function LoginForm({
    action,
    nextPath,
    passwordReset,
}: {
    action: FormAction<SessionUser>
    nextPath: string | null
    passwordReset: boolean
}) {
    const router = useRouter()
    const { state, isPending, handleSubmit } = useFormAction(action, () => {
        router.refresh()
    })

    const formError = formErrorOf(state)
    const emailError = fieldErrorOf(state, 'email')
    const passwordError = fieldErrorOf(state, 'password')
    const registerHref = nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : '/register'

    return (
        <ContentSheet rule="action" className="w-full">
            <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-[18px] p-5 sm:p-7">
                <h2 className="font-display text-2xl font-medium text-ink">Sign in</h2>

                {passwordReset && !state ? (
                    <Notice tone="success" icon={CircleCheck}>
                        Your password has been changed. Sign in with your new password.
                    </Notice>
                ) : null}
                {formError ? <Notice tone="error">{formError}</Notice> : null}

                <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <Input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        spellCheck={false}
                        className="h-11"
                        aria-invalid={emailError ? true : undefined}
                        aria-describedby={emailError ? 'login-email-error' : undefined}
                    />
                    <FieldError id="login-email-error">{emailError}</FieldError>
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                        <FieldLabel htmlFor="login-password">Password</FieldLabel>
                        <Link href="/forgot-password" className="text-[13.5px] font-semibold">
                            Forgot password?
                        </Link>
                    </div>
                    <PasswordInput
                        id="login-password"
                        name="password"
                        autoComplete="current-password"
                        aria-invalid={passwordError ? true : undefined}
                        aria-describedby={passwordError ? 'login-password-error' : undefined}
                    />
                    <FieldError id="login-password-error">{passwordError}</FieldError>
                </div>

                <Button type="submit" size="lg" disabled={isPending} aria-disabled={isPending}>
                    {isPending ? 'Signing in…' : 'Sign in'}
                </Button>

                <p className="border-t border-hairline pt-3.5 text-[14.5px] text-ink-soft">
                    No account yet?{' '}
                    <Link href={registerHref} className="font-semibold">
                        Create account
                    </Link>
                </p>
            </form>
        </ContentSheet>
    )
}

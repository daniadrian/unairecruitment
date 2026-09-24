import { redirect } from 'next/navigation'
import AuthFrame from '../components/auth/authFrame.tsx'
import LoginForm from '../components/auth/loginForm.tsx'
import { getViewer } from '../components/guards/getViewer.ts'
import { homePathFor } from '../components/guards/homePath.ts'
import type { SessionUser } from '../../types/auth/sessionUser.ts'
import type { FormAction } from '../../types/formAction.ts'

// Screen 03, UC-02. Signed-in users have nothing to do here and go to their home page.
export default async function LoginScreen({
    loginAction,
    nextPath,
    passwordReset,
}: {
    loginAction: FormAction<SessionUser>
    nextPath: string | null
    passwordReset: boolean
}) {
    const viewer = await getViewer()
    if (viewer) redirect(nextPath ?? homePathFor(viewer.role))

    return (
        <AuthFrame
            intro={
                <>
                    <h1 className="font-display text-[28px] leading-[1.12] font-medium tracking-[-0.02em] text-white lg:text-[40px]">
                        Sign in to continue your application.
                    </h1>
                    <p className="text-base leading-[1.6] font-medium text-hero-lead lg:text-[17px]">
                        Once signed in, you can apply to open roles and track the status of each application
                        {' — '}from Pending to the final decision.
                    </p>
                    <div className="mt-3 flex items-center gap-3 border-t border-white/35 pt-4 text-sm text-hero-soft">
                        <span className="shrink-0 rounded-sm border border-white/50 px-[7px] py-[3px] font-mono text-[13px] font-semibold text-white">
                            Ref. no.
                        </span>
                        Each application gets a reference number. You and the recruitment team see the same
                        one.
                    </div>
                </>
            }
        >
            <LoginForm action={loginAction} nextPath={nextPath} passwordReset={passwordReset} />
        </AuthFrame>
    )
}

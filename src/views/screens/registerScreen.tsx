import { redirect } from 'next/navigation'
import AuthFrame from '../components/auth/authFrame.tsx'
import RegisterForm from '../components/auth/registerForm.tsx'
import { getViewer } from '../components/guards/getViewer.ts'
import { homePathFor } from '../components/guards/homePath.ts'
import type { SessionUser } from '../../types/auth/sessionUser.ts'
import type { FormAction } from '../../types/formAction.ts'

const STEPS = [
    'Create an account',
    'Choose a role and fill in the form',
    'Track its status in My applications',
]

// Screen 04, UC-01. The three steps of applying are a real sequence, so they are numbered.
// Signed-in users (including right after signing up) go on to where they started, or home.
export default async function RegisterScreen({
    registerAction,
    nextPath,
}: {
    registerAction: FormAction<SessionUser>
    nextPath: string | null
}) {
    const viewer = await getViewer()
    if (viewer) redirect(nextPath ?? homePathFor(viewer.role))

    return (
        <AuthFrame
            intro={
                <>
                    <h1 className="font-display text-[28px] leading-[1.12] font-medium tracking-[-0.02em] text-white lg:text-[40px]">
                        Create one account, use it for every application.
                    </h1>
                    <p className="text-base leading-[1.6] font-medium text-hero-lead lg:text-[17px]">
                        Your account details pre-fill every application form. You can still edit them for a
                        single application.
                    </p>
                    <ol className="mt-3 border-t border-white/35 text-[15px] leading-[1.5] text-white">
                        {STEPS.map((step, index) => (
                            <li
                                key={step}
                                className={
                                    index === 0
                                        ? 'grid grid-cols-[36px_1fr] border-b border-white/25 py-3 font-semibold'
                                        : 'grid grid-cols-[36px_1fr] border-b border-white/25 py-3 text-hero-soft'
                                }
                            >
                                <span className="pt-0.5 font-mono text-[13px]">{index + 1}</span>
                                {step}
                            </li>
                        ))}
                    </ol>
                </>
            }
        >
            <RegisterForm action={registerAction} nextPath={nextPath} />
        </AuthFrame>
    )
}

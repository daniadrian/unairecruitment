import { redirect } from 'next/navigation'
import ForgotPasswordFlow from '../components/auth/forgotPasswordFlow.tsx'
import { getViewer } from '../components/guards/getViewer.ts'
import { homePathFor } from '../components/guards/homePath.ts'
import type { FormAction } from '../../types/formAction.ts'

// Screen 05, UC-03 (AB-06, AB-16). Available to applicants and admins before they sign in.
export default async function ForgotPasswordScreen({
    requestCodeAction,
    resetPasswordAction,
}: {
    requestCodeAction: FormAction<undefined>
    resetPasswordAction: FormAction<undefined>
}) {
    const viewer = await getViewer()
    if (viewer) redirect(homePathFor(viewer.role))

    return (
        <ForgotPasswordFlow requestCodeAction={requestCodeAction} resetPasswordAction={resetPasswordAction} />
    )
}

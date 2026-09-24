import type { Metadata } from 'next'
import ForgotPasswordScreen from '../../../views/screens/forgotPasswordScreen.tsx'
import { forgotPasswordAction, resetPasswordAction } from '../../actions/authActions.ts'

export const metadata: Metadata = {
    title: 'Reset your password',
}

export default function ForgotPasswordPage() {
    return (
        <ForgotPasswordScreen
            requestCodeAction={forgotPasswordAction}
            resetPasswordAction={resetPasswordAction}
        />
    )
}

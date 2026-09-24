import type { Metadata } from 'next'
import { safeNextPath } from '../../../utils/safeNextPath.ts'
import LoginScreen from '../../../views/screens/loginScreen.tsx'
import { loginAction } from '../../actions/authActions.ts'

export const metadata: Metadata = {
    title: 'Sign in',
}

type Props = { searchParams: Promise<{ next?: string | string[]; reset?: string | string[] }> }

export default async function LoginPage({ searchParams }: Props) {
    const { next, reset } = await searchParams
    return (
        <LoginScreen loginAction={loginAction} nextPath={safeNextPath(next)} passwordReset={reset === '1'} />
    )
}

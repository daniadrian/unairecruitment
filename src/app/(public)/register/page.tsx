import type { Metadata } from 'next'
import { safeNextPath } from '../../../utils/safeNextPath.ts'
import RegisterScreen from '../../../views/screens/registerScreen.tsx'
import { registerAction } from '../../actions/authActions.ts'

export const metadata: Metadata = {
    title: 'Create account',
}

type Props = { searchParams: Promise<{ next?: string | string[] }> }

export default async function RegisterPage({ searchParams }: Props) {
    const { next } = await searchParams
    return <RegisterScreen registerAction={registerAction} nextPath={safeNextPath(next)} />
}

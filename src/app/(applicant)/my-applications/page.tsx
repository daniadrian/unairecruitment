import type { Metadata } from 'next'
import MyApplicationsScreen from '../../../views/screens/myApplicationsScreen.tsx'

export const metadata: Metadata = {
    title: 'My applications',
}

type Props = { searchParams: Promise<{ submitted?: string | string[] }> }

export default async function MyApplicationsPage({ searchParams }: Props) {
    const { submitted } = await searchParams
    return <MyApplicationsScreen submittedId={typeof submitted === 'string' ? submitted : null} />
}

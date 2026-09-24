import type { Metadata } from 'next'
import AdminRecruitmentListScreen from '../../../views/screens/adminRecruitmentListScreen.tsx'

export const metadata: Metadata = {
    title: 'Recruitments',
}

type Props = { searchParams: Promise<{ saved?: string | string[] }> }

export default async function AdminRecruitmentsPage({ searchParams }: Props) {
    const { saved } = await searchParams
    return <AdminRecruitmentListScreen saved={saved === '1'} />
}

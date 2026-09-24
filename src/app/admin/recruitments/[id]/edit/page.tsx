import type { Metadata } from 'next'
import { loadRecruitmentDetail } from '../../../../../views/components/recruitments/loadRecruitmentDetail.ts'
import AdminRecruitmentEditScreen from '../../../../../views/screens/adminRecruitmentEditScreen.tsx'
import { saveRecruitmentAction } from '../../../../actions/recruitmentActions.ts'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const recruitment = await loadRecruitmentDetail(id)
    return { title: recruitment ? `Edit: ${recruitment.title}` : 'Edit recruitment' }
}

export default async function EditRecruitmentPage({ params }: Props) {
    const { id } = await params
    return <AdminRecruitmentEditScreen recruitmentId={id} saveAction={saveRecruitmentAction} />
}

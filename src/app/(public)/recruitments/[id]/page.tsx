import type { Metadata } from 'next'
import DirectionalPage from '../../../../views/components/shell/directionalPage.tsx'
import { loadRecruitmentDetail } from '../../../../views/components/recruitments/loadRecruitmentDetail.ts'
import RecruitmentDetailScreen from '../../../../views/screens/recruitmentDetailScreen.tsx'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const recruitment = await loadRecruitmentDetail(id)
    return { title: recruitment ? recruitment.title : 'Role not found' }
}

export default async function RecruitmentDetailPage({ params }: Props) {
    const { id } = await params
    return (
        <DirectionalPage>
            <RecruitmentDetailScreen recruitmentId={id} />
        </DirectionalPage>
    )
}

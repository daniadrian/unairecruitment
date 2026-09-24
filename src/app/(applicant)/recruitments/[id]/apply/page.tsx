import type { Metadata } from 'next'
import DirectionalPage from '../../../../../views/components/shell/directionalPage.tsx'
import { loadRecruitmentDetail } from '../../../../../views/components/recruitments/loadRecruitmentDetail.ts'
import ApplyScreen from '../../../../../views/screens/applyScreen.tsx'
import { submitApplicationAction } from '../../../../actions/applicationActions.ts'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const recruitment = await loadRecruitmentDetail(id)
    return { title: recruitment ? `Apply: ${recruitment.title}` : 'Application form' }
}

export default async function ApplyPage({ params }: Props) {
    const { id } = await params
    return (
        <DirectionalPage>
            <ApplyScreen recruitmentId={id} submitAction={submitApplicationAction} />
        </DirectionalPage>
    )
}

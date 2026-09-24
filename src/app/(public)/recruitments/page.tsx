import type { Metadata } from 'next'
import DirectionalPage from '../../../views/components/shell/directionalPage.tsx'
import RecruitmentListScreen from '../../../views/screens/recruitmentListScreen.tsx'

export const metadata: Metadata = {
    title: 'Openings',
}

export default function RecruitmentsPage() {
    return (
        <DirectionalPage>
            <RecruitmentListScreen />
        </DirectionalPage>
    )
}

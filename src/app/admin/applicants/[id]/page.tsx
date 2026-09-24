import type { Metadata } from 'next'
import DirectionalPage from '../../../../views/components/shell/directionalPage.tsx'
import AdminApplicantDetailScreen from '../../../../views/screens/adminApplicantDetailScreen.tsx'
import { saveStatusAction } from '../../../actions/applicantActions.ts'

export const metadata: Metadata = {
    title: 'Applicant',
}

type Props = { params: Promise<{ id: string }> }

export default async function ApplicantDetailPage({ params }: Props) {
    const { id } = await params
    return (
        <DirectionalPage>
            <AdminApplicantDetailScreen applicationId={id} saveStatusAction={saveStatusAction} />
        </DirectionalPage>
    )
}

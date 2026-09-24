import type { Metadata } from 'next'
import AdminRecruitmentCreateScreen from '../../../../views/screens/adminRecruitmentCreateScreen.tsx'
import { saveRecruitmentAction } from '../../../actions/recruitmentActions.ts'

export const metadata: Metadata = {
    title: 'Add recruitment',
}

export default function NewRecruitmentPage() {
    return <AdminRecruitmentCreateScreen saveAction={saveRecruitmentAction} />
}

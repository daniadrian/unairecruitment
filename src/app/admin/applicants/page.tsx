import type { Metadata } from 'next'
import DirectionalPage from '../../../views/components/shell/directionalPage.tsx'
import AdminApplicantListScreen from '../../../views/screens/adminApplicantListScreen.tsx'
import type { ApplicationStatus } from '../../../types/applicationStatus.ts'

export const metadata: Metadata = {
    title: 'Applicants',
}

type Params = Record<string, string | string[] | undefined>
type Props = { searchParams: Promise<Params> }

function single(value: string | string[] | undefined): string | null {
    return typeof value === 'string' && value.trim() !== '' ? value : null
}

export default async function ApplicantsPage({ searchParams }: Props) {
    const params = await searchParams
    const keyword = single(params.keyword)
    const recruitmentId = single(params.recruitmentId)
    const status = single(params.status) as ApplicationStatus | null
    const page = Number.parseInt(single(params.page) ?? '1', 10)

    const query = new URLSearchParams()
    for (const [name, value] of Object.entries({ keyword, recruitmentId, status })) {
        if (value) query.set(name, value)
    }
    const currentPath = query.size > 0 ? `/admin/applicants?${query}` : '/admin/applicants'

    return (
        <DirectionalPage>
            <AdminApplicantListScreen
                filter={{ keyword, recruitmentId, status }}
                page={Number.isNaN(page) ? 1 : page}
                currentPath={currentPath}
            />
        </DirectionalPage>
    )
}

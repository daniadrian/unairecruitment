import Link from 'next/link'
import AdminHeader from '../components/admin/adminHeader.tsx'
import CreateRecruitmentForm from '../components/admin/recruitmentForm/createRecruitmentForm.tsx'
import { requireViewer } from '../components/guards/requireViewer.ts'
import type { FormAction } from '../../types/formAction.ts'

// Screen 09, UC-10: add a recruitment and the custom fields of its application form (AB-11).
// The unique ID is created by the system when it is saved (AB-02).
export default async function AdminRecruitmentCreateScreen({
    saveAction,
}: {
    saveAction: FormAction<{ id: string }>
}) {
    await requireViewer('ADMIN', '/admin/recruitments/new')

    return (
        <>
            <AdminHeader
                breadcrumb={
                    <ol className="flex flex-wrap gap-1.5">
                        <li>
                            <Link href="/admin/recruitments" className="text-white">
                                Recruitments
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page">New</li>
                    </ol>
                }
                title="Add recruitment"
            />
            <CreateRecruitmentForm action={saveAction} />
        </>
    )
}

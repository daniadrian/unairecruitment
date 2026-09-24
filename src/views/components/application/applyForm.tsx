'use client'

import { ApplicationForm } from './applicationForm.tsx'
import type { ApplicationFormData } from '../../../types/applications/applicationFormData.ts'
import type { FormAction } from '../../../types/formAction.ts'

// Screen 06 layout: section navigation | form sheet | "Before you submit" on desktop; on mobile
// a progress header, the stacked form, and a submit bar that sticks to the bottom.
export default function ApplyForm({
    data,
    action,
}: {
    data: ApplicationFormData
    action: FormAction<{ applicationId: string }>
}) {
    return (
        <ApplicationForm.Provider data={data} action={action}>
            <ApplicationForm.MobileProgress />
            <div className="px-3 pt-4 pb-6 sm:px-6 lg:px-12 lg:pt-7 lg:pb-[72px]">
                <div className="mx-auto grid w-full max-w-[1104px] items-start gap-10 lg:grid-cols-[180px_minmax(0,1fr)_260px]">
                    <div className="hidden lg:block lg:self-stretch">
                        <ApplicationForm.SectionNav />
                    </div>
                    <ApplicationForm.Sheet>
                        <ApplicationForm.ErrorSummary />
                        <ApplicationForm.PersonalDetails />
                        <ApplicationForm.Motivation />
                        <ApplicationForm.Questions />
                        <ApplicationForm.Cv />
                    </ApplicationForm.Sheet>
                    <div className="hidden lg:block lg:self-stretch">
                        <ApplicationForm.Checklist />
                    </div>
                </div>
            </div>
            <ApplicationForm.MobileSubmitBar />
        </ApplicationForm.Provider>
    )
}

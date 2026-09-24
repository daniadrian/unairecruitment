'use client'

import { RecruitmentForm } from './recruitmentForm.tsx'
import type { FormAction } from '../../../../types/formAction.ts'

const EMPTY = { title: '', division: '', description: '', requirements: '', fields: [] }

// Screen 09 (UC-10): the details in full, every custom field as an expanded card, and the
// applicant preview beside them; the dark save bar closes the page.
export default function CreateRecruitmentForm({ action }: { action: FormAction<{ id: string }> }) {
    return (
        <RecruitmentForm.Provider mode="create" recruitmentId={null} initial={EMPTY} action={action}>
            <div className="flex-1 px-3 pt-6 sm:px-6 lg:px-12 lg:pt-7">
                <div className="mx-auto grid w-full max-w-[1104px] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
                    <RecruitmentForm.Sheet>
                        <RecruitmentForm.ErrorSummary />
                        <RecruitmentForm.DetailsSection />
                        <RecruitmentForm.FieldsFieldset>
                            <RecruitmentForm.FieldsIntro />
                            <RecruitmentForm.FieldCardList />
                            <RecruitmentForm.AddFieldMenu />
                        </RecruitmentForm.FieldsFieldset>
                    </RecruitmentForm.Sheet>
                    <div className="lg:self-stretch">
                        <RecruitmentForm.Preview />
                    </div>
                </div>
            </div>
            <RecruitmentForm.SaveBar status={<RecruitmentForm.CreateStatus />}>
                <RecruitmentForm.CancelLink />
                <RecruitmentForm.SubmitButton>Save recruitment</RecruitmentForm.SubmitButton>
            </RecruitmentForm.SaveBar>
        </RecruitmentForm.Provider>
    )
}

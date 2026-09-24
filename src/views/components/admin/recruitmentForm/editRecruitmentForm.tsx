'use client'

import type { ReactNode } from 'react'
import { RecruitmentForm } from './recruitmentForm.tsx'
import type { FormAction } from '../../../../types/formAction.ts'
import type { RecruitmentFormValues } from '../../../../types/recruitments/recruitmentFormValues.ts'

// Screen 10 (UC-11): the details collapse to a summary, custom fields are compact rows that open
// for editing, and the side column (rendered by the screen) shows the recruitment's facts.
export default function EditRecruitmentForm({
    recruitmentId,
    initial,
    action,
    notice,
    aside,
}: {
    recruitmentId: string
    initial: RecruitmentFormValues
    action: FormAction<{ id: string }>
    notice: ReactNode
    aside: ReactNode
}) {
    return (
        <RecruitmentForm.Provider mode="edit" recruitmentId={recruitmentId} initial={initial} action={action}>
            <div className="flex-1 px-3 pt-6 sm:px-6 lg:px-12">
                <div className="mx-auto flex w-full max-w-[1104px] flex-col gap-[22px]">
                    {notice}
                    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
                        <RecruitmentForm.Sheet>
                            <RecruitmentForm.ErrorSummary />
                            <RecruitmentForm.DetailsCollapsible />
                            <RecruitmentForm.FieldsFieldset>
                                <RecruitmentForm.FieldsCount />
                                <RecruitmentForm.FieldRowList />
                                <RecruitmentForm.AddFieldMenu />
                            </RecruitmentForm.FieldsFieldset>
                        </RecruitmentForm.Sheet>
                        {aside}
                    </div>
                </div>
            </div>
            <RecruitmentForm.SaveBar status={<RecruitmentForm.EditStatus />}>
                <RecruitmentForm.DiscardButton />
                <RecruitmentForm.SubmitButton>Save changes</RecruitmentForm.SubmitButton>
            </RecruitmentForm.SaveBar>
        </RecruitmentForm.Provider>
    )
}

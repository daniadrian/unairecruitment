import type { RecruitmentFieldInput } from './recruitmentFieldInput.ts'

// Payload for UC-10 Add Recruitment and UC-11 Edit Recruitment.
// The order of `fields` sets the display order on the application form.
export interface RecruitmentInput {
    title: string
    division: string
    description: string
    requirements: string
    fields: RecruitmentFieldInput[]
}

import type { FieldDraft } from './fieldDraft.ts'

// Initial values of the recruitment form: empty for a new recruitment, the saved data when editing.
export interface RecruitmentFormValues {
    title: string
    division: string
    description: string
    requirements: string
    fields: FieldDraft[]
}

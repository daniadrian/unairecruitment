import type { FieldCategory } from '../fieldCategory.ts'
import type { FieldType } from '../fieldType.ts'

// A custom field while it is being edited on the recruitment form (UC-10, UC-11). `key` identifies
// the draft on the client; `id` is the saved field's ID and is null for a new field, which is
// what RecruitmentFieldInput expects when the form is sent.
export interface FieldDraft {
    key: string
    id: string | null
    name: string
    type: FieldType
    category: FieldCategory
    options: string[]
}

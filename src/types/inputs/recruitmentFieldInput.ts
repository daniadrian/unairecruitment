import type { FieldCategory } from '../fieldCategory.ts'
import type { FieldType } from '../fieldType.ts'

// Payload for one custom field in UC-10 and UC-11.
// `id` is set for existing fields and empty for new ones.
export interface RecruitmentFieldInput {
    id: string | null
    name: string
    type: FieldType
    category: FieldCategory
    options: string[]
}

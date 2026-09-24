import type { FieldCategory } from '../../types/fieldCategory.ts'
import type { FieldType } from '../../types/fieldType.ts'

export interface RecruitmentField {
    id: string
    recruitmentId: string
    name: string
    type: FieldType
    category: FieldCategory
    // Only set for the Choice type (at least one option, AB-11).
    options: string[]
    position: number
}

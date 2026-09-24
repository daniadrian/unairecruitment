import type { FieldType } from '../../types/fieldType.ts'

export interface ApplicationAnswer {
    id: string
    applicationId: string
    // Empty when the admin has deleted the field definition; the answer stays intact (AB-13).
    fieldId: string | null
    fieldName: string
    fieldType: FieldType
    value: string | null
    fileId: string | null
    position: number
}

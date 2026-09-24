import type { FieldType } from '../fieldType.ts'

// Write payload for one answer with a snapshot of its field definition (AB-13).
// Built by the controller from the recruitment settings when the application is submitted.
export interface ApplicationAnswerRecord {
    fieldId: string | null
    fieldName: string
    fieldType: FieldType
    value: string | null
    fileId: string | null
    position: number
}

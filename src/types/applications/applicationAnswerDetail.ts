import type { FieldType } from '../fieldType.ts'
import type { ApplicationFile } from './applicationFile.ts'

// Custom field answer as it was at submission time (AB-13).
export interface ApplicationAnswerDetail {
    fieldName: string
    fieldType: FieldType
    value: string | null
    file: ApplicationFile | null
    position: number
}

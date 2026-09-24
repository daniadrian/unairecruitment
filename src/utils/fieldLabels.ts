import type { ApplicationStatus } from '../types/applicationStatus.ts'
import type { FieldCategory } from '../types/fieldCategory.ts'
import type { FieldType } from '../types/fieldType.ts'

// V-9: user-facing labels for enum values (the product language is English, see the
// Project Profile in MVC_GUIDELINES.md). These maps are the single place where enum
// identifiers are turned into display text (L-6).

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
    TEXT: 'Text',
    CHOICE: 'Choice',
    NUMBER: 'Number',
    DATE: 'Date',
    FILE: 'File Upload',
}

export const FIELD_CATEGORY_LABELS: Record<FieldCategory, string> = {
    REQUIRED: 'Required',
    OPTIONAL: 'Optional',
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
    PENDING: 'Pending',
    INTERVIEW: 'Interview',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
}

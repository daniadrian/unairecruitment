// Payload for one custom field answer in UC-07.
// Files are referenced by their upload ID, not by bytes (KA-06).
export interface ApplicationAnswerInput {
    fieldId: string
    value: string | null
    fileId: string | null
}

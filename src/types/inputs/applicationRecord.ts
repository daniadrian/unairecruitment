import type { ApplicationAnswerRecord } from './applicationAnswerRecord.ts'

// Write payload for one application with its answers (UC-07).
// Files are uploaded beforehand and referenced by ID (KA-06).
export interface ApplicationRecord {
    recruitmentId: string
    name: string
    email: string
    contactNumber: string
    motivation: string
    cvFileId: string | null
    answers: ApplicationAnswerRecord[]
}

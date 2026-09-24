import type { ApplicationAnswerInput } from './applicationAnswerInput.ts'

// Payload for UC-07 Fill In Application Form.
// Name, email, and contact number are sent as entered because the applicant may
// reuse the account data or enter it again (AB-05).
export interface ApplicationInput {
    recruitmentId: string
    name: string
    email: string
    contactNumber: string
    motivation: string
    cvFileId: string | null
    answers: ApplicationAnswerInput[]
}

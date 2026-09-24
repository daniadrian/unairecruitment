import type { ApplicationStatus } from '../types/applicationStatus.ts'

// AL-01 and AB-01: the status moves forward and may skip stages, but never moves back;
// Accepted and Rejected may switch to each other. This table is the single source of truth
// for status transitions (L-6) and is used both to show options and to validate.
export const ALLOWED_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    PENDING: ['INTERVIEW', 'ACCEPTED', 'REJECTED'],
    INTERVIEW: ['ACCEPTED', 'REJECTED'],
    ACCEPTED: ['REJECTED'],
    REJECTED: ['ACCEPTED'],
}

export function allowedNextStatuses(current: ApplicationStatus): ApplicationStatus[] {
    return ALLOWED_STATUS_TRANSITIONS[current]
}

export function canTransition(current: ApplicationStatus, next: ApplicationStatus): boolean {
    return ALLOWED_STATUS_TRANSITIONS[current].includes(next)
}

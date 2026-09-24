import { describe, expect, it } from 'vitest'
import { allowedNextStatuses, canTransition } from './statusTransition.ts'

// AB-01 and AL-01.
describe('application status transitions', () => {
    it('allows Pending to advance to any later stage, including skipping stages', () => {
        expect(allowedNextStatuses('PENDING')).toEqual(['INTERVIEW', 'ACCEPTED', 'REJECTED'])
        expect(canTransition('PENDING', 'INTERVIEW')).toBe(true)
        expect(canTransition('PENDING', 'ACCEPTED')).toBe(true)
        expect(canTransition('PENDING', 'REJECTED')).toBe(true)
    })

    it('allows Interview to move only to Accepted or Rejected', () => {
        expect(allowedNextStatuses('INTERVIEW')).toEqual(['ACCEPTED', 'REJECTED'])
        expect(canTransition('INTERVIEW', 'ACCEPTED')).toBe(true)
        expect(canTransition('INTERVIEW', 'REJECTED')).toBe(true)
    })

    it('allows Accepted and Rejected to switch between each other', () => {
        expect(canTransition('ACCEPTED', 'REJECTED')).toBe(true)
        expect(canTransition('REJECTED', 'ACCEPTED')).toBe(true)
    })

    it('rejects moving back to an earlier stage', () => {
        expect(canTransition('INTERVIEW', 'PENDING')).toBe(false)
        expect(canTransition('ACCEPTED', 'PENDING')).toBe(false)
        expect(canTransition('ACCEPTED', 'INTERVIEW')).toBe(false)
        expect(canTransition('REJECTED', 'PENDING')).toBe(false)
        expect(canTransition('REJECTED', 'INTERVIEW')).toBe(false)
    })

    it('rejects a transition to the same status', () => {
        expect(canTransition('PENDING', 'PENDING')).toBe(false)
        expect(canTransition('ACCEPTED', 'ACCEPTED')).toBe(false)
    })
})

import type { ReactNode } from 'react'
import FieldError from '../ui/fieldError.tsx'
import FieldHint from '../ui/fieldHint.tsx'
import FieldLabel from '../ui/fieldLabel.tsx'

// Principle P4, one field anatomy for both sides: the admin's "Applicant preview" and the
// application form render every question with the same label, required marker, hint, and
// error. The control itself is passed as children.
export default function FieldQuestion({
    controlId,
    labelId,
    label,
    requirement,
    hint,
    hintId,
    error,
    errorId,
    children,
}: {
    controlId: string
    labelId: string
    label: string
    requirement: 'required' | 'optional'
    hint?: ReactNode
    hintId?: string
    error?: string
    errorId?: string
    children: ReactNode
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <FieldLabel id={labelId} htmlFor={controlId} requirement={requirement}>
                {label}
            </FieldLabel>
            {hint ? (
                <FieldHint id={hintId} className="-mt-0.5 text-[13.5px]">
                    {hint}
                </FieldHint>
            ) : null}
            {children}
            <FieldError id={errorId}>{error}</FieldError>
        </div>
    )
}

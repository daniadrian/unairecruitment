'use client'

import { startTransition, useActionState, useEffect, useEffectEvent, type FormEvent } from 'react'
import type { ActionResult } from '../../../types/actionResult.ts'
import type { FormAction } from '../../../types/formAction.ts'

// Runs a Server Action adapter with useActionState (KA-05: the pending state is shown by the
// view). Forms dispatch from onSubmit inside a transition instead of using the `action` prop,
// so React does not reset the fields when the controller returns validation errors.
export function useFormAction<T>(
    action: FormAction<T>,
    onSuccess?: (data: T) => void,
): {
    state: ActionResult<T> | null
    isPending: boolean
    submit: (formData: FormData) => void
    handleSubmit: (event: FormEvent<HTMLFormElement>) => void
} {
    const [state, dispatch, isPending] = useActionState(action, null)

    const notifySuccess = useEffectEvent((data: T) => onSuccess?.(data))

    useEffect(() => {
        if (state?.ok) notifySuccess(state.data)
    }, [state])

    function submit(formData: FormData) {
        startTransition(() => dispatch(formData))
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        submit(new FormData(event.currentTarget))
    }

    return { state, isPending, submit, handleSubmit }
}

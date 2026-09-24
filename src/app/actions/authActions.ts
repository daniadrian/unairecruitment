'use server'

import { AuthController } from '../../controllers/authController.ts'
import type { ActionResult } from '../../types/actionResult.ts'
import type { SessionUser } from '../../types/auth/sessionUser.ts'

// V-8 and C-5: thin adapters for UC-01 to UC-04. They only turn FormData
// into controller input and return the result; no business logic.
// The (prevState, formData) shape follows `useActionState` (06 section 3).

function text(formData: FormData, key: string): string {
    const value = formData.get(key)
    return typeof value === 'string' ? value : ''
}

export async function registerAction(
    _prevState: ActionResult<SessionUser> | null,
    formData: FormData,
): Promise<ActionResult<SessionUser>> {
    return new AuthController().submitRegister({
        name: text(formData, 'name'),
        email: text(formData, 'email'),
        contactNumber: text(formData, 'contactNumber'),
        password: text(formData, 'password'),
    })
}

export async function loginAction(
    _prevState: ActionResult<SessionUser> | null,
    formData: FormData,
): Promise<ActionResult<SessionUser>> {
    return new AuthController().submitLogin({
        email: text(formData, 'email'),
        password: text(formData, 'password'),
    })
}

export async function forgotPasswordAction(
    _prevState: ActionResult<undefined> | null,
    formData: FormData,
): Promise<ActionResult<undefined>> {
    return new AuthController().submitForgotPassword(text(formData, 'email'))
}

export async function resetPasswordAction(
    _prevState: ActionResult<undefined> | null,
    formData: FormData,
): Promise<ActionResult<undefined>> {
    return new AuthController().submitResetPassword({
        email: text(formData, 'email'),
        code: text(formData, 'code'),
        newPassword: text(formData, 'newPassword'),
    })
}

export async function logoutAction(): Promise<ActionResult<undefined>> {
    return new AuthController().handleLogout()
}

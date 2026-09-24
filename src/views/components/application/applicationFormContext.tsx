'use client'

import { useRouter } from 'next/navigation'
import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { fieldErrorOf, formErrorOf } from '../forms/actionErrors.ts'
import { useFormAction } from '../forms/useFormAction.ts'
import type { ApplicationFormData } from '../../../types/applications/applicationFormData.ts'
import type { FileAnswerState } from '../../../types/applications/fileAnswerState.ts'
import type { FormAction } from '../../../types/formAction.ts'
import type { ApplicationAnswerInput } from '../../../types/inputs/applicationAnswerInput.ts'
import type { RecruitmentDetail } from '../../../types/recruitments/recruitmentDetail.ts'

// State of the application form (UC-07, UC-15), lifted into one provider so the sections, the
// section navigation, and the "Before you submit" checklist read the same values. The provider
// is the only place that knows how the state is kept and how it becomes the Server Action's
// payload (answers as JSON, files as upload IDs, per the adapter's contract).

export type SectionId = 'personal' | 'motivation' | 'questions' | 'cv'

export interface FormSection {
    id: SectionId
    domId: string
    number: string
    title: string
    complete: boolean
}

interface PersonalDetails {
    name: string
    email: string
    contactNumber: string
}

export interface ApplicationFormState {
    useAccount: boolean
    personal: PersonalDetails
    motivation: string
    answers: Record<string, string>
    files: Record<string, FileAnswerState>
}

interface ApplicationFormActions {
    setUseAccount: (useAccount: boolean) => void
    updatePersonal: (patch: Partial<PersonalDetails>) => void
    setMotivation: (motivation: string) => void
    setAnswer: (fieldId: string, value: string) => void
    setFile: (key: string, file: FileAnswerState) => void
}

interface ApplicationFormMeta {
    recruitment: RecruitmentDetail
    sections: FormSection[]
    activeSection: SectionId
    formError: string | null
    errorFor: (key: string) => string | undefined
    isPending: boolean
    isUploading: boolean
    submissionAttempt: number
}

interface ApplicationFormContextValue {
    state: ApplicationFormState
    actions: ApplicationFormActions
    meta: ApplicationFormMeta
}

export const CV_KEY = 'cv'
export const FORM_ID = 'application-form'
const SECTION_DOM_PREFIX = 'section-'

const ApplicationFormContext = createContext<ApplicationFormContextValue | null>(null)

export function useApplicationForm(): ApplicationFormContextValue {
    const context = use(ApplicationFormContext)
    if (!context) throw new Error('useApplicationForm must be used inside ApplicationFormProvider')
    return context
}

function hasText(value: string | undefined): boolean {
    return (value ?? '').trim() !== ''
}

// Required questions that are answered: a file must be uploaded, other answers must not be empty.
export function countAnsweredRequired(recruitment: RecruitmentDetail, state: ApplicationFormState) {
    const required = recruitment.fields.filter((field) => field.category === 'REQUIRED')
    const answered = required.filter((field) =>
        field.type === 'FILE'
            ? state.files[field.id]?.status === 'uploaded'
            : hasText(state.answers[field.id]),
    )
    return { answered: answered.length, total: required.length }
}

function buildSections(recruitment: RecruitmentDetail, state: ApplicationFormState): FormSection[] {
    const { answered, total } = countAnsweredRequired(recruitment, state)
    const questionFilesOk = recruitment.fields
        .filter((field) => field.type === 'FILE')
        .every((field) => {
            const status = state.files[field.id]?.status
            return status !== 'uploading' && status !== 'failed'
        })

    const sections: Array<Omit<FormSection, 'number'>> = [
        {
            id: 'personal',
            domId: `${SECTION_DOM_PREFIX}personal`,
            title: 'Personal details',
            complete:
                hasText(state.personal.name) &&
                hasText(state.personal.email) &&
                hasText(state.personal.contactNumber),
        },
        {
            id: 'motivation',
            domId: `${SECTION_DOM_PREFIX}motivation`,
            title: 'Motivation',
            complete: hasText(state.motivation),
        },
    ]
    if (recruitment.fields.length > 0) {
        sections.push({
            id: 'questions',
            domId: `${SECTION_DOM_PREFIX}questions`,
            title: 'Division questions',
            complete: answered === total && questionFilesOk,
        })
    }
    sections.push({
        id: 'cv',
        domId: `${SECTION_DOM_PREFIX}cv`,
        title: 'CV',
        complete: state.files[CV_KEY]?.status === 'uploaded',
    })

    return sections.map((section, index) => ({ ...section, number: String(index + 1).padStart(2, '0') }))
}

export function ApplicationFormProvider({
    data,
    action,
    children,
}: {
    data: ApplicationFormData
    action: FormAction<{ applicationId: string }>
    children: ReactNode
}) {
    const router = useRouter()
    const [state, setState] = useState<ApplicationFormState>(() => ({
        useAccount: true,
        personal: { ...data.account },
        motivation: '',
        answers: {},
        files: {},
    }))
    const [activeSection, setActiveSection] = useState<SectionId>('personal')
    const [submissionAttempt, setSubmissionAttempt] = useState(0)
    // Inputs changed since the last submission: their old server error is no longer shown.
    const [edited, setEdited] = useState<Record<string, true>>({})

    function markEdited(name: string) {
        setEdited((current) => (current[name] ? current : { ...current, [name]: true }))
    }

    const {
        state: result,
        isPending,
        submit,
    } = useFormAction(action, (created) => {
        router.push(`/my-applications?submitted=${created.applicationId}`)
    })

    const sections = buildSections(data.recruitment, state)
    const sectionIds = sections.map((section) => section.id).join(' ')
    const isUploading = Object.values(state.files).some((file) => file.status === 'uploading')
    const hasInput =
        state.motivation.trim() !== '' ||
        Object.values(state.answers).some((answer) => answer.trim() !== '') ||
        Object.values(state.files).some((file) => file.status !== 'empty') ||
        (Object.keys(data.account) as (keyof typeof data.account)[]).some(
            (key) => state.personal[key] !== data.account[key],
        )
    const leaving = result?.ok === true

    // An application is long to write: ask before the tab is closed or reloaded with unsent input.
    useEffect(() => {
        if (!hasInput || leaving) return
        function warn(event: BeforeUnloadEvent) {
            event.preventDefault()
        }
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    }, [hasInput, leaving])

    // Highlights the section in view in the section navigation and the mobile progress bar.
    useEffect(() => {
        const elements = sectionIds
            .split(' ')
            .map((id) => document.getElementById(`${SECTION_DOM_PREFIX}${id}`))
            .filter((element): element is HTMLElement => element !== null)
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((entry) => entry.isIntersecting)
                if (visible.length === 0) return
                const top = visible.reduce((first, entry) =>
                    entry.boundingClientRect.top < first.boundingClientRect.top ? entry : first,
                )
                setActiveSection(top.target.id.slice(SECTION_DOM_PREFIX.length) as SectionId)
            },
            { rootMargin: '-20% 0px -55% 0px' },
        )
        elements.forEach((element) => observer.observe(element))
        return () => observer.disconnect()
    }, [sectionIds])

    const actions: ApplicationFormActions = {
        setUseAccount: (useAccount) =>
            setState((current) => ({
                ...current,
                useAccount,
                personal: useAccount ? { ...data.account } : current.personal,
            })),
        updatePersonal: (patch) => {
            Object.keys(patch).forEach(markEdited)
            setState((current) => ({ ...current, personal: { ...current.personal, ...patch } }))
        },
        setMotivation: (motivation) => {
            markEdited('motivation')
            setState((current) => ({ ...current, motivation }))
        },
        setAnswer: (fieldId, value) => {
            markEdited(`answers.${fieldId}`)
            setState((current) => ({ ...current, answers: { ...current.answers, [fieldId]: value } }))
        },
        setFile: (key, file) => {
            if (file.status !== 'empty') markEdited(`answers.${key}`)
            setState((current) => ({ ...current, files: { ...current.files, [key]: file } }))
        },
    }

    function handleSubmit() {
        if (isUploading || isPending) return
        const answers: ApplicationAnswerInput[] = data.recruitment.fields.map((field) => ({
            fieldId: field.id,
            value: field.type === 'FILE' ? null : (state.answers[field.id] ?? ''),
            fileId:
                field.type === 'FILE' && state.files[field.id]?.status === 'uploaded'
                    ? (state.files[field.id]?.fileId ?? null)
                    : null,
        }))
        const cv = state.files[CV_KEY]

        const formData = new FormData()
        formData.set('recruitmentId', data.recruitment.id)
        formData.set('name', state.personal.name)
        formData.set('email', state.personal.email)
        formData.set('contactNumber', state.personal.contactNumber)
        formData.set('motivation', state.motivation)
        formData.set('cvFileId', cv?.status === 'uploaded' && cv.fileId ? cv.fileId : '')
        formData.set('answers', JSON.stringify(answers))
        setSubmissionAttempt((attempt) => attempt + 1)
        setEdited({})
        submit(formData)
    }

    const value: ApplicationFormContextValue = {
        state,
        actions,
        meta: {
            recruitment: data.recruitment,
            sections,
            activeSection,
            formError: formErrorOf(result),
            errorFor: (key) => (edited[key] ? undefined : fieldErrorOf(result, key)),
            isPending,
            isUploading,
            submissionAttempt,
        },
    }

    return (
        <ApplicationFormContext value={value}>
            <form
                id={FORM_ID}
                noValidate
                onSubmit={(event) => {
                    event.preventDefault()
                    handleSubmit()
                }}
            >
                {children}
            </form>
        </ApplicationFormContext>
    )
}

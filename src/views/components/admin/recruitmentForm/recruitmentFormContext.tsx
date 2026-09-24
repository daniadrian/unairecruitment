'use client'

import { useRouter } from 'next/navigation'
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react'
import { fieldErrorOf, formErrorOf } from '../../forms/actionErrors.ts'
import { useFormAction } from '../../forms/useFormAction.ts'
import type { FieldType } from '../../../../types/fieldType.ts'
import type { FormAction } from '../../../../types/formAction.ts'
import type { RecruitmentFieldInput } from '../../../../types/inputs/recruitmentFieldInput.ts'
import type { FieldDraft } from '../../../../types/recruitments/fieldDraft.ts'
import type { RecruitmentFormValues } from '../../../../types/recruitments/recruitmentFormValues.ts'

// State of the recruitment form (UC-10 add, UC-11 edit), shared by the details inputs, the field
// builder, the applicant preview, and the save bar. The provider is the only place that knows
// how drafts are kept and how they become the Server Action's payload (custom fields as JSON in
// one form value, per the adapter). Validation stays in the controller (AL-05); its errors are
// keyed by field position at the time of sending, so they are mapped back to the drafts here.

export type DetailName = 'title' | 'division' | 'description' | 'requirements'
export type FieldPart = 'name' | 'type' | 'category' | 'options'
type Details = Record<DetailName, string>

interface RecruitmentFormState {
    details: Details
    fields: FieldDraft[]
    activeKey: string | null
    expanded: Record<string, boolean>
}

interface RecruitmentFormActions {
    updateDetails: (patch: Partial<Details>) => void
    addField: (type: FieldType) => void
    removeField: (key: string) => void
    updateField: (key: string, patch: Partial<Omit<FieldDraft, 'key' | 'id'>>) => void
    moveField: (key: string, offset: -1 | 1) => void
    moveFieldBefore: (key: string, targetKey: string) => void
    setActiveField: (key: string) => void
    toggleExpanded: (key: string) => void
    discard: () => void
}

interface RecruitmentFormMeta {
    mode: 'create' | 'edit'
    formError: string | null
    detailError: (name: DetailName) => string | undefined
    fieldError: (key: string, part: FieldPart) => string | undefined
    hasFieldErrors: (key: string) => boolean
    isPending: boolean
    isDirty: boolean
    changeCount: number
    submissionAttempt: number
    announcement: string
}

interface RecruitmentFormContextValue {
    state: RecruitmentFormState
    actions: RecruitmentFormActions
    meta: RecruitmentFormMeta
}

const RecruitmentFormContext = createContext<RecruitmentFormContextValue | null>(null)

export function useRecruitmentForm(): RecruitmentFormContextValue {
    const context = use(RecruitmentFormContext)
    if (!context) throw new Error('useRecruitmentForm must be used inside RecruitmentFormProvider')
    return context
}

const FIELD_PARTS: FieldPart[] = ['name', 'type', 'category', 'options']

function detailsOf(values: RecruitmentFormValues): Details {
    return {
        title: values.title,
        division: values.division,
        description: values.description,
        requirements: values.requirements,
    }
}

function sameField(a: FieldDraft, b: FieldDraft): boolean {
    return (
        a.name === b.name &&
        a.type === b.type &&
        a.category === b.category &&
        (a.type !== 'CHOICE' || a.options.join('\n') === b.options.join('\n'))
    )
}

function countChanges(initial: RecruitmentFormValues, details: Details, fields: FieldDraft[]): number {
    const initialDetails = detailsOf(initial)
    const initialByKey = new Map(initial.fields.map((field) => [field.key, field]))
    let changes = (Object.keys(initialDetails) as DetailName[]).filter(
        (name) => initialDetails[name] !== details[name],
    ).length
    changes += fields.filter((field) => {
        const original = initialByKey.get(field.key)
        return !original || !sameField(original, field)
    }).length
    changes += initial.fields.filter((field) => !fields.some((current) => current.key === field.key)).length
    const sameOrder =
        initial.fields.map((field) => field.key).join() === fields.map((field) => field.key).join()
    if (changes === 0 && !sameOrder) changes = 1
    return changes
}

export function RecruitmentFormProvider({
    mode,
    recruitmentId,
    initial,
    action,
    children,
}: {
    mode: 'create' | 'edit'
    recruitmentId: string | null
    initial: RecruitmentFormValues
    action: FormAction<{ id: string }>
    children: ReactNode
}) {
    const router = useRouter()
    const newKey = useRef(0)
    const [state, setState] = useState<RecruitmentFormState>(() => ({
        details: detailsOf(initial),
        fields: initial.fields,
        activeKey: initial.fields.at(-1)?.key ?? null,
        expanded: {},
    }))
    const [submittedKeys, setSubmittedKeys] = useState<string[]>([])
    const [submissionAttempt, setSubmissionAttempt] = useState(0)
    const [announcement, setAnnouncement] = useState('')
    // Inputs changed since the last submission: their old server error is no longer shown.
    const [edited, setEdited] = useState<Record<string, true>>({})

    function markEdited(names: string[]) {
        setEdited((current) => ({
            ...current,
            ...Object.fromEntries(names.map((name) => [name, true as const])),
        }))
    }

    const {
        state: result,
        isPending,
        submit,
    } = useFormAction(action, () => {
        router.push('/admin/recruitments?saved=1')
    })

    const changeCount = countChanges(initial, state.details, state.fields)
    const isDirty = changeCount > 0
    const leaving = result?.ok === true

    // Unsaved changes are easy to lose on a long form: ask before the tab is closed or reloaded.
    useEffect(() => {
        if (!isDirty || leaving) return
        function warn(event: BeforeUnloadEvent) {
            event.preventDefault()
        }
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    }, [isDirty, leaving])

    function describePosition(fields: FieldDraft[], key: string): string {
        const index = fields.findIndex((field) => field.key === key)
        const field = fields[index]
        return `${field?.name.trim() || 'Untitled field'} moved to position ${index + 1} of ${fields.length}.`
    }

    const actions: RecruitmentFormActions = {
        updateDetails: (patch) => {
            markEdited(Object.keys(patch))
            setState((current) => ({ ...current, details: { ...current.details, ...patch } }))
        },
        addField: (type) => {
            newKey.current += 1
            const key = `new-${newKey.current}`
            const field: FieldDraft = {
                key,
                id: null,
                name: '',
                type,
                category: 'REQUIRED',
                options: type === 'CHOICE' ? [''] : [],
            }
            setState((current) => ({
                ...current,
                fields: [...current.fields, field],
                activeKey: key,
                expanded: { ...current.expanded, [key]: true },
            }))
        },
        removeField: (key) =>
            setState((current) => {
                const fields = current.fields.filter((field) => field.key !== key)
                return {
                    ...current,
                    fields,
                    activeKey: current.activeKey === key ? (fields.at(-1)?.key ?? null) : current.activeKey,
                }
            }),
        updateField: (key, patch) => {
            markEdited(Object.keys(patch).map((part) => `${key}.${part}`))
            setState((current) => ({
                ...current,
                fields: current.fields.map((field) => {
                    if (field.key !== key) return field
                    const next = { ...field, ...patch }
                    if (next.type === 'CHOICE' && next.options.length === 0) next.options = ['']
                    return next
                }),
            }))
        },
        moveField: (key, offset) => {
            const index = state.fields.findIndex((field) => field.key === key)
            const target = index + offset
            if (index < 0 || target < 0 || target >= state.fields.length) return
            const fields = [...state.fields]
            const [moved] = fields.splice(index, 1)
            fields.splice(target, 0, moved)
            setState((current) => ({ ...current, fields }))
            setAnnouncement(describePosition(fields, key))
        },
        moveFieldBefore: (key, targetKey) => {
            if (key === targetKey) return
            const moved = state.fields.find((field) => field.key === key)
            if (!moved) return
            const rest = state.fields.filter((field) => field.key !== key)
            const targetIndex = rest.findIndex((field) => field.key === targetKey)
            const fields = [...rest]
            fields.splice(targetIndex < 0 ? rest.length : targetIndex, 0, moved)
            setState((current) => ({ ...current, fields }))
            setAnnouncement(describePosition(fields, key))
        },
        setActiveField: (key) =>
            setState((current) => (current.activeKey === key ? current : { ...current, activeKey: key })),
        toggleExpanded: (key) =>
            setState((current) => ({
                ...current,
                expanded: { ...current.expanded, [key]: !current.expanded[key] },
            })),
        discard: () =>
            setState({
                details: detailsOf(initial),
                fields: initial.fields,
                activeKey: initial.fields.at(-1)?.key ?? null,
                expanded: {},
            }),
    }

    function fieldError(key: string, part: FieldPart): string | undefined {
        if (edited[`${key}.${part}`]) return undefined
        const index = submittedKeys.indexOf(key)
        if (index < 0) return undefined
        return fieldErrorOf(result, `fields.${index}.${part}`)
    }

    function handleSubmit() {
        if (isPending) return
        const fields: RecruitmentFieldInput[] = state.fields.map((field) => ({
            id: field.id,
            name: field.name,
            type: field.type,
            category: field.category,
            options: field.type === 'CHOICE' ? field.options : [],
        }))
        const formData = new FormData()
        if (recruitmentId) formData.set('id', recruitmentId)
        formData.set('title', state.details.title)
        formData.set('division', state.details.division)
        formData.set('description', state.details.description)
        formData.set('requirements', state.details.requirements)
        formData.set('fields', JSON.stringify(fields))
        setSubmittedKeys(state.fields.map((field) => field.key))
        setSubmissionAttempt((attempt) => attempt + 1)
        setEdited({})
        submit(formData)
    }

    const value: RecruitmentFormContextValue = {
        state,
        actions,
        meta: {
            mode,
            formError: formErrorOf(result),
            detailError: (name) => (edited[name] ? undefined : fieldErrorOf(result, name)),
            fieldError,
            hasFieldErrors: (key) => FIELD_PARTS.some((part) => fieldError(key, part) !== undefined),
            isPending,
            isDirty,
            changeCount,
            submissionAttempt,
            announcement,
        },
    }

    return (
        <RecruitmentFormContext value={value}>
            <form
                noValidate
                onSubmit={(event) => {
                    event.preventDefault()
                    handleSubmit()
                }}
                className="flex flex-1 flex-col"
            >
                {children}
            </form>
            <p aria-live="polite" className="sr-only">
                {announcement}
            </p>
        </RecruitmentFormContext>
    )
}

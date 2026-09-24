'use client'

import { ChevronDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BUILT_IN_FIELD_NAMES } from '../../../../utils/builtInFields.ts'
import { cn } from '../../../../utils/cn.ts'
import { FIELD_TYPE_LABELS } from '../../../../utils/fieldLabels.ts'
import { MAX_FILE_SIZE_MB } from '../../../../utils/fileConstraints.ts'
import { splitLines } from '../../../../utils/textFormat.ts'
import FieldControl from '../../application/fieldControl.tsx'
import FieldQuestion from '../../application/fieldQuestion.tsx'
import FileDropzone from '../../application/fileDropzone.tsx'
import ContentSheet from '../../brand/contentSheet.tsx'
import Notice from '../../feedback/notice.tsx'
import { Button, buttonVariants } from '../../ui/button.tsx'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../ui/dropdownMenu.tsx'
import FieldError from '../../ui/fieldError.tsx'
import FieldHint from '../../ui/fieldHint.tsx'
import FieldLabel from '../../ui/fieldLabel.tsx'
import { Input } from '../../ui/input.tsx'
import { Textarea } from '../../ui/textarea.tsx'
import {
    dropIndicatorClass,
    FieldDeleteButton,
    FieldDragHandle,
    FieldNameInput,
    FieldRequiredSwitch,
    fieldTitle,
    FieldTypeSelect,
    OptionChipsEditor,
    OptionListEditor,
    useFieldDropTarget,
} from './fieldEditors.tsx'
import { RecruitmentFormProvider, useRecruitmentForm, type DetailName } from './recruitmentFormContext.tsx'
import type { FieldType } from '../../../../types/fieldType.ts'
import type { FieldDraft } from '../../../../types/recruitments/fieldDraft.ts'

// Screens 09 and 10 as compound components. Add and Edit compose the same parts differently:
// Add shows every field as an expanded card next to an applicant preview; Edit collapses the
// details and lists fields as compact rows that open for editing.

const TYPE_DESCRIPTIONS: Record<FieldType, string> = {
    TEXT: 'Short or long answer',
    CHOICE: 'One answer from a list of options',
    NUMBER: 'Age, years of experience, counts',
    DATE: 'Calendar date',
    FILE: `One file, max. ${MAX_FILE_SIZE_MB} MB`,
}

const MAX_RADIO_OPTIONS = 5

function fieldNumber(fields: FieldDraft[], key: string): string {
    return String(fields.findIndex((field) => field.key === key) + 1).padStart(2, '0')
}

function choiceDisplay(field: FieldDraft): string {
    const count = field.options.filter((option) => option.trim() !== '').length
    return count > MAX_RADIO_OPTIONS ? 'dropdown' : 'radio'
}

function SectionTitle({ marker, children }: { marker: string; children: ReactNode }) {
    return (
        <h2 className="font-display text-[21px] font-medium text-ink">
            <span className="mr-2.5 font-mono text-sm font-medium text-link">{marker}</span>
            {children}
        </h2>
    )
}

function ErrorSummary() {
    const { meta } = useRecruitmentForm()
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (meta.formError) ref.current?.focus()
    }, [meta.formError, meta.submissionAttempt])
    if (!meta.formError) return null
    return (
        <div ref={ref} tabIndex={-1} className="pt-5 focus:outline-none">
            <Notice tone="error">{meta.formError}</Notice>
        </div>
    )
}

function DetailInput({ name, label, hint }: { name: DetailName; label: string; hint?: string }) {
    const { state, actions, meta } = useRecruitmentForm()
    const error = meta.detailError(name)
    const id = `recruitment-${name}`
    const describedBy =
        [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined
    const common = {
        id,
        value: state.details[name],
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
    } as const
    const multiline = name === 'description' || name === 'requirements'

    return (
        <div className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel htmlFor={id} requirement="required">
                {label}
            </FieldLabel>
            {multiline ? (
                <Textarea
                    {...common}
                    placeholder={name === 'requirements' ? 'One requirement per line' : undefined}
                    onChange={(event) => actions.updateDetails({ [name]: event.target.value })}
                    className="min-h-[84px] leading-[1.55]"
                />
            ) : (
                <Input
                    {...common}
                    onChange={(event) => actions.updateDetails({ [name]: event.target.value })}
                />
            )}
            <FieldError id={`${id}-error`}>{error}</FieldError>
            {hint ? <FieldHint id={`${id}-hint`}>{hint}</FieldHint> : null}
        </div>
    )
}

function DetailsFields() {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <DetailInput name="title" label="Position title" />
            <DetailInput name="division" label="Division" />
            <DetailInput name="description" label="Description" />
            <DetailInput
                name="requirements"
                label="Requirements"
                hint="Each line appears as a numbered item on the role page."
            />
        </div>
    )
}

// Add: section A shown in full.
function DetailsSection() {
    return (
        <fieldset className="flex flex-col gap-4 pt-[22px] pb-7">
            <legend className="sr-only">Recruitment details</legend>
            <SectionTitle marker="A">Recruitment details</SectionTitle>
            <DetailsFields />
        </fieldset>
    )
}

// Edit: section A collapsed to a summary line until the admin opens it.
function DetailsCollapsible() {
    const { state, meta } = useRecruitmentForm()
    const [open, setOpen] = useState(false)
    const hasErrors = (['title', 'division', 'description', 'requirements'] as DetailName[]).some((name) =>
        meta.detailError(name),
    )
    const expanded = open || hasErrors
    const requirementCount = splitLines(state.details.requirements).length
    const summary = [
        state.details.division || 'No division',
        requirementCount === 1 ? '1 requirement' : `${requirementCount} requirements`,
    ].join(' · ')

    return (
        <section className="flex flex-col">
            <button
                type="button"
                aria-expanded={expanded}
                aria-controls="recruitment-details"
                onClick={() => setOpen((current) => !current)}
                className="grid cursor-pointer grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-hairline py-[18px] text-left text-ink"
            >
                <span className="font-mono text-sm font-medium text-link">A</span>
                <span className="flex min-w-0 flex-col gap-[3px]">
                    <span className="font-display text-[21px] font-medium">Recruitment details</span>
                    <span className="truncate text-[13.5px] text-ink-soft">{summary}</span>
                </span>
                <span className="text-sm font-semibold text-link">{expanded ? 'Close' : 'Edit'}</span>
            </button>
            <div id="recruitment-details" hidden={!expanded} className="border-b border-hairline py-5">
                <DetailsFields />
            </div>
        </section>
    )
}

function FieldsIntro() {
    const builtIns = BUILT_IN_FIELD_NAMES.join(', ').replace(/, ([^,]*)$/, ', and $1')
    return (
        <div className="flex flex-col gap-1">
            <SectionTitle marker="B">Additional form fields</SectionTitle>
            <p className="text-sm leading-[1.5] text-ink-soft">
                {builtIns} are always on the form. Add questions specific to this role.
            </p>
        </div>
    )
}

function FieldsCount() {
    const { state } = useRecruitmentForm()
    const required = state.fields.filter((field) => field.category === 'REQUIRED').length
    return (
        <div className="flex flex-wrap items-baseline justify-between gap-3">
            <SectionTitle marker="B">Additional form fields</SectionTitle>
            <span className="font-mono text-[13px] text-ink-soft">
                {state.fields.length} {state.fields.length === 1 ? 'field' : 'fields'} {'·'} {required}{' '}
                required
            </span>
        </div>
    )
}

function OptionsHint({ field }: { field: FieldDraft }) {
    return (
        <FieldHint>
            {choiceDisplay(field) === 'radio'
                ? `Applicants see radio buttons. More than ${MAX_RADIO_OPTIONS} options become a dropdown.`
                : `Applicants see a dropdown, because there are more than ${MAX_RADIO_OPTIONS} options.`}
        </FieldHint>
    )
}

function FieldCard({ field }: { field: FieldDraft }) {
    const { state, actions } = useRecruitmentForm()
    const { isOver, dropProps } = useFieldDropTarget(field.key)
    const active = state.activeKey === field.key

    return (
        <li
            data-field-row
            {...dropProps}
            onFocusCapture={() => actions.setActiveField(field.key)}
            onPointerDownCapture={() => actions.setActiveField(field.key)}
            className={cn(
                'flex flex-col gap-4 rounded-md border p-4 sm:p-[18px]',
                active ? 'border-[1.5px] border-primary bg-mist' : 'border-hairline bg-white',
                dropIndicatorClass(isOver),
            )}
        >
            <div className="flex items-center gap-2.5">
                <FieldDragHandle fieldKey={field.key} />
                <span className="font-mono text-[13px] font-semibold text-link">
                    Field {fieldNumber(state.fields, field.key)}
                </span>
                <span className="ml-auto">
                    <FieldDeleteButton fieldKey={field.key} appearance="labelled" />
                </span>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1fr)_180px_140px]">
                <FieldNameInput fieldKey={field.key} />
                <FieldTypeSelect fieldKey={field.key} />
                <FieldRequiredSwitch fieldKey={field.key} />
            </div>
            {field.type === 'CHOICE' ? (
                <div className="flex flex-col gap-2">
                    <OptionListEditor fieldKey={field.key} />
                    <OptionsHint field={field} />
                </div>
            ) : null}
        </li>
    )
}

function FieldCardList() {
    const { state } = useRecruitmentForm()
    if (state.fields.length === 0) return null
    return (
        <ol aria-label="Additional form fields" className="flex flex-col gap-3">
            {state.fields.map((field) => (
                <FieldCard key={field.key} field={field} />
            ))}
        </ol>
    )
}

function FieldRow({ field }: { field: FieldDraft }) {
    const { state, actions, meta } = useRecruitmentForm()
    const { isOver, dropProps } = useFieldDropTarget(field.key)
    const expanded = Boolean(state.expanded[field.key]) || meta.hasFieldErrors(field.key)
    const panelId = `field-${field.key}-panel`
    const typeLabel =
        field.type === 'CHOICE'
            ? `${FIELD_TYPE_LABELS.CHOICE} · ${choiceDisplay(field)}`
            : FIELD_TYPE_LABELS[field.type]

    return (
        <li
            data-field-row
            {...dropProps}
            className={cn('border-b border-row-line last:border-b-0', dropIndicatorClass(isOver))}
        >
            <div className="grid grid-cols-[28px_26px_minmax(0,1fr)_36px_36px] items-center gap-2.5 px-2 py-2.5 sm:grid-cols-[28px_30px_minmax(0,1fr)_150px_76px_36px_36px] sm:px-3">
                <FieldDragHandle fieldKey={field.key} />
                <span className="font-mono text-[13px] font-medium text-link">
                    {fieldNumber(state.fields, field.key)}
                </span>
                <span className="min-w-0 truncate text-[14.5px] font-semibold text-ink">
                    {fieldTitle(field)}
                </span>
                <span className="hidden text-[13.5px] text-ink-soft sm:block">{typeLabel}</span>
                <span
                    className={cn(
                        'hidden text-[13px] sm:block',
                        field.category === 'REQUIRED'
                            ? 'font-semibold text-ink'
                            : 'font-medium text-ink-soft',
                    )}
                >
                    {field.category === 'REQUIRED' ? 'Required' : 'Optional'}
                </span>
                <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    aria-label={`${expanded ? 'Close' : 'Edit'} field ${fieldTitle(field)}`}
                    onClick={() => actions.toggleExpanded(field.key)}
                    className="grid size-9 cursor-pointer place-items-center rounded-md text-secondary hover:bg-tint"
                >
                    <ChevronDown
                        aria-hidden="true"
                        size={16}
                        strokeWidth={2}
                        className={cn(
                            'transition-transform motion-reduce:transition-none',
                            expanded && 'rotate-180',
                        )}
                    />
                </button>
                <FieldDeleteButton fieldKey={field.key} appearance="icon" />
            </div>
            <div
                id={panelId}
                hidden={!expanded}
                onFocusCapture={() => actions.setActiveField(field.key)}
                className="mx-2 mb-3.5 flex flex-col gap-3.5 rounded-md border border-sky bg-page p-3.5 sm:mr-3 sm:ml-[74px] sm:p-4"
            >
                <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1fr)_180px_140px]">
                    <FieldNameInput fieldKey={field.key} />
                    <FieldTypeSelect fieldKey={field.key} />
                    <FieldRequiredSwitch fieldKey={field.key} />
                </div>
                {field.type === 'CHOICE' ? (
                    <div className="flex flex-col gap-2">
                        <OptionChipsEditor fieldKey={field.key} />
                        <OptionsHint field={field} />
                    </div>
                ) : null}
            </div>
        </li>
    )
}

function FieldRowList() {
    const { state } = useRecruitmentForm()
    if (state.fields.length === 0) {
        return (
            <p className="rounded-md border border-dashed border-sky px-4 py-5 text-sm text-ink-soft">
                This recruitment has no additional fields. Applicants only fill in the standard fields.
            </p>
        )
    }
    return (
        <ol aria-label="Additional form fields" className="rounded-md border border-hairline">
            {state.fields.map((field) => (
                <FieldRow key={field.key} field={field} />
            ))}
        </ol>
    )
}

function AddFieldMenu() {
    const { actions } = useRecruitmentForm()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex h-10 cursor-pointer items-center gap-2 self-start rounded-md border-[1.5px] border-dashed border-secondary bg-white px-3.5 text-[14.5px] font-semibold text-ink hover:bg-mist data-[state=open]:bg-mist">
                <Plus aria-hidden="true" size={16} strokeWidth={2.2} className="text-secondary" />
                Add field
                <ChevronDown aria-hidden="true" size={15} strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[340px] max-w-[calc(100vw-32px)]">
                {(Object.keys(TYPE_DESCRIPTIONS) as FieldType[]).map((type) => (
                    <DropdownMenuItem
                        key={type}
                        onSelect={() => actions.addField(type)}
                        className="grid grid-cols-[104px_1fr] gap-2.5 py-2.5"
                    >
                        <b className="text-sm font-semibold">{FIELD_TYPE_LABELS[type]}</b>
                        <span className="text-[13px] text-ink-soft">{TYPE_DESCRIPTIONS[type]}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function FieldsFieldset({ children }: { children: ReactNode }) {
    return (
        <fieldset className="flex flex-col gap-3.5 border-t border-hairline pt-[22px] pb-7">
            <legend className="sr-only">Additional form fields</legend>
            {children}
        </fieldset>
    )
}

// "Applicant preview": the field being edited, drawn with the same anatomy applicants see (P4).
function Preview() {
    const { state } = useRecruitmentForm()
    const [values, setValues] = useState<Record<string, string>>({})
    const field = state.fields.find((item) => item.key === state.activeKey) ?? state.fields.at(-1)

    return (
        <aside aria-label="Applicant preview" className="flex flex-col gap-2.5 lg:sticky lg:top-6">
            <div className="flex items-baseline justify-between">
                <b className="text-sm font-semibold text-ink">Applicant preview</b>
                {field ? (
                    <span className="font-mono text-[12.5px] text-ink-faint">
                        Field {fieldNumber(state.fields, field.key)}
                    </span>
                ) : null}
            </div>
            <div className="flex flex-col gap-2.5 rounded-md border border-sky bg-page p-5">
                {field ? (
                    <FieldQuestion
                        controlId={`preview-${field.key}`}
                        labelId={`preview-${field.key}-label`}
                        label={fieldTitle(field)}
                        requirement={field.category === 'REQUIRED' ? 'required' : 'optional'}
                        hint={field.type === 'FILE' ? `One file, max. ${MAX_FILE_SIZE_MB} MB.` : undefined}
                    >
                        {field.type === 'FILE' ? (
                            <FileDropzone hint={`Any file type · max. ${MAX_FILE_SIZE_MB} MB`} />
                        ) : (
                            <FieldControl
                                field={{
                                    type: field.type,
                                    options: field.options.filter((option) => option.trim() !== ''),
                                }}
                                id={`preview-${field.key}`}
                                labelId={`preview-${field.key}-label`}
                                value={values[field.key] ?? ''}
                                onValueChange={(value) =>
                                    setValues((current) => ({ ...current, [field.key]: value }))
                                }
                            />
                        )}
                    </FieldQuestion>
                ) : (
                    <p className="text-sm text-ink-soft">Add a field to see it the way applicants will.</p>
                )}
            </div>
            <p className="text-[13px] leading-[1.5] text-ink-soft">
                The application form uses the same component {'—'} what you see here is exactly what
                applicants see.
            </p>
        </aside>
    )
}

function SaveBar({ status, children }: { status: ReactNode; children: ReactNode }) {
    return (
        <div
            data-sticky-bottom-bar
            className="sticky bottom-0 z-30 mt-7 bg-admin-nav px-4 py-3.5 sm:px-6 lg:px-12"
        >
            <div className="mx-auto flex w-full max-w-[1104px] flex-wrap items-center justify-end gap-2.5">
                <span aria-live="polite" className="mr-auto text-[13.5px] text-admin-muted">
                    {status}
                </span>
                {children}
            </div>
        </div>
    )
}

function CreateStatus() {
    const { state, meta } = useRecruitmentForm()
    const count = state.fields.length
    return (
        <>
            {meta.isDirty ? 'Not saved' : 'Nothing entered yet'} {'·'} {count}{' '}
            {count === 1 ? 'additional field' : 'additional fields'}
        </>
    )
}

function EditStatus() {
    const { meta } = useRecruitmentForm()
    if (!meta.isDirty) return <>No unsaved changes</>
    return <>{meta.changeCount === 1 ? '1 unsaved change' : `${meta.changeCount} unsaved changes`}</>
}

function CancelLink() {
    return (
        <Link href="/admin/recruitments" className={buttonVariants({ variant: 'onDark' })}>
            Cancel
        </Link>
    )
}

function DiscardButton() {
    const { actions, meta } = useRecruitmentForm()
    return (
        <Button variant="onDark" onClick={actions.discard} disabled={!meta.isDirty || meta.isPending}>
            Discard changes
        </Button>
    )
}

function SubmitButton({ children }: { children: ReactNode }) {
    const { meta } = useRecruitmentForm()
    return (
        <Button type="submit" disabled={meta.isPending} aria-disabled={meta.isPending}>
            {meta.isPending ? 'Saving…' : children}
        </Button>
    )
}

function Sheet({ children }: { children: ReactNode }) {
    return <ContentSheet className="flex min-w-0 flex-col px-4 sm:px-7">{children}</ContentSheet>
}

export const RecruitmentForm = {
    Provider: RecruitmentFormProvider,
    Sheet,
    ErrorSummary,
    DetailsSection,
    DetailsCollapsible,
    FieldsFieldset,
    FieldsIntro,
    FieldsCount,
    FieldCardList,
    FieldRowList,
    AddFieldMenu,
    Preview,
    SaveBar,
    CreateStatus,
    EditStatus,
    CancelLink,
    DiscardButton,
    SubmitButton,
}

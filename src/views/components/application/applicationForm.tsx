'use client'

import { Check, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { MAX_FILE_SIZE_MB } from '../../../utils/fileConstraints.ts'
import { cn } from '../../../utils/cn.ts'
import ContentSheet from '../brand/contentSheet.tsx'
import Notice from '../feedback/notice.tsx'
import { Button } from '../ui/button.tsx'
import FieldError from '../ui/fieldError.tsx'
import FieldHint from '../ui/fieldHint.tsx'
import FieldLabel from '../ui/fieldLabel.tsx'
import { Input } from '../ui/input.tsx'
import Switch from '../ui/switch.tsx'
import { Textarea } from '../ui/textarea.tsx'
import {
    ApplicationFormProvider,
    countAnsweredRequired,
    CV_KEY,
    useApplicationForm,
    type SectionId,
} from './applicationFormContext.tsx'
import FieldControl from './fieldControl.tsx'
import FieldQuestion from './fieldQuestion.tsx'
import FileUploadField from './fileUploadField.tsx'

// Screen 06 as compound components (composition over configuration): each part reads the lifted
// form state from ApplicationFormProvider, and ApplyForm composes them into the layout of the
// design (section nav | form sheet | "Before you submit").

function SectionHeading({ section, children }: { section: SectionId; children: ReactNode }) {
    const { meta } = useApplicationForm()
    const number = meta.sections.find((item) => item.id === section)?.number
    return (
        <h2 className="font-display text-[22px] font-medium text-ink">
            <span className="mr-2.5 font-mono text-sm font-medium text-link">{number}</span>
            {children}
        </h2>
    )
}

function SectionNav() {
    const { meta } = useApplicationForm()
    return (
        <nav aria-label="Form sections" className="sticky top-6 flex flex-col gap-0.5 pt-2">
            {meta.sections.map((section) => {
                const active = section.id === meta.activeSection
                return (
                    <a
                        key={section.id}
                        href={`#${section.domId}`}
                        aria-current={active ? 'true' : undefined}
                        className={cn(
                            'grid h-9 grid-cols-[28px_1fr] items-center text-sm no-underline',
                            active
                                ? '-ml-2.5 rounded-r-sm bg-tint pl-2.5 font-semibold text-ink shadow-[inset_3px_0_0_var(--color-primary)]'
                                : 'font-medium text-ink-soft hover:text-ink',
                        )}
                    >
                        {section.complete ? (
                            <Check aria-hidden="true" size={16} strokeWidth={2.6} className="text-teal" />
                        ) : (
                            <span
                                className={cn(
                                    'font-mono text-[12.5px]',
                                    active ? 'font-semibold text-link' : 'font-medium',
                                )}
                            >
                                {section.number}
                            </span>
                        )}
                        <span>
                            {section.title}
                            {section.complete ? <span className="sr-only"> (complete)</span> : null}
                        </span>
                    </a>
                )
            })}
        </nav>
    )
}

function MobileProgress() {
    const { meta } = useApplicationForm()
    const index = meta.sections.findIndex((section) => section.id === meta.activeSection) + 1
    const total = meta.sections.length
    return (
        <div className="sticky top-0 z-30 lg:hidden">
            <div className="flex items-center justify-between gap-3 border-b border-hairline bg-[linear-gradient(180deg,#DCE8F7,#E3EDF9)] px-4 py-3 text-[13.5px]">
                <span className="truncate font-semibold text-ink">{meta.recruitment.title}</span>
                <span className="font-mono text-[12.5px] font-semibold text-link">
                    {index} / {total}
                </span>
            </div>
            <div className="h-[3px] bg-hairline" aria-hidden="true">
                <div className="h-full bg-primary" style={{ width: `${(index / total) * 100}%` }} />
            </div>
        </div>
    )
}

function ErrorSummary() {
    const { meta } = useApplicationForm()
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (meta.formError) ref.current?.focus()
    }, [meta.formError, meta.submissionAttempt])

    if (!meta.formError) return null
    return (
        <div ref={ref} tabIndex={-1} className="pt-6 focus:outline-none">
            <Notice tone="error">{meta.formError}</Notice>
        </div>
    )
}

function PersonalDetails() {
    const { state, actions, meta } = useApplicationForm()
    const readOnly = state.useAccount
    const errors = {
        name: meta.errorFor('name'),
        email: meta.errorFor('email'),
        contactNumber: meta.errorFor('contactNumber'),
    }

    return (
        <fieldset id="section-personal" className="flex scroll-mt-20 flex-col gap-[18px] py-6">
            <legend className="sr-only">Personal details</legend>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <SectionHeading section="personal">Personal details</SectionHeading>
                <span className="flex items-center gap-2.5 text-sm text-ink">
                    <Switch
                        id="use-account"
                        checked={state.useAccount}
                        onCheckedChange={actions.setUseAccount}
                    />
                    <label htmlFor="use-account" className="cursor-pointer">
                        Use account details
                    </label>
                </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <FieldLabel htmlFor="apply-name" requirement="required">
                        Full name
                    </FieldLabel>
                    <Input
                        id="apply-name"
                        autoComplete="name"
                        value={state.personal.name}
                        readOnly={readOnly}
                        onChange={(event) => actions.updatePersonal({ name: event.target.value })}
                        aria-invalid={errors.name ? true : undefined}
                        aria-describedby={errors.name ? 'apply-name-error' : undefined}
                    />
                    <FieldError id="apply-name-error">{errors.name}</FieldError>
                </div>
                <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="apply-email" requirement="required">
                        Email
                    </FieldLabel>
                    <Input
                        id="apply-email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        spellCheck={false}
                        value={state.personal.email}
                        readOnly={readOnly}
                        onChange={(event) => actions.updatePersonal({ email: event.target.value })}
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={errors.email ? 'apply-email-error' : undefined}
                    />
                    <FieldError id="apply-email-error">{errors.email}</FieldError>
                </div>
                <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="apply-contact" requirement="required">
                        Contact number
                    </FieldLabel>
                    <Input
                        id="apply-contact"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="+62 812 3456 7890"
                        value={state.personal.contactNumber}
                        readOnly={readOnly}
                        onChange={(event) => actions.updatePersonal({ contactNumber: event.target.value })}
                        aria-invalid={errors.contactNumber ? true : undefined}
                        aria-describedby={errors.contactNumber ? 'apply-contact-error' : undefined}
                    />
                    <FieldError id="apply-contact-error">{errors.contactNumber}</FieldError>
                </div>
            </div>
            <FieldHint className="text-[13.5px]">
                {readOnly
                    ? 'These come from your account. Turn off "Use account details" to change them for this application.'
                    : 'Changes here apply to this application only — your account details stay the same.'}
            </FieldHint>
        </fieldset>
    )
}

function Motivation() {
    const { state, actions, meta } = useApplicationForm()
    const error = meta.errorFor('motivation')
    return (
        <fieldset
            id="section-motivation"
            className="flex scroll-mt-20 flex-col gap-3 border-t border-hairline py-6"
        >
            <legend className="sr-only">Motivation</legend>
            <SectionHeading section="motivation">Motivation</SectionHeading>
            <FieldLabel htmlFor="apply-motivation" requirement="required">
                What motivates you to apply for this role?
            </FieldLabel>
            <Textarea
                id="apply-motivation"
                value={state.motivation}
                onChange={(event) => actions.setMotivation(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={
                    error ? 'apply-motivation-error apply-motivation-count' : 'apply-motivation-count'
                }
            />
            <div className="flex items-start justify-between gap-3">
                <FieldError id="apply-motivation-error">{error}</FieldError>
                <span id="apply-motivation-count" className="ml-auto font-mono text-[13px] text-ink-soft">
                    {state.motivation.trim().length} characters
                </span>
            </div>
        </fieldset>
    )
}

function Questions() {
    const { state, actions, meta } = useApplicationForm()
    const { recruitment } = meta
    if (recruitment.fields.length === 0) return null

    return (
        <fieldset
            id="section-questions"
            className="flex scroll-mt-20 flex-col gap-[22px] border-t border-hairline py-6"
        >
            <legend className="sr-only">Questions from the division</legend>
            <div className="flex flex-col gap-1">
                <SectionHeading section="questions">Questions from the division</SectionHeading>
                <p className="text-sm text-ink-soft">Set by {recruitment.division} for this role.</p>
            </div>
            {recruitment.fields.map((field) => {
                const controlId = `question-${field.id}`
                const labelId = `${controlId}-label`
                const errorId = `${controlId}-error`
                const error = meta.errorFor(`answers.${field.id}`)
                return (
                    <FieldQuestion
                        key={field.id}
                        controlId={controlId}
                        labelId={labelId}
                        label={field.name}
                        requirement={field.category === 'REQUIRED' ? 'required' : 'optional'}
                        hint={field.type === 'FILE' ? `One file, max. ${MAX_FILE_SIZE_MB} MB.` : undefined}
                        error={error}
                        errorId={errorId}
                    >
                        {field.type === 'FILE' ? (
                            <FileUploadField
                                id={controlId}
                                purpose="ATTACHMENT"
                                invalid={Boolean(error)}
                                describedBy={error ? errorId : undefined}
                                onChange={(file) => actions.setFile(field.id, file)}
                            />
                        ) : (
                            <FieldControl
                                field={field}
                                id={controlId}
                                labelId={labelId}
                                value={state.answers[field.id] ?? ''}
                                onValueChange={(value) => actions.setAnswer(field.id, value)}
                                invalid={Boolean(error)}
                                describedBy={error ? errorId : undefined}
                            />
                        )}
                    </FieldQuestion>
                )
            })}
        </fieldset>
    )
}

function Cv() {
    const { actions } = useApplicationForm()
    return (
        <fieldset id="section-cv" className="flex scroll-mt-20 flex-col gap-2 border-t border-hairline pt-6">
            <legend className="sr-only">CV (optional)</legend>
            <SectionHeading section="cv">
                CV <span className="font-sans text-[15px] font-normal text-ink-soft">(optional)</span>
            </SectionHeading>
            <label htmlFor="apply-cv" className="text-[13.5px] text-ink-soft">
                PDF only, max. {MAX_FILE_SIZE_MB} MB.
            </label>
            <FileUploadField id="apply-cv" purpose="CV" onChange={(file) => actions.setFile(CV_KEY, file)} />
        </fieldset>
    )
}

type ChecklistTone = 'done' | 'todo' | 'busy' | 'warning'

function ChecklistIcon({ tone }: { tone: ChecklistTone }) {
    if (tone === 'done')
        return <Check aria-hidden="true" size={16} strokeWidth={2.6} className="mt-px shrink-0 text-teal" />
    if (tone === 'busy') {
        return (
            <LoaderCircle
                aria-hidden="true"
                size={16}
                strokeWidth={2}
                className="mt-px shrink-0 animate-spin text-primary motion-reduce:animate-none"
            />
        )
    }
    if (tone === 'warning')
        return <TriangleAlert aria-hidden="true" size={16} strokeWidth={2.2} className="mt-px shrink-0" />
    return (
        <span aria-hidden="true" className="mt-px grid size-4 shrink-0 place-items-center">
            <span className="size-2.5 rounded-full border-[1.5px] border-dashed border-field" />
        </span>
    )
}

function useChecklist(): Array<{ key: string; tone: ChecklistTone; text: string }> {
    const { state, meta } = useApplicationForm()
    const items: Array<{ key: string; tone: ChecklistTone; text: string }> = []

    const personal = meta.sections.find((section) => section.id === 'personal')
    items.push(
        personal?.complete
            ? { key: 'personal', tone: 'done', text: 'Personal details complete' }
            : { key: 'personal', tone: 'todo', text: 'Personal details incomplete' },
    )

    const motivationLength = state.motivation.trim().length
    items.push(
        motivationLength > 0
            ? { key: 'motivation', tone: 'done', text: `Motivation, ${motivationLength} characters` }
            : { key: 'motivation', tone: 'todo', text: 'Motivation not written yet' },
    )

    const { answered, total } = countAnsweredRequired(meta.recruitment, state)
    if (total > 0) {
        items.push({
            key: 'questions',
            tone: answered === total ? 'done' : 'todo',
            text: `${answered} of ${total} required questions answered`,
        })
    }

    for (const field of meta.recruitment.fields.filter((item) => item.type === 'FILE')) {
        const status = state.files[field.id]?.status
        if (status === 'uploading')
            items.push({ key: field.id, tone: 'busy', text: `${field.name} still uploading` })
        if (status === 'failed') {
            items.push({
                key: field.id,
                tone: 'warning',
                text: `${field.name} failed — choose again or remove it`,
            })
        }
    }

    const cv = state.files[CV_KEY]?.status
    if (cv === 'uploaded') items.push({ key: CV_KEY, tone: 'done', text: 'CV attached' })
    else if (cv === 'uploading') items.push({ key: CV_KEY, tone: 'busy', text: 'CV still uploading' })
    else if (cv === 'failed') {
        items.push({ key: CV_KEY, tone: 'warning', text: 'CV failed — choose again or remove it (optional)' })
    } else items.push({ key: CV_KEY, tone: 'todo', text: 'No CV attached (optional)' })

    return items
}

function SubmitHint({ id, className }: { id: string; className?: string }) {
    const { meta } = useApplicationForm()
    return (
        <p id={id} className={cn('text-[13px] leading-[1.5] text-ink-soft', className)}>
            {meta.isUploading ? 'Wait for your files to finish uploading. ' : null}
            Once submitted, an application can{'’'}t be edited.
        </p>
    )
}

function SubmitButton({ describedBy }: { describedBy: string }) {
    const { meta } = useApplicationForm()
    const disabled = meta.isUploading || meta.isPending
    return (
        <Button type="submit" size="lg" disabled={disabled} aria-describedby={describedBy} className="w-full">
            {meta.isPending ? 'Submitting…' : 'Submit application'}
        </Button>
    )
}

function Checklist() {
    const items = useChecklist()
    return (
        <ContentSheet rule="action" className="sticky top-6 flex flex-col gap-3.5 border-t-[3px] p-5">
            <h2 className="text-[15px] font-semibold text-ink">Before you submit</h2>
            <ul className="flex flex-col gap-2.5 text-sm leading-[1.4] text-ink" aria-live="polite">
                {items.map((item) => (
                    <li
                        key={item.key}
                        className={cn('flex gap-2', item.tone === 'warning' && 'font-semibold')}
                    >
                        <ChecklistIcon tone={item.tone} />
                        {item.text}
                    </li>
                ))}
            </ul>
            <SubmitButton describedBy="submit-hint" />
            <SubmitHint id="submit-hint" />
        </ContentSheet>
    )
}

function MobileSubmitBar() {
    return (
        <div
            data-sticky-bottom-bar
            className="sticky bottom-0 z-30 flex flex-col gap-2 border-t border-sky bg-white px-4 pt-3 pb-5 lg:hidden"
        >
            <SubmitButton describedBy="submit-hint-mobile" />
            <SubmitHint id="submit-hint-mobile" className="text-center text-[12.5px]" />
        </div>
    )
}

function Sheet({ children }: { children: ReactNode }) {
    return <ContentSheet className="flex min-w-0 flex-col px-4 pb-7 sm:px-7">{children}</ContentSheet>
}

export const ApplicationForm = {
    Provider: ApplicationFormProvider,
    SectionNav,
    MobileProgress,
    Sheet,
    ErrorSummary,
    PersonalDetails,
    Motivation,
    Questions,
    Cv,
    Checklist,
    MobileSubmitBar,
}

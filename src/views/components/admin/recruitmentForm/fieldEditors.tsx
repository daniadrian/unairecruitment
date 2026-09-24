'use client'

import { GripVertical, Plus, Trash2, X } from 'lucide-react'
import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { FIELD_TYPE_LABELS } from '../../../../utils/fieldLabels.ts'
import { cn } from '../../../../utils/cn.ts'
import { Button } from '../../ui/button.tsx'
import FieldError from '../../ui/fieldError.tsx'
import FieldLabel from '../../ui/fieldLabel.tsx'
import { Input } from '../../ui/input.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'
import Switch from '../../ui/switch.tsx'
import { useRecruitmentForm } from './recruitmentFormContext.tsx'
import type { FieldType } from '../../../../types/fieldType.ts'
import type { FieldDraft } from '../../../../types/recruitments/fieldDraft.ts'

// Building blocks of one custom field in the form builder (AB-11). Each reads its draft from the
// recruitment form context, so the card (add) and the compact row (edit) compose the same parts.

const FIELD_TYPES: FieldType[] = ['TEXT', 'CHOICE', 'NUMBER', 'DATE', 'FILE']
const DRAG_TYPE = 'application/x-unairec-field'

function useField(fieldKey: string): FieldDraft {
    const { state } = useRecruitmentForm()
    const field = state.fields.find((item) => item.key === fieldKey)
    if (!field) throw new Error(`Unknown field draft ${fieldKey}`)
    return field
}

export function fieldTitle(field: FieldDraft): string {
    return field.name.trim() || 'Untitled field'
}

export function FieldNameInput({ fieldKey }: { fieldKey: string }) {
    const field = useField(fieldKey)
    const { actions, meta } = useRecruitmentForm()
    const error = meta.fieldError(fieldKey, 'name')
    const id = `field-${fieldKey}-name`
    return (
        <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={id} className="text-[13.5px]">
                Field name
            </FieldLabel>
            <Input
                id={id}
                value={field.name}
                autoComplete="off"
                placeholder="e.g. Languages you speak"
                onChange={(event) => actions.updateField(fieldKey, { name: event.target.value })}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className="h-10"
            />
            <FieldError id={`${id}-error`}>{error}</FieldError>
        </div>
    )
}

export function FieldTypeSelect({ fieldKey }: { fieldKey: string }) {
    const field = useField(fieldKey)
    const { actions, meta } = useRecruitmentForm()
    const error = meta.fieldError(fieldKey, 'type')
    const id = `field-${fieldKey}-type`
    return (
        <div className="flex flex-col gap-1.5">
            <FieldLabel id={`${id}-label`} htmlFor={id} className="text-[13.5px]">
                Type
            </FieldLabel>
            <Select
                value={field.type}
                onValueChange={(type) => actions.updateField(fieldKey, { type: type as FieldType })}
            >
                <SelectTrigger
                    id={id}
                    aria-labelledby={`${id}-label`}
                    className="h-10"
                    aria-invalid={error ? true : undefined}
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {FIELD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                            {FIELD_TYPE_LABELS[type]}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <FieldError>{error}</FieldError>
        </div>
    )
}

export function FieldRequiredSwitch({ fieldKey }: { fieldKey: string }) {
    const field = useField(fieldKey)
    const { actions } = useRecruitmentForm()
    const id = `field-${fieldKey}-required`
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[13.5px] font-semibold text-ink">Setting</span>
            <span className="flex h-10 items-center gap-2.5 text-[15px] text-ink">
                <Switch
                    id={id}
                    checked={field.category === 'REQUIRED'}
                    onCheckedChange={(checked) =>
                        actions.updateField(fieldKey, { category: checked ? 'REQUIRED' : 'OPTIONAL' })
                    }
                />
                <label htmlFor={id} className="cursor-pointer">
                    Required
                </label>
            </span>
        </div>
    )
}

// "Add recruitment": numbered option rows with a remove button and "Add option".
export function OptionListEditor({ fieldKey }: { fieldKey: string }) {
    const field = useField(fieldKey)
    const { actions, meta } = useRecruitmentForm()
    const listRef = useRef<HTMLDivElement>(null)
    const error = meta.fieldError(fieldKey, 'options')
    const id = `field-${fieldKey}-options`

    function setOptions(options: string[]) {
        actions.updateField(fieldKey, { options })
    }

    function addOption() {
        setOptions([...field.options, ''])
        requestAnimationFrame(() => {
            const inputs = listRef.current?.querySelectorAll('input')
            inputs?.[inputs.length - 1]?.focus()
        })
    }

    return (
        <div role="group" aria-labelledby={`${id}-label`} className="flex flex-col gap-2">
            <span id={`${id}-label`} className="text-[13.5px] font-semibold text-ink">
                Answer options
            </span>
            <div ref={listRef} className="flex flex-col gap-2">
                {field.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="w-5 font-mono text-[12.5px] font-medium text-ink-faint">
                            {index + 1}
                        </span>
                        <Input
                            value={option}
                            autoComplete="off"
                            aria-label={`Option ${index + 1}`}
                            onChange={(event) =>
                                setOptions(
                                    field.options.map((item, position) =>
                                        position === index ? event.target.value : item,
                                    ),
                                )
                            }
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault()
                                    addOption()
                                }
                            }}
                            aria-invalid={error ? true : undefined}
                            className="h-[38px] text-[14.5px]"
                        />
                        <button
                            type="button"
                            aria-label={`Remove option ${index + 1}`}
                            onClick={() =>
                                setOptions(field.options.filter((_, position) => position !== index))
                            }
                            className="grid size-[38px] shrink-0 cursor-pointer place-items-center rounded-md text-ink-soft hover:bg-tint hover:text-ink"
                        >
                            <X aria-hidden="true" size={16} strokeWidth={2} />
                        </button>
                    </div>
                ))}
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={addOption}
                className="ml-7 self-start text-link hover:text-link"
            >
                <Plus aria-hidden="true" size={15} strokeWidth={2.4} />
                Add option
            </Button>
            <FieldError>{error}</FieldError>
        </div>
    )
}

// "Edit recruitment": the options as removable chips and an input that adds one on Enter.
export function OptionChipsEditor({ fieldKey }: { fieldKey: string }) {
    const field = useField(fieldKey)
    const { actions, meta } = useRecruitmentForm()
    const [draft, setDraft] = useState('')
    const error = meta.fieldError(fieldKey, 'options')
    const options = field.options.filter((option) => option.trim() !== '')
    const id = `field-${fieldKey}-chips`

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key !== 'Enter') return
        event.preventDefault()
        const value = draft.trim()
        if (value === '') return
        if (!options.some((option) => option.toLowerCase() === value.toLowerCase())) {
            actions.updateField(fieldKey, { options: [...options, value] })
        }
        setDraft('')
    }

    return (
        <div className="flex flex-col gap-2.5">
            <span className="text-[13.5px] font-semibold text-ink">
                Answer options{' '}
                <span className="font-mono text-[12.5px] font-normal text-ink-faint">
                    {options.length} {options.length === 1 ? 'option' : 'options'}
                </span>
            </span>
            <ul className="flex flex-wrap gap-2" aria-label="Answer options">
                {options.map((option) => (
                    <li
                        key={option}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-field bg-white pr-1.5 pl-2.5 text-sm whitespace-nowrap text-ink"
                    >
                        {option}
                        <button
                            type="button"
                            aria-label={`Remove option ${option}`}
                            onClick={() =>
                                actions.updateField(fieldKey, {
                                    options: options.filter((item) => item !== option),
                                })
                            }
                            className="grid size-[22px] cursor-pointer place-items-center rounded-sm text-ink-soft hover:bg-tint hover:text-ink"
                        >
                            <X aria-hidden="true" size={13} strokeWidth={2.4} />
                        </button>
                    </li>
                ))}
                <li className="min-w-[200px] flex-1">
                    <label htmlFor={id} className="sr-only">
                        New option
                    </label>
                    <input
                        id={id}
                        value={draft}
                        autoComplete="off"
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type an option, press Enter"
                        aria-invalid={error ? true : undefined}
                        className="h-8 w-full rounded-md border border-dashed border-secondary bg-white px-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-solid focus:border-primary focus:shadow-[0_0_0_3px_var(--color-glow)] focus:outline-none"
                    />
                </li>
            </ul>
            <FieldError>{error}</FieldError>
        </div>
    )
}

export function FieldDeleteButton({
    fieldKey,
    appearance,
}: {
    fieldKey: string
    appearance: 'labelled' | 'icon'
}) {
    const field = useField(fieldKey)
    const { actions } = useRecruitmentForm()
    if (appearance === 'icon') {
        return (
            <button
                type="button"
                aria-label={`Delete field ${fieldTitle(field)}`}
                onClick={() => actions.removeField(fieldKey)}
                className="grid size-9 cursor-pointer place-items-center rounded-md text-ink hover:bg-tint"
            >
                <Trash2 aria-hidden="true" size={16} strokeWidth={2} />
            </button>
        )
    }
    return (
        <Button
            variant="ghost"
            size="xs"
            aria-label={`Delete field ${fieldTitle(field)}`}
            onClick={() => actions.removeField(fieldKey)}
        >
            <Trash2 aria-hidden="true" size={15} strokeWidth={2} />
            Delete
        </Button>
    )
}

// Reordering: drag the handle, or focus it and use the arrow keys. Field order is the order of
// the questions on the application form.
export function FieldDragHandle({ fieldKey }: { fieldKey: string }) {
    const field = useField(fieldKey)
    const { actions } = useRecruitmentForm()

    function handleDragStart(event: DragEvent<HTMLButtonElement>) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData(DRAG_TYPE, fieldKey)
        const row = event.currentTarget.closest('[data-field-row]')
        if (row instanceof HTMLElement) event.dataTransfer.setDragImage(row, 24, 24)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault()
            const handle = event.currentTarget
            actions.moveField(fieldKey, event.key === 'ArrowUp' ? -1 : 1)
            // The row moves in the DOM; keep the focus on its handle.
            requestAnimationFrame(() => handle.focus())
        }
    }

    return (
        <button
            type="button"
            draggable
            onDragStart={handleDragStart}
            onKeyDown={handleKeyDown}
            aria-label={`Reorder ${fieldTitle(field)}. Use the arrow keys to move it up or down.`}
            className="grid size-7 shrink-0 cursor-grab place-items-center rounded-sm text-field hover:bg-tint hover:text-secondary active:cursor-grabbing"
        >
            <GripVertical aria-hidden="true" size={18} strokeWidth={2} />
        </button>
    )
}

// Drop target props for a field card or row.
export function useFieldDropTarget(fieldKey: string): {
    isOver: boolean
    dropProps: {
        onDragOver: (event: DragEvent<HTMLElement>) => void
        onDragLeave: () => void
        onDrop: (event: DragEvent<HTMLElement>) => void
    }
} {
    const { actions } = useRecruitmentForm()
    const [isOver, setIsOver] = useState(false)
    return {
        isOver,
        dropProps: {
            onDragOver: (event) => {
                if (!event.dataTransfer.types.includes(DRAG_TYPE)) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setIsOver(true)
            },
            onDragLeave: () => setIsOver(false),
            onDrop: (event) => {
                const key = event.dataTransfer.getData(DRAG_TYPE)
                setIsOver(false)
                if (!key) return
                event.preventDefault()
                actions.moveFieldBefore(key, fieldKey)
            },
        },
    }
}

export function dropIndicatorClass(isOver: boolean): string {
    return cn(isOver && 'shadow-[inset_0_3px_0_var(--color-primary)]')
}

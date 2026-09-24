'use client'

import { Input } from '../ui/input.tsx'
import { RadioCard, RadioGroup } from '../ui/radioGroup.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.tsx'
import type { FieldType } from '../../../types/fieldType.ts'

// The control for one custom field (AB-11), one explicit variant per type. Choice fields are
// radio options up to five options and a dropdown for longer lists: the rule the design gives
// for the Radio/Dropdown setting, which the data model does not store. File fields are
// composed by the caller (upload field or static preview).

const MAX_RADIO_OPTIONS = 5

type ValueField = { type: FieldType; options: string[] }

type ControlProps = {
    id: string
    labelId: string
    value: string
    onValueChange: (value: string) => void
    invalid?: boolean
    describedBy?: string
}

function ChoiceControl({
    options,
    id,
    labelId,
    value,
    onValueChange,
    invalid,
    describedBy,
}: ControlProps & { options: string[] }) {
    if (options.length > MAX_RADIO_OPTIONS) {
        return (
            <Select value={value === '' ? undefined : value} onValueChange={onValueChange}>
                <SelectTrigger
                    id={id}
                    aria-labelledby={labelId}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                >
                    <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )
    }

    return (
        <RadioGroup
            id={id}
            value={value}
            onValueChange={onValueChange}
            aria-labelledby={labelId}
            aria-describedby={describedBy}
            className="sm:grid-cols-2"
        >
            {options.map((option) => (
                <RadioCard key={option} value={option} aria-invalid={invalid || undefined}>
                    {option}
                </RadioCard>
            ))}
        </RadioGroup>
    )
}

export default function FieldControl({ field, ...props }: ControlProps & { field: ValueField }) {
    const inputProps = {
        id: props.id,
        value: props.value,
        onChange: (event: { target: { value: string } }) => props.onValueChange(event.target.value),
        'aria-invalid': props.invalid || undefined,
        'aria-describedby': props.describedBy,
        // Custom questions are unique to each recruitment; browser history suggestions only get in the way.
        autoComplete: 'off',
    }

    switch (field.type) {
        case 'CHOICE':
            return <ChoiceControl options={field.options} {...props} />
        case 'NUMBER':
            return (
                <Input
                    {...inputProps}
                    type="number"
                    step="any"
                    inputMode="decimal"
                    className="w-60 max-w-full font-mono"
                />
            )
        case 'DATE':
            return <Input {...inputProps} type="date" className="w-[280px] max-w-full" />
        case 'FILE':
            return null
        case 'TEXT':
        default:
            return <Input {...inputProps} type="text" />
    }
}

import { Check } from 'lucide-react'
import { PASSWORD_MIN_LENGTH, hasLetterAndDigit } from '../../../utils/authPolicy.ts'
import { cn } from '../../../utils/cn.ts'

// The password rules on "Create account" tick teal as they are met (icon plus text, never colour
// alone). It reuses the policy constants the controller validates with; the server still decides.
export default function PasswordRules({ id, value }: { id?: string; value: string }) {
    const missing = Math.max(0, PASSWORD_MIN_LENGTH - value.length)
    const rules = [
        { met: hasLetterAndDigit(value), text: 'Contains letters and numbers' },
        {
            met: missing === 0,
            text:
                missing === 0 || value.length === 0
                    ? `At least ${PASSWORD_MIN_LENGTH} characters`
                    : `At least ${PASSWORD_MIN_LENGTH} characters (${missing} more)`,
        },
    ]

    return (
        <ul id={id} className="mt-1 flex flex-col gap-[5px] text-[13.5px]">
            {rules.map((rule) => (
                <li
                    key={rule.text}
                    className={cn(
                        'flex items-center gap-2',
                        rule.met ? 'font-semibold text-teal-ink' : 'text-ink-soft',
                    )}
                >
                    {rule.met ? (
                        <Check aria-hidden="true" size={14} strokeWidth={2.6} />
                    ) : (
                        <span aria-hidden="true" className="grid size-3.5 place-items-center">
                            <span className="size-[9px] rounded-full border-[1.5px] border-field" />
                        </span>
                    )}
                    {rule.text}
                    <span className="sr-only">{rule.met ? ', met' : ', not met yet'}</span>
                </li>
            ))}
        </ul>
    )
}

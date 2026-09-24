import { cn } from '../../../utils/cn.ts'
import { shortReference } from '../../../utils/textFormat.ts'

// Principle P5, "the number is the identity": the same reference is shown to applicants and
// admins. It is the tail of the real UUID; the full ID is kept in the tooltip.
export default function ShortRef({ id, className }: { id: string; className?: string }) {
    return (
        <span title={id} className={cn('font-mono', className)}>
            {shortReference(id)}
        </span>
    )
}

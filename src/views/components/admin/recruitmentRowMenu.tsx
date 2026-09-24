'use client'

import { Ellipsis } from 'lucide-react'
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdownMenu.tsx'

// The "More actions" menu of a recruitment row. Deleting a recruitment does not exist (AB-04);
// opening/closing lives on the edit screen (RecruitmentStatusControl), so this menu only offers
// the related pages.
export default function RecruitmentRowMenu({
    recruitmentId,
    title,
}: {
    recruitmentId: string
    title: string
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`More actions for ${title}`}
                className="grid size-[34px] cursor-pointer place-items-center rounded-md text-ink hover:bg-tint"
            >
                <Ellipsis aria-hidden="true" size={18} strokeWidth={2.2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem asChild>
                    <Link href={`/recruitments/${recruitmentId}`}>View public page</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/admin/applicants?recruitmentId=${recruitmentId}`}>View applicants</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

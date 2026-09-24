import { RecruitmentController } from '../../controllers/recruitmentController.ts'
import { formatDate } from '../../utils/dateFormat.ts'
import EmptyRegister from '../components/brand/emptyRegister.tsx'
import HeroBand from '../components/brand/heroBand.tsx'
import OpeningsRegister from '../components/recruitments/openingsRegister.tsx'
import type { OpeningItem } from '../../types/recruitments/openingItem.ts'

// Screen 01, UC-05 (AB-09: visible without signing in). Gradient blue hero with the graticule,
// then the register of open roles rising over it as a white sheet. AB-04: only OPEN recruitments
// are listed here; a closed one disappears from this page but its detail page still works.
export default async function RecruitmentListScreen() {
    const recruitments = await new RecruitmentController().loadOpenRecruitments()
    const items: OpeningItem[] = recruitments.map((recruitment) => ({
        id: recruitment.id,
        title: recruitment.title,
        division: recruitment.division,
        description: recruitment.description,
        postedLabel: formatDate(recruitment.createdAt),
    }))

    const lead =
        items.length === 0
            ? 'New roles will be listed here as soon as they open.'
            : `${items.length === 1 ? 'One role is' : `${items.length} roles are`} open. Anyone who cares about peace, sustainable development, and human rights is welcome — and you can apply to more than one role.`

    return (
        <>
            <HeroBand tone="public" className="px-4 pt-8 pb-14 sm:px-6 lg:px-16 lg:pt-[52px] lg:pb-[104px]">
                <div className="mx-auto flex w-full max-w-[1072px] flex-col gap-4">
                    <h1 className="max-w-[700px] font-display text-[29px] leading-[1.12] font-medium tracking-[-0.02em] text-balance text-white lg:text-5xl lg:leading-[1.06]">
                        Bring global issues into the conversations around you.
                    </h1>
                    <p className="max-w-[700px] text-base leading-[1.6] font-medium text-pretty text-hero-lead lg:text-[17px]">
                        {lead}
                    </p>
                </div>
            </HeroBand>

            <div className="relative -mt-7 px-3 pb-16 sm:px-6 lg:-mt-14 lg:px-16 lg:pb-[72px]">
                <div className="mx-auto w-full max-w-[1072px]">
                    {items.length === 0 ? (
                        <EmptyRegister title="No open roles yet.">
                            <p>
                                There are no roles to apply for right now. Every new volunteer and program
                                role will be listed on this page.
                            </p>
                        </EmptyRegister>
                    ) : (
                        <OpeningsRegister items={items} />
                    )}
                </div>
            </div>
        </>
    )
}

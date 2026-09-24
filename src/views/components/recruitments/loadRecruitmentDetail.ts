import { cache } from 'react'
import { RecruitmentController } from '../../../controllers/recruitmentController.ts'
import type { RecruitmentDetail } from '../../../types/recruitments/recruitmentDetail.ts'

// One controller read per request, shared by a page's metadata and its screen.
export const loadRecruitmentDetail = cache(async (id: string): Promise<RecruitmentDetail | null> => {
    return new RecruitmentController().loadRecruitmentDetail(id)
})

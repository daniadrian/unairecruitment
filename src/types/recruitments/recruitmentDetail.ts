import type { Recruitment } from '../../models/entities/recruitment.ts'
import type { RecruitmentField } from '../../models/entities/recruitmentField.ts'

// A recruitment with its custom field settings (UC-06, UC-07, UC-11).
export interface RecruitmentDetail extends Recruitment {
    fields: RecruitmentField[]
}

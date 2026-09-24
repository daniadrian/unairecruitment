import 'dotenv/config'
import { getPrismaClient } from '../src/libs/prisma.ts'
import { RecruitmentRepository } from '../src/models/repositories/recruitmentRepository.ts'
import type { RecruitmentInput } from '../src/types/inputs/recruitmentInput.ts'

// One-off seed for UC-10 Add Recruitment, written for the initial production launch.
// AB-04: recruitments are never deleted, so this script is idempotent by title --
// running it again skips any recruitment that already exists instead of duplicating it.
//
// Run with: npx tsx scripts/seedRecruitments.ts
// It uses the same runtime client as the application (DATABASE_URL, transaction pooler),
// so it writes to whatever database that variable points to -- check it before running.

const RECRUITMENTS: RecruitmentInput[] = [
    {
        title: 'Videographer',
        division: 'Media & Documentation',
        description:
            "UNAI's Media & Documentation division tells the story of our advocacy, events, and field programs through video. As a Videographer, you will film and edit short documentaries, event recaps, and campaign videos that bring our work on global issues to a wider audience, from public screenings to our digital channels.",
        requirements: [
            'Experience operating a camera and basic lighting/audio setup for interviews and event coverage',
            'Working knowledge of video editing software such as Adobe Premiere Pro, DaVinci Resolve, or Final Cut Pro',
            'Able to attend and film UNAI events on evenings or weekends when scheduled',
            'Comfortable working independently to turn raw footage into a finished edit within an agreed deadline',
            'Interest in global affairs, public diplomacy, or civil society advocacy is an advantage',
        ].join('\n'),
        fields: [
            { id: null, name: 'YouTube Portfolio Link', type: 'TEXT', category: 'OPTIONAL', options: [] },
        ],
    },
    {
        title: 'Graphic Designer',
        division: 'Media & Documentation',
        description:
            "The Graphic Designer supports UNAI's campaigns, publications, and events with visual materials that communicate complex global issues clearly and persuasively. You will design social media graphics, event collateral, infographics, and printed materials such as banners and reports.",
        requirements: [
            'Proficiency in design tools such as Adobe Illustrator, Photoshop, Canva, or Figma',
            'A portfolio demonstrating layout, typography, and visual storytelling',
            'Able to turn a design brief into a first draft within an agreed timeline',
            'Comfortable receiving feedback from multiple stakeholders and iterating on designs',
            'Familiarity with print-ready file preparation is an advantage',
        ].join('\n'),
        fields: [
            { id: null, name: 'Design Portfolio Link', type: 'TEXT', category: 'OPTIONAL', options: [] },
            {
                id: null,
                name: 'Primary Design Software',
                type: 'CHOICE',
                category: 'OPTIONAL',
                options: ['Adobe Illustrator', 'Adobe Photoshop', 'Figma', 'Canva', 'Other'],
            },
        ],
    },
    {
        title: 'Photographer',
        division: 'Media & Documentation',
        description:
            "As UNAI's Photographer, you will document events, field visits, and campaign activities with images used across our publications, reports, and social media. Your work will help preserve the record of our programs and make our advocacy visible to the public.",
        requirements: [
            'Own or have reliable access to a camera suitable for indoor and outdoor event photography',
            'Basic photo editing skills using Lightroom, Photoshop, or an equivalent tool',
            'Available to attend UNAI events on short notice, including evenings or weekends',
            'Able to deliver a selected, edited set of photos within three working days of an event',
        ].join('\n'),
        fields: [
            { id: null, name: 'Photography Portfolio Link', type: 'TEXT', category: 'OPTIONAL', options: [] },
        ],
    },
    {
        title: 'Content Writer',
        division: 'Communications',
        description:
            "The Content Writer produces clear, engaging written material for UNAI's website, newsletters, and social media, translating our positions on global issues into content that informs and mobilizes the public. You will collaborate with the Research and Media teams to keep messaging accurate and consistent.",
        requirements: [
            'Strong written English and/or Indonesian, with attention to grammar and tone',
            'Able to summarize policy or research material into accessible public-facing text',
            'Comfortable working with an editorial calendar and meeting submission deadlines',
            'Basic understanding of SEO or social media copywriting is an advantage',
        ].join('\n'),
        fields: [
            { id: null, name: 'Writing Sample Link', type: 'TEXT', category: 'OPTIONAL', options: [] },
            {
                id: null,
                name: 'Preferred Writing Language',
                type: 'CHOICE',
                category: 'OPTIONAL',
                options: ['Bahasa Indonesia', 'English', 'Both'],
            },
        ],
    },
    {
        title: 'Social Media Officer',
        division: 'Communications',
        description:
            "The Social Media Officer plans and publishes content across UNAI's Instagram, TikTok, and X accounts, growing our audience and engagement around global affairs and advocacy campaigns. You will monitor performance, respond to comments and messages, and coordinate content with the Media & Documentation division.",
        requirements: [
            "Hands-on experience managing a brand's or organization's social media accounts",
            'Familiarity with content scheduling and basic analytics tools',
            'Comfortable writing short-form captions and community responses in a consistent tone of voice',
            'Available for occasional live coverage of events outside standard hours',
        ].join('\n'),
        fields: [
            { id: null, name: 'Primary Social Media Handle', type: 'TEXT', category: 'OPTIONAL', options: [] },
            {
                id: null,
                name: 'Platforms Managed Before',
                type: 'CHOICE',
                category: 'OPTIONAL',
                options: ['Instagram', 'TikTok', 'X (Twitter)', 'Multiple platforms'],
            },
        ],
    },
    {
        title: 'Policy Research Assistant',
        division: 'Research & Policy Studies',
        description:
            "The Policy Research Assistant supports UNAI's research on global issues such as sustainable development, human rights, and peace and security, producing briefs and background material that inform our advocacy positions and public education activities.",
        requirements: [
            'Strong analytical and research skills, with the ability to synthesize information from multiple sources',
            'Familiarity with basic policy writing conventions and citation practices',
            'Interest in international relations, human rights, or sustainable development',
            'Able to commit to a regular weekly schedule for research tasks and team discussions',
        ].join('\n'),
        fields: [
            {
                id: null,
                name: 'Link to Published Writing or Research',
                type: 'TEXT',
                category: 'OPTIONAL',
                options: [],
            },
            {
                id: null,
                name: 'Area of Interest',
                type: 'CHOICE',
                category: 'OPTIONAL',
                options: ['Sustainable Development', 'Human Rights', 'Peace & Security', 'Climate & Environment'],
            },
        ],
    },
    {
        title: 'Event Coordinator',
        division: 'Events',
        description:
            "The Event Coordinator plans and runs UNAI's public forums, workshops, and commemorative events, handling logistics, vendor coordination, and on-site execution so that participants and speakers have a smooth experience from start to finish.",
        requirements: [
            'Experience helping organize an event, whether for a campus organization, community group, or workplace',
            'Strong organizational skills and attention to detail under time pressure',
            'Comfortable coordinating with vendors, venues, and volunteers',
            'Available on weekends or evenings when events are scheduled',
        ].join('\n'),
        fields: [
            {
                id: null,
                name: 'Prior Event Management Experience',
                type: 'TEXT',
                category: 'OPTIONAL',
                options: [],
            },
            {
                id: null,
                name: 'Available on Weekends',
                type: 'CHOICE',
                category: 'OPTIONAL',
                options: ['Yes', 'No'],
            },
        ],
    },
    {
        title: 'Partnership & External Relations Officer',
        division: 'External Relations & Partnerships',
        description:
            "The Partnership & External Relations Officer builds and maintains relationships with government agencies, embassies, other civil society organizations, and corporate partners that support UNAI's programs, helping to expand our reach and resources for global advocacy work.",
        requirements: [
            'Confident written and verbal communication, including with external stakeholders',
            'Comfortable drafting partnership proposals, letters, and follow-up correspondence',
            'Organized approach to tracking outreach and maintaining stakeholder relationships',
            'Prior experience in public relations, fundraising, or partnership development is an advantage',
        ].join('\n'),
        fields: [
            { id: null, name: 'LinkedIn Profile', type: 'TEXT', category: 'OPTIONAL', options: [] },
            {
                id: null,
                name: 'Foreign Language Proficiency',
                type: 'CHOICE',
                category: 'OPTIONAL',
                options: ['English', 'French', 'Other', 'None'],
            },
        ],
    },
    {
        title: 'English-Indonesian Translator',
        division: 'International Relations',
        description:
            "The Translator supports UNAI's international relations work by translating correspondence, policy documents, and event materials between English and Indonesian, ensuring accuracy in both everyday and diplomatic language.",
        requirements: [
            'Fluent in both English and Indonesian, written and spoken',
            'Experience translating formal or technical documents',
            'Attention to nuance in diplomatic and policy terminology',
            'Able to turn around translation requests within an agreed deadline',
        ].join('\n'),
        fields: [
            { id: null, name: 'TOEFL/IELTS Score', type: 'NUMBER', category: 'OPTIONAL', options: [] },
            { id: null, name: 'Translation Experience', type: 'TEXT', category: 'OPTIONAL', options: [] },
        ],
    },
    {
        title: 'Finance & Administration Officer',
        division: 'Finance & Administration',
        description:
            "The Finance & Administration Officer supports UNAI's day-to-day financial operations, including recording transactions, maintaining program budgets, and preparing basic financial reports for the Board and partner organizations.",
        requirements: [
            'Basic understanding of bookkeeping or financial record-keeping',
            'Comfortable working with spreadsheets for budgeting and reporting',
            'High attention to detail and honesty in handling organizational funds',
            'Background in accounting, finance, or a related field is an advantage',
        ].join('\n'),
        fields: [
            {
                id: null,
                name: 'Accounting/Finance Background',
                type: 'CHOICE',
                category: 'OPTIONAL',
                options: ['Yes', 'No'],
            },
            { id: null, name: 'Spreadsheet/Bookkeeping Tools Used', type: 'TEXT', category: 'OPTIONAL', options: [] },
        ],
    },
]

async function main(): Promise<void> {
    const prisma = getPrismaClient()
    const repository = new RecruitmentRepository()

    try {
        for (const input of RECRUITMENTS) {
            const existing = await prisma.recruitment.findFirst({ where: { title: input.title } })
            if (existing) {
                console.info(`Skipped (already exists): ${input.title}`)
                continue
            }

            const created = await repository.create(input)
            if (!created) {
                console.error(`Failed to create: ${input.title}`)
                continue
            }
            console.info(`Created: ${created.title} — ${created.division} (${created.id})`)
        }
    } finally {
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error('Seeding recruitments failed:', error)
    process.exit(1)
})

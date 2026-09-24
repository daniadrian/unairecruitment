// MVC layer boundary audit (MVC_GUIDELINES.md section 9, 06-stack-teknologi.md section 8).
// A Node version of the `rg` commands so it runs on Windows and Linux without ripgrep.
// No violations and exit code 0 mean the code complies.

import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const SOURCE_EXTENSIONS = ['.ts', '.tsx']

const checks = [
    {
        id: 'V-3, D-1',
        description: 'views and routing do not access repositories or infrastructure',
        include: (path) => path.startsWith('src/views/') || path.startsWith('src/app/'),
        pattern: /from\s+['"].*(models\/repositories\/|libs\/)/,
    },
    {
        id: 'C-5',
        description: 'controllers do not import views or the router',
        include: (path) => path.startsWith('src/controllers/'),
        pattern: /from\s+['"].*(views\/|next\/navigation)/,
    },
    {
        id: 'D-4',
        description: 'models do not import the layers above them',
        include: (path) => path.startsWith('src/models/') && !path.endsWith('.test.ts'),
        pattern: /from\s+['"].*(controllers\/|views\/|utils\/|stores\/)/,
    },
    {
        id: 'C-6, R-1',
        description: 'data clients are used only by repositories and infrastructure',
        include: (path) =>
            path.startsWith('src/') &&
            !path.startsWith('src/models/repositories/') &&
            !path.startsWith('src/libs/') &&
            !path.endsWith('.test.ts'),
        pattern: /libs\/(prisma|supabaseStorage)/,
    },
    {
        id: 'C-9',
        description: 'controllers do not import other controllers',
        include: (path) => path.startsWith('src/controllers/') && !path.endsWith('.test.ts'),
        pattern: /from\s+['"]\.[^'"]*[a-zA-Z]Controller/,
    },
    {
        id: 'U-2',
        description: 'utils do not import application layers',
        include: (path) => path.startsWith('src/utils/') && !path.endsWith('.test.ts'),
        pattern: /from\s+['"].*(controllers\/|models\/repositories\/|views\/|libs\/)/,
    },
    {
        id: 'L-4',
        description: 'infrastructure does not import application layers',
        include: (path) => path.startsWith('src/libs/'),
        pattern: /from\s+['"].*(controllers\/|models\/|views\/|utils\/)/,
    },
]

async function collectSourceFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true })
    const files = []
    for (const entry of entries) {
        const absolutePath = join(directory, entry.name)
        if (entry.isDirectory()) {
            files.push(...(await collectSourceFiles(absolutePath)))
            continue
        }
        if (SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension))) {
            files.push(absolutePath)
        }
    }
    return files
}

function isImportLine(line) {
    const trimmed = line.trim()
    return trimmed.startsWith('import ') || trimmed.startsWith('} from ') || trimmed.includes('require(')
}

function isTypeOnlyImport(line) {
    return /^\s*import\s+type\s/.test(line) || /^\s*import\s*\{\s*type\s/.test(line)
}

const sourceFiles = await collectSourceFiles(join(ROOT, 'src')).catch(() => [])
const violations = []

for (const absolutePath of sourceFiles) {
    const path = relative(ROOT, absolutePath).split(sep).join('/')
    const lines = readFileSync(absolutePath, 'utf8').split(/\r?\n/)

    for (const check of checks) {
        if (!check.include(path)) continue
        lines.forEach((line, index) => {
            if (!isImportLine(line)) return
            // D-2 and T-4: `import type` from entities and types is not a violation.
            if (isTypeOnlyImport(line)) return
            if (check.pattern.test(line)) {
                violations.push({ check, path, lineNumber: index + 1, line: line.trim() })
            }
        })
    }
}

if (violations.length > 0) {
    console.error(`Layer boundary audit found ${violations.length} violation(s):\n`)
    for (const violation of violations) {
        console.error(`  [${violation.check.id}] ${violation.path}:${violation.lineNumber}`)
        console.error(`    ${violation.check.description}`)
        console.error(`    ${violation.line}\n`)
    }
    process.exit(1)
}

console.log(`Layer boundary audit: ${sourceFiles.length} files checked, no violations.`)

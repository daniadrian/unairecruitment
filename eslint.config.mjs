import next from 'eslint-config-next'
import tseslint from 'typescript-eslint'

// MVC layer boundaries are enforced automatically here (MVC_GUIDELINES.md section 9,
// 06-stack-teknologi.md section 8). `allowTypeImports` keeps `import type` from
// entities and types allowed (D-2, T-4).
const layerRule = (patterns) => ({
    '@typescript-eslint/no-restricted-imports': ['error', { patterns }],
})

const config = [
    {
        // ui-mockups/ holds the Claude Design reference files and their generated runtime (support.js).
        ignores: ['node_modules/**', '.next/**', 'prisma/generated/**', 'coverage/**', 'ui-mockups/**'],
    },
    ...next,
    {
        plugins: { '@typescript-eslint': tseslint.plugin },
    },
    {
        // V-3, D-1, C-5: routing and views may only go through controllers.
        files: ['src/app/**/*.{ts,tsx}', 'src/views/**/*.{ts,tsx}'],
        rules: layerRule([
            {
                group: ['**/models/repositories/*', '**/libs/*'],
                allowTypeImports: true,
                message: 'V-3: views and routing must not access repositories or infrastructure. Use a controller.',
            },
        ]),
    },
    {
        // C-5 and C-9.
        files: ['src/controllers/**/*.ts'],
        ignores: ['src/controllers/**/*.test.ts'],
        rules: layerRule([
            {
                group: ['**/views/**', 'next/navigation'],
                allowTypeImports: true,
                message: 'C-5: controllers must not import views or the router.',
            },
            {
                group: ['**/controllers/*', './*Controller', './*Controller.ts'],
                allowTypeImports: true,
                message: 'C-9: controllers must not import other controllers.',
            },
        ]),
    },
    {
        // D-4: models do not import the layers above them.
        files: ['src/models/**/*.ts'],
        ignores: ['src/models/**/*.test.ts'],
        rules: layerRule([
            {
                group: ['**/controllers/**', '**/views/**', '**/utils/**', '**/stores/**'],
                allowTypeImports: true,
                message: 'D-4: models must not import the layers above them.',
            },
        ]),
    },
    {
        // U-2: utils may only import types.
        files: ['src/utils/**/*.ts'],
        ignores: ['src/utils/**/*.test.ts'],
        rules: layerRule([
            {
                group: ['**/controllers/**', '**/models/repositories/**', '**/views/**', '**/libs/**'],
                allowTypeImports: true,
                message: 'U-2: utils must not import application layers.',
            },
        ]),
    },
    {
        // L-4: infrastructure does not import application layers.
        files: ['src/libs/**/*.ts'],
        rules: layerRule([
            {
                group: ['**/controllers/**', '**/models/**', '**/views/**', '**/utils/**'],
                allowTypeImports: true,
                message: 'L-4: infrastructure must not import application layers.',
            },
        ]),
    },
]

export default config

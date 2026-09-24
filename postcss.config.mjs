// KS-09: Tailwind CSS v4 runs through PostCSS; design tokens live in src/app/globals.css.
const config = {
    plugins: {
        '@tailwindcss/postcss': {},
    },
}

export default config

// AB-10: built-in application form fields, fixed and not editable by admins.
// Used to ensure custom field names do not clash with built-in fields (AB-11).
export const BUILT_IN_FIELD_NAMES = ['Name', 'Email', 'Contact Number', 'Motivation', 'CV'] as const

export function normalizeFieldName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isBuiltInFieldName(name: string): boolean {
    const normalized = normalizeFieldName(name)
    return BUILT_IN_FIELD_NAMES.some((builtIn) => normalizeFieldName(builtIn) === normalized)
}

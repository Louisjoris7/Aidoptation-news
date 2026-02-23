export interface ManagedTopic {
    name: string;
    active: boolean;
    isCompany: boolean;
}

export const KNOWN_COMPANIES = [
    'waymo', 'cruise', 'tesla', 'nvidia', 'mobileye',
    'apollo', 'wayve', 'rivian', 'zoox', 'pony.ai',
    'nuro', 'aurora', 'lucid', 'byd', 'nio', 'xpeng'
];

/**
 * Normalizes a topic (string or object) into a ManagedTopic object.
 * Infers isCompany from a list of known names if not explicitly provided.
 */
export function normalizeTopic(t: string | ManagedTopic): ManagedTopic {
    if (typeof t === 'string') {
        const name = t.toLowerCase().trim().replace(/\s+/g, '-');
        return {
            name,
            active: true,
            isCompany: KNOWN_COMPANIES.includes(name)
        };
    }

    const name = t.name.toLowerCase().trim().replace(/\s+/g, '-');
    return {
        ...t,
        name,
        isCompany: t.isCompany ?? KNOWN_COMPANIES.includes(name)
    };
}

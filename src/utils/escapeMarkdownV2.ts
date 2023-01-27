const MARKDOWN_REPLACEMENTS: [
    RegExp, string
][] = [
    [
        /\./gi,  '\\.',
    ],
    [
        /-/gi, '\\-'
    ],
    [
        /\(/gi, '\\(',
    ],
    [
        /\)/gi, '\\)',
    ],
];

export const escapeMarkdownV2 = (message: string): string => {
    return MARKDOWN_REPLACEMENTS.reduce<string>((carry, [search, replace]) => {
        return carry.replace(search, replace);
    }, message);
};
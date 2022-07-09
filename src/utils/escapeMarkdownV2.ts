export const escapeMarkdownV2 = (message: string): string => {
    return message.replace(/\./gi, '\\.').replace(/-/gi, '\\-');
};
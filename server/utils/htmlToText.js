import sanitizeHtml from 'sanitize-html';

/**
 * Robust utility to strip HTML tags and convert structure to plain text.
 * Uses sanitize-html to properly handle non-visible elements like <style> and <script>.
 */
export const stripHtml = (html) => {
    if (!html) return "";

    // 1. Pre-process common block tags to ensure spacing
    let text = html.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<\/p>/gi, "\n\n");
    text = text.replace(/<\/div>/gi, "\n");
    text = text.replace(/<\/h[1-6]>/gi, "\n\n");

    // 2. Use sanitize-html to remove all tags and their "invisible" content (style, script)
    const clean = sanitizeHtml(text, {
        allowedTags: [], // remove everything
        allowedAttributes: {},
        disallowedTagsMode: 'discard' // this ensures <style>content</style> is discarded including content
    });

    // 3. Decode entities and cleanup whitespace
    return clean
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .trim();
};

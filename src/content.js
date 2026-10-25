import { categories, documentEntries } from '../content.config';
const sources = import.meta.glob('../docs/**/*.md', { query: '?raw', import: 'default', eager: true });
export function documentRoute(file) {
    if (file === 'index.md')
        return '/introduction/';
    return `/${file.replace(/index\.md$/, '').replace(/\.md$/, '/')}`;
}
export const documents = documentEntries.map(entry => {
    const source = sources[`../docs/${entry.file}`];
    if (source === undefined)
        throw new Error(`Missing Markdown document: ${entry.file}`);
    const category = categories.find(item => item.id === entry.category);
    if (!category)
        throw new Error(`Unknown category for ${entry.file}`);
    return {
        ...entry,
        source,
        route: documentRoute(entry.file),
        categoryTitle: category.title,
        updatedAt: __DOCUMENT_DATES__[entry.file],
        readingMinutes: Math.max(1, Math.ceil(source.split(/\s+/).length / 220)),
        searchable: `${entry.title} ${category.title} ${source}`.toLowerCase(),
    };
});
export const documentById = new Map(documents.map(doc => [doc.id, doc]));
export const documentByRoute = new Map(documents.map(doc => [doc.route, doc]));
export const documentByFile = new Map(documents.map(doc => [doc.file, doc]));
export function searchDocuments(query) {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length)
        return documents;
    return documents
        .filter(doc => words.every(word => doc.searchable.includes(word)))
        .map(doc => ({
        doc,
        score: words.reduce((score, word) => score + (doc.title.toLowerCase().includes(word) ? 10 : 0)
            + (doc.categoryTitle.toLowerCase().includes(word) ? 3 : 0), 0),
    }))
        .sort((a, b) => b.score - a.score)
        .map(result => result.doc);
}

import { describe, expect, it } from 'vitest';
import { documentByFile, documentRoute, documents, searchDocuments } from './content';
import { documentEntries } from '../content.config';

describe('Markdown catalog', () => {
    it('preserves every existing learning document and unique route', () => {
        expect(documents).toHaveLength(documentEntries.length);
        expect(new Set(documents.map(doc => doc.route)).size).toBe(documents.length);
        for (const doc of documents) {
            expect(doc.source.trim().length).toBeGreaterThan(0);
            expect(doc.readingMinutes).toBeGreaterThan(0);
            expect(Number.isNaN(Date.parse(doc.updatedAt))).toBe(false);
        }
    });
    it('preserves existing document URLs and the original home walkthrough', () => {
        expect(documentRoute('01-thinking.md')).toBe('/01-thinking/');
        expect(documentRoute('designs/url-shortener/index.md')).toBe('/designs/url-shortener/');
        expect(documentRoute('index.md')).toBe('/introduction/');
        expect(documentByFile.get('index.md').source).toContain('A first look inside a shopping app');
    });
    it('searches titles, categories and full document text', () => {
        expect(searchDocuments('Requirements')[0].id).toBe('requirements');
        expect(searchDocuments('FOR UPDATE').some(doc => doc.id === 'library-sql')).toBe(true);
        expect(searchDocuments('foundations')[0].category).toBe('foundations');
        expect(searchDocuments('zzzz-no-document')).toEqual([]);
    });
});

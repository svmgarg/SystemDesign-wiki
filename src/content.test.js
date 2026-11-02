import { describe, expect, it } from 'vitest';
import { documentByFile, documentById, documentRedirects, documentRoute, documents, resolveDocumentRedirect, searchDocuments } from './content';
import { documentEntries } from '../content.config';

describe('Markdown catalog', () => {
    it('preserves every existing learning document and unique route', () => {
        expect(documents).toHaveLength(documentEntries.length);
        expect(new Set(documents.map(doc => doc.route)).size).toBe(documents.length);
        for (const doc of documents) {
            expect(doc.source.trim().length).toBeGreaterThan(0);
            expect(doc.readingMinutes).toBeGreaterThan(0);
            expect(Number.isNaN(Date.parse(doc.updatedAt))).toBe(false);
            if (doc.parent) expect(documentById.has(doc.parent)).toBe(true);
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
    it('keeps one canonical networking guide with searchable direct children and legacy parent redirects', () => {
        const networking = documentById.get('networking');
        expect(networking.route).toBe('/02-requests/');
        expect(networking.parent).toBeUndefined();
        expect(documentById.has('networking-realtime')).toBe(false);
        expect(searchDocuments('TCP head-of-line blocking').map(doc => doc.id)).toEqual([networking.id]);
        for (const [id, query] of [['sse', 'Last-Event-ID'], ['websocket', 'Sec-WebSocket-Accept']]) {
            const child = documentById.get(id);
            expect(child.parent).toBe(networking.id);
            expect(child.category).toBe('foundations');
            expect(child.file).toBe(`02-requests-realtime/${id}/index.md`);
            expect(child.route).toBe(`/02-requests-realtime/${id}/`);
            expect(documentByFile.get(child.file)).toBe(child);
            expect(searchDocuments(query).map(doc => doc.id)).toEqual(expect.arrayContaining([networking.id, child.id]));
            expect(resolveDocumentRedirect(child.route)).toBeNull();
        }
        for (const route of ['/02-requests-realtime/', '/02-requests-alternate/']) {
            expect(resolveDocumentRedirect(route, '?view=reading', '#what-is-http'))
                .toBe(`${networking.route}?view=reading#what-is-http`);
        }
        for (const redirect of documentRedirects) {
            expect(documents.some(doc => doc.route === redirect.from)).toBe(false);
            expect(documents.some(doc => doc.route === redirect.to)).toBe(true);
            expect(resolveDocumentRedirect(redirect.to)).toBeNull();
        }
        expect(resolveDocumentRedirect(networking.route)).toBeNull();
    });
});

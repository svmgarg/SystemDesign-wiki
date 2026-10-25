// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { loadExcalidraw, parseExcalidraw } from './excalidraw';

describe('Read-only Excalidraw sources', () => {
    it.each([
        'docs/assets/DistributedCache.excalidraw',
        'docs/designs/ticket-booking/assets/TicketMaster.excalidraw',
        'docs/designs/uber/assets/Uber_Design.excalidraw',
    ])('loads the original %s without mutating it', file => {
        const value = JSON.parse(readFileSync(file, 'utf8'));
        const original = JSON.stringify(value);
        const parsed = parseExcalidraw(value);
        expect(parsed.elements.length).toBeGreaterThan(0);
        expect(parsed.elements.every(element => !element.isDeleted)).toBe(true);
        expect(parsed.elements.length).toBe(value.elements.filter(element => !element.isDeleted).length);
        expect(JSON.stringify(value)).toBe(original);
    });
    it('reports malformed and empty boards explicitly', () => {
        expect(() => parseExcalidraw({})).toThrow('not a valid Excalidraw');
        expect(() => parseExcalidraw({ type: 'excalidraw', elements: [null] })).toThrow('invalid element');
        expect(() => parseExcalidraw({ type: 'excalidraw', elements: [] })).toThrow('no visible elements');
        expect(() => parseExcalidraw({
            type: 'excalidraw', elements: [{ id: 'a', type: 'rectangle', isDeleted: true }],
        })).toThrow('no visible elements');
    });
    it('rejects missing or externally hosted drawing images', () => {
        const image = { id: 'a', type: 'image', fileId: 'file-a' };
        expect(() => parseExcalidraw({ type: 'excalidraw', elements: [image] })).toThrow('embedded image is missing');
        expect(() => parseExcalidraw({
            type: 'excalidraw', elements: [image],
            files: { 'file-a': { dataURL: 'https://example.org/image.png' } },
        })).toThrow('must be embedded');
    });
    it('does not fetch sources from another website', async () => {
        const fetch = vi.fn();
        vi.stubGlobal('fetch', fetch);
        try {
            await expect(loadExcalidraw('https://example.org/board.excalidraw', new AbortController().signal)).rejects.toThrow('locally');
            expect(fetch).not.toHaveBeenCalled();
        } finally {
            vi.unstubAllGlobals();
        }
    });
});

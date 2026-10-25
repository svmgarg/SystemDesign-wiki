// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import MarkdownIt from 'markdown-it';
import { documentById, documents } from './content';
import { renderDocument, resolveContentUrl } from './markdown';

describe('Markdown reading components', () => {
    it('renders every document with a single external title and generated heading anchors', () => {
        for (const doc of documents) {
            const rendered = renderDocument(doc);
            const element = document.createElement('div');
            element.innerHTML = rendered.html;
            expect(rendered.title).toBeTruthy();
            expect(element.querySelector('h1')).toBeNull();
            expect(new Set(rendered.headings.map(item => item.id)).size).toBe(rendered.headings.length);
            for (const heading of rendered.headings) {
                expect(element.querySelector(`[id="${heading.id}"]`)).not.toBeNull();
            }
        }
    });
    it('preserves code blocks, scrollable tables, callouts and expandable answers', () => {
        const requirements = renderDocument(documentById.get('requirements'));
        expect(requirements.html).toContain('class="callout callout-abstract"');
        expect(requirements.html).toContain('<details');
        expect(requirements.html).toContain('data-copy-code');
        expect(requirements.html).toContain('class="table-scroll"');
        const sql = renderDocument(documentById.get('library-sql'));
        const element = document.createElement('div');
        element.innerHTML = sql.html;
        expect(element.querySelector('.code-block pre').textContent).toContain('FOR UPDATE;');
        const originalCodeBlocks = new MarkdownIt().parse(documentById.get('library-sql').source, {}).filter(token => token.type === 'fence');
        expect(element.querySelectorAll('.code-block')).toHaveLength(originalCodeBlocks.length);
        expect([...element.querySelectorAll('.code-block code')].map(code => code.textContent)).toEqual(originalCodeBlocks.map(token => token.content));
    });
    it('resolves local diagrams and cross-document links without altering the source', () => {
        expect(resolveContentUrl('assets/overview.svg', 'designs/url-shortener/index.md')).toBe('/designs/url-shortener/assets/overview.svg');
        expect(resolveContentUrl('../../04-scaling.md', 'designs/url-shortener/index.md')).toBe('/04-scaling/');
        expect(resolveContentUrl('index.md#a-first-look-inside-a-shopping-app', '01-thinking.md')).toBe('/introduction/#a-first-look-inside-a-shopping-app');
        expect(resolveContentUrl('#api-and-data', 'designs/url-shortener/index.md')).toBe('/designs/url-shortener/#api-and-data');
    });
    it('keeps system designs consistent and horizontal diagrams source-relative', () => {
        const designs = documents.filter(doc => doc.category === 'designs' && !doc.parent);
        for (const doc of designs) {
            const rendered = renderDocument(doc);
            expect(rendered.headings.slice(0, 3).map(heading => heading.title)).toEqual([
                'Basic description', 'Functional requirements', 'Non-functional requirements',
            ]);
            const element = document.createElement('div');
            element.innerHTML = rendered.html;
            for (const title of ['Functional requirements', 'Non-functional requirements']) {
                const heading = [...element.querySelectorAll('h2')].find(node => node.textContent === title);
                let next = heading.nextElementSibling;
                while (next && next.tagName !== 'UL' && next.tagName !== 'H2') next = next.nextElementSibling;
                expect(next?.tagName).toBe('UL');
                expect(next.children.length).toBeGreaterThan(3);
            }
            const diagrams = element.querySelectorAll('.diagram-scroll');
            expect(diagrams.length).toBeGreaterThan(0);
            for (const diagram of diagrams) {
                expect(diagram.getAttribute('tabindex')).toBe('0');
                expect(diagram.getAttribute('aria-label')).toBeTruthy();
                const image = diagram.querySelector('a > img');
                expect(image).not.toBeNull();
                expect(image.getAttribute('src')).toMatch(/^\/(?:assets|designs)\//);
                expect(image.parentElement.getAttribute('href')).toBe(image.getAttribute('src'));
            }
        }
    });
    it('links the separate Uber architecture and matching notes', () => {
        const overview = documentById.get('uber');
        const matching = documentById.get('uber-matching');
        expect(matching.parent).toBe(overview.id);
        expect(resolveContentUrl('Uber-Driver-Matching.md', overview.file)).toBe(matching.route);
        expect(resolveContentUrl('Uber-System-Design.md', matching.file)).toBe(overview.route);
        expect(renderDocument(overview).html).toContain(`href="${matching.route}"`);
        expect(renderDocument(matching).html).toContain(`href="${overview.route}"`);
    });
    it('sanitizes HTML without breaking legitimate diagrams and copy controls', () => {
        const rendered = renderDocument({
            ...documentById.get('requirements'),
            source: '# Test\n\n<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n[bad](javascript:alert(1))\n',
        });
        expect(rendered.html).not.toContain('<script');
        expect(rendered.html).not.toContain('onerror');
        expect(rendered.html).not.toContain('href="javascript:');
    });
    it('creates read-only Excalidraw slots instead of broken image tags', () => {
        for (const id of ['distributed-cache', 'ticket-booking', 'uber', 'url-shortener']) {
            const element = document.createElement('div');
            element.innerHTML = renderDocument(documentById.get(id)).html;
            const slot = element.querySelector('[data-excalidraw-src]');
            expect(slot).not.toBeNull();
            expect(slot.dataset.excalidrawSrc).toMatch(/^\/.*\.excalidraw$/);
            expect(slot.dataset.excalidrawTitle).toBeTruthy();
            expect(element.querySelector('img[src$=".excalidraw"]')).toBeNull();
        }
    });
});

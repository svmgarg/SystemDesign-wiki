// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
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
    it('keeps article links, diagram sources and downloads under the Pages base path', () => {
        const base = '/SystemDesign-wiki/';
        expect(resolveContentUrl('../../04-scaling.md#caching', 'designs/url-shortener/index.md', base)).toBe('/SystemDesign-wiki/04-scaling/#caching');
        expect(resolveContentUrl('../assets/DistributedCache.excalidraw', 'designs/distributed-cache.md', base)).toBe('/SystemDesign-wiki/assets/DistributedCache.excalidraw');
        expect(resolveContentUrl('#api-and-data', 'designs/url-shortener/index.md', base)).toBe('/SystemDesign-wiki/designs/url-shortener/#api-and-data');
        expect(resolveContentUrl('https://example.com/image.svg', 'index.md', base)).toBe('https://example.com/image.svg');
    });
    it('keeps the canonical networking guide self-contained with the preferred HTTP sequences and packet-loss coverage', () => {
        const networking = documentById.get('networking');
        expect(networking.route).toBe('/02-requests/');
        const element = document.createElement('div');
        element.innerHTML = renderDocument(networking).html;
        const images = [...element.querySelectorAll('img')];
        expect(images.length).toBeGreaterThan(0);
        for (const image of images) {
            const source = image.getAttribute('src');
            expect(source.startsWith(`${networking.route}assets/`)).toBe(true);
            expect(existsSync(resolve('docs', source.slice(1)))).toBe(true);
            expect(image.parentElement.getAttribute('href')).toBe(source);
        }
        for (const id of ['requirements', 'storage', 'messaging']) {
            expect(element.querySelector(`a[href="${documentById.get(id).route}"]`)).not.toBeNull();
        }
        for (const id of ['introduction', 'requirements', 'exercises', 'multipart-uploads']) {
            expect(renderDocument(documentById.get(id)).html).toContain(`href="${networking.route}"`);
        }
        expect(resolveContentUrl('assets/http-versions.svg', networking.file, '/SystemDesign-wiki/'))
            .toBe('/SystemDesign-wiki/02-requests/assets/http-versions.svg');
        for (const asset of ['http-lifecycle', 'http-1-0-lifecycle', 'http-2-lifecycle', 'http-3-lifecycle', 'http-versions', 'http-loss-comparison']) {
            expect(element.querySelector(`img[src="${networking.route}assets/${asset}.svg"]`)).not.toBeNull();
        }
        expect(element.querySelector('h3[id="what-happens-if-a-packet-is-lost"]')).not.toBeNull();
        expect(networking.source).toContain('Already delivered data is not taken back');
        expect(networking.source).toContain('QPACK header dependencies');
        for (const doc of documents) {
            expect(doc.source).not.toContain('02-requests-realtime/index.md');
        }
    });
    it('preserves inline protocols and links standalone children with valid anchors and page-local diagrams', () => {
        const doc = documentById.get('networking');
        const element = document.createElement('div');
        element.innerHTML = renderDocument(doc).html;
        for (const anchor of ['server-sent-events-sse', 'websocket']) {
            expect(element.querySelector(`h2[id="${anchor}"]`)).not.toBeNull();
            expect(element.querySelector(`a[href="${doc.route}#${anchor}"]`)).not.toBeNull();
        }
        for (const id of ['sse', 'websocket']) {
            const child = documentById.get(id);
            expect(element.querySelector(`a[href="${child.route}"]`)).not.toBeNull();
            const childElement = document.createElement('div');
            childElement.innerHTML = renderDocument(child).html;
            expect(childElement.querySelector(`a[href="${doc.route}"]`)).not.toBeNull();
            const sibling = documentById.get(id === 'sse' ? 'websocket' : 'sse');
            expect(childElement.querySelector(`a[href="${sibling.route}"]`)).not.toBeNull();
        }
        for (const page of [doc, documentById.get('sse'), documentById.get('websocket')]) {
            const pageElement = document.createElement('div');
            pageElement.innerHTML = renderDocument(page).html;
            const images = [...pageElement.querySelectorAll('img')];
            expect(images.length).toBeGreaterThan(0);
            for (const image of images) {
                const source = image.getAttribute('src');
                expect(source.startsWith(`${page.route}assets/`)).toBe(true);
                expect(existsSync(resolve('docs', source.slice(1)))).toBe(true);
                expect(image.parentElement.getAttribute('href')).toBe(source);
            }
            for (const link of pageElement.querySelectorAll('a[href^="/"]')) {
                const url = new URL(link.getAttribute('href'), 'https://wiki.local');
                if (url.pathname.endsWith('.svg')) continue;
                const target = documents.find(item => item.route === url.pathname);
                expect(target, `Missing page for ${link.getAttribute('href')} in ${page.file}`).toBeDefined();
                if (url.hash) {
                    expect(renderDocument(target).headings.some(heading => heading.id === url.hash.slice(1))).toBe(true);
                }
            }
        }
    });
    it('keeps streaming examples open until their cleanup function is called', () => {
        for (const [id, api, cleanup] of [
            ['networking', 'EventSource', 'stopEvents'],
            ['networking', 'WebSocket', 'disconnect'],
            ['sse', 'EventSource', 'stopEvents'],
            ['websocket', 'WebSocket', 'disconnect'],
        ]) {
            const instances = [];
            class Channel {
                static CLOSED = 2;
                constructor() {
                    this.readyState = 1;
                    this.closed = false;
                    instances.push(this);
                }
                addEventListener() {}
                send() {}
                close() { this.closed = true; }
            }
            const example = new MarkdownIt().parse(documentById.get(id).source, {})
                .find(token => token.type === 'fence' && token.info === 'javascript' && token.content.includes(`new ${api}(`));
            const context = { [api]: Channel, console: { log() {} } };
            runInNewContext(example.content, context);
            expect(instances).toHaveLength(1);
            expect(instances[0].closed).toBe(false);
            context[cleanup]();
            expect(instances[0].closed).toBe(true);
        }
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
    it('links the ad-click design from the learning index with a page-local downloadable diagram', () => {
        const doc = documentById.get('ad-click-aggregator');
        expect(renderDocument(documentById.get('introduction')).html).toContain(`href="${doc.route}"`);
        const element = document.createElement('div');
        element.innerHTML = renderDocument(doc).html;
        const image = element.querySelector('.diagram-scroll a > img');
        expect(image).not.toBeNull();
        const source = image.getAttribute('src');
        expect(source.startsWith(`${doc.route}assets/`)).toBe(true);
        expect(existsSync(resolve('docs', source.slice(1)))).toBe(true);
        expect(image.parentElement.getAttribute('href')).toBe(source);
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

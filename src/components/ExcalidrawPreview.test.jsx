// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExcalidrawPreview } from './ExcalidrawPreview';
import { loadExcalidraw } from '../excalidraw';

vi.mock('../excalidraw', () => ({ loadExcalidraw: vi.fn() }));

const dialogMethods = Object.fromEntries(['showModal', 'close'].map(name =>
    [name, Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name)]));
let root;
let container;

beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('IntersectionObserver', class {
        constructor(callback) { this.callback = callback; }
        observe() { this.callback([{ isIntersecting: true }]); }
        disconnect() {}
    });
    vi.stubGlobal('ResizeObserver', class {
        constructor(callback) { this.callback = callback; }
        observe(element) {
            this.callback([{ contentRect: element.closest('dialog')
                ? { width: 1280, height: 800 } : { width: 800, height: 400 } }]);
        }
        disconnect() {}
    });
    vi.stubGlobal('URL', class extends URL {
        static createObjectURL = vi.fn(() => 'blob:diagram-preview');
        static revokeObjectURL = vi.fn();
    });
    Object.defineProperties(HTMLDialogElement.prototype, {
        showModal: { configurable: true, value() { this.open = true; } },
        close: { configurable: true, value() {
            this.open = false;
            this.dispatchEvent(new Event('close'));
        } },
    });
    vi.mocked(loadExcalidraw).mockReset().mockResolvedValue({
        blob: new Blob(['<svg/>'], { type: 'image/svg+xml' }), width: 2000, height: 1000,
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    for (const [name, descriptor] of Object.entries(dialogMethods)) {
        if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
        else delete HTMLDialogElement.prototype[name];
    }
    vi.unstubAllGlobals();
});

async function renderPreview() {
    await act(async () => root.render(<ExcalidrawPreview
      source="/designs/uber/assets/Uber_Design.excalidraw" title="Uber architecture"/>));
}

async function click(element) {
    expect(element).toBeTruthy();
    await act(async () => element.click());
}

describe('Expanded Excalidraw preview', () => {
    it('opens a labelled overlay with independent zoom and downloads without reloading the drawing', async () => {
        await renderPreview();
        await click([...container.querySelectorAll('button')].find(button => button.textContent === '100%'));
        const inlineImage = container.querySelector('img');
        expect(inlineImage.style.width).toBe('2000px');
        await click(container.querySelector('[aria-label="Expand diagram"]'));
        const dialog = document.querySelector('dialog');
        expect(dialog.open).toBe(true);
        expect(dialog.getAttribute('aria-label')).toBe('Uber architecture: expanded diagram');
        expect(dialog.querySelector('img').style.width).toBe('1248px');
        expect(dialog.querySelector('a[download]').getAttribute('href')).toBe('/designs/uber/assets/Uber_Design.excalidraw');
        expect(dialog.querySelector('a[download="diagram.svg"]')).not.toBeNull();
        await click(dialog.querySelector('[aria-label="Zoom in diagram"]'));
        expect(dialog.querySelector('img').style.width).toBe('1560px');
        expect(inlineImage.style.width).toBe('2000px');
        expect(loadExcalidraw).toHaveBeenCalledOnce();
        await click(dialog.querySelector('[aria-label="Close expanded diagram"]'));
        expect(dialog.open).toBe(false);
        expect(dialog.querySelector('.excalidraw-board')).toBeNull();
        expect(inlineImage.style.width).toBe('2000px');
    });

    it('handles native dialog dismissal and can open again afterward', async () => {
        await renderPreview();
        const expand = container.querySelector('[aria-label="Expand diagram"]');
        await click(expand);
        const dialog = document.querySelector('dialog');
        await act(async () => dialog.close());
        expect(dialog.open).toBe(false);
        expect(dialog.querySelector('.excalidraw-board')).toBeNull();
        await click(expand);
        expect(dialog.open).toBe(true);
        expect(dialog.querySelector('img')).not.toBeNull();
    });

    it('does not allow expansion before the drawing is ready', async () => {
        vi.mocked(loadExcalidraw).mockReturnValue(new Promise(() => {}));
        await renderPreview();
        const expand = container.querySelector('[aria-label="Expand diagram"]');
        expect(expand.disabled).toBe(true);
        await click(expand);
        expect(document.querySelector('dialog').open).toBe(false);
    });
});

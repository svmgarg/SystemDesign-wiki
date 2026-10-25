import DOMPurify from 'dompurify';

export function parseExcalidraw(value) {
    if (!value || value.type !== 'excalidraw' || !Array.isArray(value.elements)) {
        throw new Error('This file is not a valid Excalidraw drawing.');
    }
    if (value.elements.some(element => !element || typeof element !== 'object'
        || typeof element.id !== 'string' || typeof element.type !== 'string')) {
        throw new Error('The drawing contains an invalid element.');
    }
    if (value.appState != null && (typeof value.appState !== 'object' || Array.isArray(value.appState))) {
        throw new Error('The drawing has invalid settings.');
    }
    const files = value.files ?? {};
    if (typeof files !== 'object' || Array.isArray(files)) {
        throw new Error('The drawing has invalid embedded image data.');
    }
    for (const file of Object.values(files)) {
        if (!file || typeof file.dataURL !== 'string' || !file.dataURL.startsWith('data:image/')) {
            throw new Error('Drawing images must be embedded in the Excalidraw file, not loaded from another website.');
        }
    }
    const elements = value.elements.filter(element => element && !element.isDeleted);
    if (!elements.length) throw new Error('This drawing has no visible elements.');
    for (const element of elements) {
        if (element.type === 'image' && !files[element.fileId]) {
            throw new Error('An embedded image is missing from this drawing.');
        }
    }
    return { elements, files, appState: value.appState ?? {} };
}

export async function loadExcalidraw(source, signal) {
    const url = new URL(source, window.location.href);
    if (url.origin !== window.location.origin || !/\.excalidraw$/i.test(url.pathname)) {
        throw new Error('Store the .excalidraw file locally in this wiki to preview it.');
    }
    const response = await fetch(url, { signal, cache: 'no-cache' });
    if (!response.ok) throw new Error(`The drawing could not be loaded (HTTP ${response.status}).`);
    const scene = parseExcalidraw(await response.json());
    signal.throwIfAborted();
    window.EXCALIDRAW_ASSET_PATH = `${window.location.origin}${import.meta.env.BASE_URL}excalidraw-assets/`;
    const { exportToSvg, restoreElements } = await import('@excalidraw/excalidraw');
    signal.throwIfAborted();
    const svg = await exportToSvg({
        elements: restoreElements(scene.elements, null, { refreshDimensions: false }),
        files: scene.files,
        appState: {
            ...scene.appState,
            exportBackground: true,
            exportWithDarkMode: false,
            exportEmbedScene: false,
        },
        exportPadding: 24,
    });
    signal.throwIfAborted();
    const width = Number(svg.getAttribute('width'));
    const height = Number(svg.getAttribute('height'));
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        throw new Error('The drawing could not be sized for preview.');
    }
    const markup = DOMPurify.sanitize(svg.outerHTML, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: ['style'],
    });
    return { blob: new Blob([markup], { type: 'image/svg+xml' }), width, height };
}

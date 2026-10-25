import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { documentEntries } from './content.config';
import { site } from './site.config';
export default defineConfig({
    plugins: [
        react(),
        {
            name: 'wiki-identity',
            transformIndexHtml() {
                return [
                    { tag: 'title', children: site.name, injectTo: 'head' },
                    { tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: site.logo }, injectTo: 'head' },
                    { tag: 'meta', attrs: { name: 'description', content: site.description }, injectTo: 'head' },
                ];
            },
        },
        {
            name: 'wiki-excalidraw-reload',
            handleHotUpdate({ file, server }) {
                if (file.endsWith('.excalidraw')) {
                    server.ws.send({ type: 'full-reload' });
                    return [];
                }
            },
        },
    ],
    publicDir: 'docs',
    define: {
        __DOCUMENT_DATES__: JSON.stringify(Object.fromEntries(documentEntries.map(doc => doc.file).map(file => {
            const path = resolve('docs', file);
            return [file, statSync(path).mtime.toISOString()];
        }))),
    },
    server: {
        host: '127.0.0.1',
        port: 8001,
        strictPort: true,
        watch: { ignored: ['**/.node/**', '**/excalidraw-assets/**'] },
    },
    preview: { host: '127.0.0.1', port: 8001, strictPort: true },
});

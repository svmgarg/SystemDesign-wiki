import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { categories, documentEntries } from './content.config';
import { site } from './site.config';
export default defineConfig({
    base: process.env.PAGES_BASE_PATH || '/',
    plugins: [
        react(),
        {
            name: 'wiki-identity',
            transformIndexHtml() {
                return [
                    { tag: 'title', children: site.name, injectTo: 'head' },
                    { tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: `${process.env.PAGES_BASE_PATH || '/'}${site.logo.replace(/^\//, '')}` }, injectTo: 'head' },
                    { tag: 'meta', attrs: { name: 'description', content: site.description }, injectTo: 'head' },
                ];
            },
        },
        {
            name: 'wiki-static-routes',
            writeBundle({ dir }) {
                const output = resolve(dir || 'dist');
                const routes = [
                    'documents', 'recent', 'bookmarks', 'concepts',
                    ...categories.map(category => `topics/${category.id}`),
                    ...documentEntries.map(doc => doc.file === 'index.md'
                        ? 'introduction'
                        : doc.file.replace(/index\.md$/, '').replace(/\.md$/, '')),
                ];
                for (const route of routes) {
                    const destination = resolve(output, route);
                    mkdirSync(destination, { recursive: true });
                    copyFileSync(resolve(output, 'index.html'), resolve(destination, 'index.html'));
                }
                copyFileSync(resolve(output, 'index.html'), resolve(output, '404.html'));
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

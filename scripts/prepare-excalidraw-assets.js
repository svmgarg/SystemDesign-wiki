import { cpSync, mkdirSync } from 'node:fs';

const source = new URL('../node_modules/@excalidraw/excalidraw/dist/prod/fonts/', import.meta.url);
const destination = new URL('../docs/excalidraw-assets/fonts/', import.meta.url);

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
console.log('Prepared local Excalidraw fonts.');

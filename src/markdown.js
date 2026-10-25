import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import http from 'highlight.js/lib/languages/http';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import yaml from 'highlight.js/lib/languages/yaml';
import { documentByFile } from './content';
for (const [name, language] of Object.entries({ bash, http, javascript, json, plaintext, python, sql, typescript, yaml })) {
    hljs.registerLanguage(name, language);
}
export function resolveContentUrl(value, sourceFile, baseUrl = import.meta.env.BASE_URL) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value))
        return value;
    const url = new URL(value, `https://wiki.local/${sourceFile}`);
    const doc = documentByFile.get(decodeURIComponent(url.pathname.slice(1)));
    return `${baseUrl.replace(/\/$/, '')}${doc?.route ?? url.pathname}${url.search}${url.hash}`;
}
export function renderDocument(doc) {
    const parser = new MarkdownIt({ html: true, linkify: true });
    const escape = parser.utils.escapeHtml;
    const headings = [];
    const used = new Map();
    const headingOpen = parser.renderer.rules.heading_open;
    parser.renderer.rules.heading_open = (tokens, index, options, env, renderer) => {
        const title = tokens[index + 1].children?.filter(token => token.type !== 'html_inline')
            .map(token => token.content).join('') || tokens[index + 1].content;
        const base = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'section';
        const count = used.get(base) ?? 0;
        used.set(base, count + 1);
        const id = count ? `${base}_${count}` : base;
        tokens[index].attrSet('id', id);
        const level = Number(tokens[index].tag.slice(1));
        headings.push({ id, title, level });
        return headingOpen ? headingOpen(tokens, index, options, env, renderer) : renderer.renderToken(tokens, index, options);
    };
    const linkOpen = parser.renderer.rules.link_open;
    parser.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
        const token = tokens[index];
        const href = token.attrGet('href') ?? '';
        token.attrSet('href', resolveContentUrl(href, doc.file));
        if (/\.excalidraw(?:$|[?#])/.test(href))
            token.attrSet('download', '');
        if (/^https?:\/\//.test(href)) {
            token.attrSet('target', '_blank');
            token.attrSet('rel', 'noopener noreferrer');
        }
        return linkOpen ? linkOpen(tokens, index, options, env, renderer) : renderer.renderToken(tokens, index, options);
    };
    const image = parser.renderer.rules.image;
    parser.renderer.rules.image = (tokens, index, options, env, renderer) => {
        const source = resolveContentUrl(tokens[index].attrGet('src') ?? '', doc.file);
        if (/\.excalidraw(?:$|[?#])/i.test(source)) {
            const title = tokens[index].content || 'Excalidraw diagram';
            return `<span class="excalidraw-embed" data-excalidraw-src="${escape(source)}" data-excalidraw-title="${escape(title)}"></span>`;
        }
        tokens[index].attrSet('src', source);
        tokens[index].attrSet('loading', 'lazy');
        tokens[index].attrSet('decoding', 'async');
        return image ? image(tokens, index, options, env, renderer) : renderer.renderToken(tokens, index, options);
    };
    parser.renderer.rules.table_open = () => '<div class="table-scroll" role="region" aria-label="Scrollable table" tabindex="0"><table>';
    parser.renderer.rules.table_close = () => '</table></div>';
    parser.renderer.rules.fence = (tokens, index) => {
        const token = tokens[index];
        const language = token.info.trim().split(/\s+/)[0] || 'text';
        const code = hljs.getLanguage(language)
            ? hljs.highlight(token.content, { language, ignoreIllegals: true }).value
            : escape(token.content);
        return `<div class="code-block"><div class="code-toolbar"><span>${escape(language.toUpperCase())}</span><button type="button" data-copy-code aria-label="Copy ${escape(language)} code">Copy</button></div><pre><code class="hljs">${code}</code></pre></div>`;
    };
    function callouts(source) {
        const lines = source.split('\n');
        const output = [];
        let fence = '';
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
            if (marker) {
                if (!fence)
                    fence = marker[1][0];
                else if (marker[1][0] === fence)
                    fence = '';
            }
            const match = !fence && line.match(/^(!!!|\?\?\?\+?)\s+([\w-]+)(?:\s+"([^"]+)")?\s*$/);
            if (!match) {
                output.push(line);
                continue;
            }
            const body = [];
            while (index + 1 < lines.length) {
                const next = lines[index + 1];
                if (next.trim() && !next.startsWith('    '))
                    break;
                body.push(next.startsWith('    ') ? next.slice(4) : '');
                index++;
            }
            const type = ['note', 'info', 'warning', 'success', 'abstract', 'tip'].includes(match[2]) ? match[2] : 'note';
            const title = escape(match[3] || match[2]);
            const content = parser.render(callouts(body.join('\n').trim()));
            output.push(match[1].startsWith('???')
                ? `\n<details class="callout callout-${type}"${match[1].endsWith('+') ? ' open' : ''}><summary>${title}</summary><div>${content}</div></details>\n`
                : `\n<aside class="callout callout-${type}"><div class="callout-title">${title}</div><div>${content}</div></aside>\n`);
        }
        return output.join('\n');
    }
    const source = doc.source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
    const tokens = parser.parse(callouts(source), {});
    const firstHeading = tokens.findIndex(token => token.type === 'heading_open' && token.tag === 'h1');
    const title = firstHeading >= 0 ? tokens[firstHeading + 1].content : doc.title;
    if (firstHeading >= 0)
        tokens.splice(firstHeading, 3);
    const html = parser.renderer.render(tokens, parser.options, {});
    return { title, html: DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'download'] }), headings };
}

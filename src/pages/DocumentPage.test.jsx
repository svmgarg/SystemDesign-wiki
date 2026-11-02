// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { documentById } from '../content';
import { WorkspaceProvider } from '../workspace';
import { DocumentPage } from './DocumentPage';

describe('Document reading layout', () => {
    it('renders the article without a right-hand rail while retaining compact section navigation', () => {
        const doc = documentById.get('ad-click-aggregator');
        const element = document.createElement('div');
        element.innerHTML = renderToStaticMarkup(
            <WorkspaceProvider><MemoryRouter initialEntries={[doc.route]}>
                <DocumentPage doc={doc}/>
            </MemoryRouter></WorkspaceProvider>,
        );
        expect(element.querySelector('.document-layout > aside')).toBeNull();
        expect(element.querySelector('.learning-document h1').textContent).toBe('Ad Click Aggregator');
        expect(element.querySelector('.mobile-contents a[href="#architecture"]')).not.toBeNull();
        expect(element.querySelector('.prose #architecture')).not.toBeNull();
    });
});

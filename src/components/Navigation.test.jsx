// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Navigation';
import { WorkspaceProvider } from '../workspace';

const storageKey = 'system-design-wiki.workspace.v1';
let container;
let root;

function RouteControls() {
    const navigate = useNavigate();
    return <div>
    <button onClick={() => navigate('/designs/uber/Uber-Driver-Matching/')}>Open matching directly</button>
    <button onClick={() => navigate('/')}>Open home directly</button>
  </div>;
}

function seedWorkspace(overrides = {}) {
    localStorage.setItem(storageKey, JSON.stringify({
        theme: 'dark', bookmarks: [], recent: [], sidebarCollapsed: false,
        collapsedGroups: [], readingMode: false, ...overrides,
    }));
}

async function renderSidebar(path = '/', onNavigate = vi.fn()) {
    await act(async () => {
        root.render(<WorkspaceProvider><MemoryRouter initialEntries={[path]}>
          <Sidebar onNavigate={onNavigate}/><RouteControls/>
        </MemoryRouter></WorkspaceProvider>);
    });
}

function button(label) {
    return [...container.querySelectorAll('button')].find(element =>
        element.getAttribute('aria-label') === label || element.textContent === label);
}

async function click(element) {
    expect(element).toBeTruthy();
    await act(async () => element.click());
}

beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    localStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    vi.unstubAllGlobals();
});

describe('Documentation sidebar', () => {
    it('nests child documents under independently collapsible, persisted branches', async () => {
        await renderSidebar();
        const toggle = button('Collapse Storage');
        const children = container.querySelector(`[id="${toggle.getAttribute('aria-controls')}"]`);
        expect(children.querySelector('a').textContent).toBe('Apache Cassandra');
        await click(toggle);
        expect(children.hidden).toBe(true);
        expect(button('Expand Storage').getAttribute('aria-expanded')).toBe('false');
        expect(button('Collapse Uber System Design').getAttribute('aria-expanded')).toBe('true');
        expect(JSON.parse(localStorage.getItem(storageKey)).collapsedGroups).toContain('document:storage');
        await act(async () => root.unmount());
        root = createRoot(container);
        await renderSidebar();
        expect(button('Expand Storage').getAttribute('aria-expanded')).toBe('false');
    });

    it('opens the active document ancestors without preventing subsequent manual collapse', async () => {
        seedWorkspace({ collapsedGroups: ['designs', 'document:uber', 'practice'] });
        await renderSidebar('/designs/uber/Uber-Driver-Matching/');
        expect(button('System designs').getAttribute('aria-expanded')).toBe('true');
        expect(button('Collapse Uber System Design').getAttribute('aria-expanded')).toBe('true');
        expect(button('Practice').getAttribute('aria-expanded')).toBe('false');
        expect(container.querySelector('a[aria-current="page"]').textContent).toBe('Uber Driver Matching');
        await click(button('Collapse Uber System Design'));
        expect(button('Expand Uber System Design')).toBeTruthy();
        await click(button('Open home directly'));
        await click(button('Open matching directly'));
        expect(button('Collapse Uber System Design')).toBeTruthy();
    });

    it('keeps the navigation callback for closing the mobile drawer on link selection', async () => {
        const onNavigate = vi.fn();
        await renderSidebar('/', onNavigate);
        await click(container.querySelector('a[href="/storage/cassandra/"]'));
        expect(onNavigate).toHaveBeenCalledOnce();
        expect(container.querySelector('a[aria-current="page"]').textContent).toBe('Apache Cassandra');
    });

    it('defaults new workspaces to dark while preserving an existing light preference', async () => {
        await renderSidebar();
        expect(document.documentElement.dataset.theme).toBe('dark');
        await act(async () => root.unmount());
        seedWorkspace({ theme: 'light' });
        root = createRoot(container);
        await renderSidebar();
        expect(document.documentElement.dataset.theme).toBe('light');
    });
});

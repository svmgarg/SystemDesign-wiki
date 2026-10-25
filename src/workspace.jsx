import { createContext, useCallback, useContext, useEffect, useState } from 'react';
const key = 'system-design-wiki.workspace.v1';
const initial = {
    theme: 'dark',
    bookmarks: [], recent: [], sidebarCollapsed: false, collapsedGroups: [], readingMode: false,
};
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function valid(value) {
    return isRecord(value) && (value.theme === 'light' || value.theme === 'dark')
        && Array.isArray(value.bookmarks) && value.bookmarks.every(id => typeof id === 'string')
        && Array.isArray(value.collapsedGroups) && value.collapsedGroups.every(id => typeof id === 'string')
        && typeof value.sidebarCollapsed === 'boolean' && typeof value.readingMode === 'boolean'
        && Array.isArray(value.recent) && value.recent.every(item => isRecord(item)
        && typeof item.id === 'string' && typeof item.openedAt === 'number' && Number.isFinite(item.openedAt)
        && typeof item.position === 'number' && Number.isFinite(item.position) && item.position >= 0
        && typeof item.progress === 'number' && Number.isFinite(item.progress) && item.progress >= 0 && item.progress <= 1);
}
function read() {
    try {
        const stored = localStorage.getItem(key);
        if (!stored)
            return { state: initial, error: '' };
        const parsed = JSON.parse(stored);
        if (!valid(parsed))
            throw new Error('Saved workspace has an invalid format.');
        return { state: parsed, error: '' };
    }
    catch (error) {
        console.error('Cannot load local wiki preferences:', error);
        return { state: initial, error: 'Saved preferences could not be loaded. This tab is using default preferences.' };
    }
}
function useWorkspaceState() {
    const [loaded] = useState(read);
    const [state, setState] = useState(loaded.state);
    const [storageError, setStorageError] = useState(loaded.error);
    useEffect(() => {
        document.documentElement.dataset.theme = state.theme;
    }, [state.theme]);
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        }
        catch (error) {
            console.error('Cannot save wiki preferences:', error);
            setStorageError('Browser storage is unavailable. Bookmarks and reading position will not survive closing this tab.');
        }
    }, [state]);
    const toggleTheme = useCallback(() => setState(current => ({ ...current, theme: current.theme === 'light' ? 'dark' : 'light' })), []);
    const toggleBookmark = useCallback((id) => setState(current => ({
        ...current, bookmarks: current.bookmarks.includes(id) ? current.bookmarks.filter(item => item !== id) : [...current.bookmarks, id],
    })), []);
    const toggleSidebar = useCallback(() => setState(current => ({ ...current, sidebarCollapsed: !current.sidebarCollapsed })), []);
    const toggleReading = useCallback(() => setState(current => ({ ...current, readingMode: !current.readingMode })), []);
    const toggleGroup = useCallback((id) => setState(current => ({
        ...current, collapsedGroups: current.collapsedGroups.includes(id) ? current.collapsedGroups.filter(item => item !== id) : [...current.collapsedGroups, id],
    })), []);
    const expandGroups = useCallback((ids) => setState(current => {
        const collapsedGroups = current.collapsedGroups.filter(id => !ids.includes(id));
        return collapsedGroups.length === current.collapsedGroups.length ? current : { ...current, collapsedGroups };
    }), []);
    const openDocument = useCallback((id) => setState(current => {
        const previous = current.recent.find(item => item.id === id);
        return {
            ...current,
            recent: [{ id, openedAt: Date.now(), position: previous?.position ?? 0, progress: previous?.progress ?? 0 }, ...current.recent.filter(item => item.id !== id)].slice(0, 50),
        };
    }), []);
    const savePosition = useCallback((id, position, progress) => setState(current => ({
        ...current, recent: current.recent.map(item => item.id === id ? { ...item, position, progress } : item),
    })), []);
    return { ...state, storageError, toggleTheme, toggleBookmark, toggleSidebar, toggleReading, toggleGroup, expandGroups, openDocument, savePosition };
}
const WorkspaceContext = createContext(null);
export function WorkspaceProvider({ children }) {
    return <WorkspaceContext.Provider value={useWorkspaceState()}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace() {
    const value = useContext(WorkspaceContext);
    if (!value)
        throw new Error('WorkspaceProvider is missing.');
    return value;
}

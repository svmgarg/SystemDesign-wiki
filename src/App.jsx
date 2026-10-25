import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { site } from '../site.config';
import { documentById, documentByRoute, documents } from './content';
import { Header, NavigationDrawer, Sidebar } from './components/Navigation';
import { SearchDialog } from './components/SearchDialog';
import { DocumentPage } from './pages/DocumentPage';
import { HomePage, LibraryPage, NotFound } from './pages/LibraryPage';
import { useWorkspace } from './workspace';
export function App() {
    const [searchOpen, setSearchOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { sidebarCollapsed, readingMode, toggleSidebar, storageError } = useWorkspace();
    const location = useLocation();
    const [params, setParams] = useSearchParams();
    const comparing = location.pathname === '/concepts/';
    const variant = comparing && ['minimal', 'workspace', 'focus'].includes(params.get('variant') ?? '') ? params.get('variant') : 'workspace';
    const focused = readingMode || (comparing && variant === 'focus');
    const current = documentByRoute.get(location.pathname);
    const requirements = documentById.get('requirements');
    if (!requirements)
        throw new Error('Requirements document is missing.');
    useEffect(() => {
        document.title = `${current?.title ?? (comparing ? 'Reading layout concepts' : 'Learning workspace')} | ${site.name}`;
        if (!current && !comparing)
            window.scrollTo(0, 0);
    }, [location.pathname, current, comparing]);
    useEffect(() => {
        function keydown(event) {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setSearchOpen(open => !open);
            }
        }
        window.addEventListener('keydown', keydown);
        return () => window.removeEventListener('keydown', keydown);
    }, []);
    return <div className={`app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}${focused ? ' reading-mode' : ''}${comparing ? ` concept-${variant}` : ''}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Header onSearch={() => setSearchOpen(true)} focused={focused} onMenu={() => {
            if (window.matchMedia('(max-width: 1050px)').matches || focused)
                setDrawerOpen(true);
            else
                toggleSidebar();
        }}/>
    <aside className="desktop-sidebar"><Sidebar onNavigate={() => undefined}/></aside>
    <NavigationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}/>
    <main id="main-content" className="app-main" tabIndex={-1}>
      {storageError && <div className="error-notice" role="alert">{storageError}</div>}
      {comparing && <section className="concept-comparison" aria-label="Compare three UX concepts">
        <div><span className="page-eyebrow">READING LAYOUT STUDY</span><h2>One document. Three approaches.</h2><p>Same Requirements notes, same viewport. B is the recommended everyday workspace.</p></div>
        <div className="concept-options" role="group" aria-label="Design variants">
          {[
                { id: 'minimal', label: 'A / Minimal documentation', detail: 'Quiet navigation; fewer reading controls.' },
                { id: 'workspace', label: 'B / Learning workspace', detail: 'Recommended: context, bookmarks, and reading progress.' },
                { id: 'focus', label: 'C / Focused reading', detail: 'Full-width article with navigation out of the way.' },
            ].map(item => <button type="button" key={item.id} aria-pressed={variant === item.id} onClick={() => { setParams({ variant: item.id }); window.scrollTo(0, 0); }}>
            <strong>{item.label}</strong><small>{item.detail}</small>
          </button>)}
        </div>
        <Link to="/01-thinking/">Open the recommended design</Link>
      </section>}
      <Routes>
        <Route path="/" element={location.hash ? <Navigate replace to={`/introduction/${location.hash}`}/> : <HomePage onSearch={() => setSearchOpen(true)}/>}/>
        <Route path="/documents/" element={<LibraryPage view="all"/>}/>
        <Route path="/recent/" element={<LibraryPage view="recent"/>}/>
        <Route path="/bookmarks/" element={<LibraryPage view="bookmarks"/>}/>
        <Route path="/topics/:categoryId/" element={<LibraryPage view="category"/>}/>
        <Route path="/concepts/" element={<DocumentPage doc={requirements} variant={variant}/>}/>
        {documents.map(doc => <Route key={doc.id} path={doc.route} element={<DocumentPage key={doc.id} doc={doc}/>}/>)}
        <Route path="*" element={<NotFound />}/>
      </Routes>
    </main>
    <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)}/>
  </div>;
}

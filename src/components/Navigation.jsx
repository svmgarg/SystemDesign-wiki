import { useEffect, useId, useRef } from 'react';
import { Bookmark, ChevronRight, Clock3, Files, Home, Menu, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { categories } from '../../content.config';
import { site } from '../../site.config';
import { documents } from '../content';
import { useWorkspace } from '../workspace';
import { IconButton } from './ui';
export function Brand({ onNavigate }) {
    return <Link to="/" className="brand" onClick={onNavigate}><img src={site.logo} width="25" height="25" alt=""/><span>{site.name}</span></Link>;
}
export function Header({ onSearch, onMenu, focused }) {
    const { theme, toggleTheme, sidebarCollapsed } = useWorkspace();
    const { pathname } = useLocation();
    const doc = documents.find(item => item.route === pathname);
    return <header className="app-header">
    <IconButton label={focused || sidebarCollapsed ? 'Open topic navigation' : 'Toggle topic navigation'} onClick={onMenu}>
      <span className="desktop-menu-icon">{sidebarCollapsed ? <PanelLeftOpen size={19}/> : <PanelLeftClose size={19}/>}</span>
      <Menu size={20} className="mobile-menu-icon"/>
    </IconButton>
    <Brand />
    <nav className="primary-nav" aria-label="Primary">
      {[
            { title: 'Home', to: '/', active: pathname === '/' },
            { title: 'Learn', to: '/topics/foundations/', active: doc?.category === 'foundations' || pathname === '/topics/foundations/' },
            { title: 'Designs', to: '/topics/designs/', active: doc?.category === 'designs' || pathname === '/topics/designs/' },
            { title: 'Practice', to: '/topics/practice/', active: doc?.category === 'practice' || pathname === '/topics/practice/' },
        ].map(item => <Link key={item.to} to={item.to} className={item.active ? 'primary-link active' : 'primary-link'} aria-current={item.active ? 'true' : undefined}>{item.title}</Link>)}
    </nav>
    <div className="header-actions">
      <button type="button" className="search-trigger" onClick={onSearch} aria-label="Search documents (Control or Command K)">
        <Search size={17}/><span>Search notes...</span><kbd>Ctrl K</kbd>
      </button>
      <IconButton label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={toggleTheme}>
        {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
      </IconButton>
    </div>
  </header>;
}
function DocumentBranch({ doc, onNavigate }) {
    const { collapsedGroups, toggleGroup } = useWorkspace();
    const id = useId();
    const children = documents.filter(item => item.parent === doc.id);
    const groupKey = `document:${doc.id}`;
    const expanded = !collapsedGroups.includes(groupKey);
    return <li className="topic-branch">
    <div className="topic-row">
      {children.length > 0 ? <button type="button" className="tree-toggle" aria-label={`${expanded ? 'Collapse' : 'Expand'} ${doc.title}`} aria-expanded={expanded} aria-controls={id} onClick={() => toggleGroup(groupKey)}>
        <ChevronRight size={15} aria-hidden="true" className={expanded ? 'tree-chevron expanded' : 'tree-chevron'}/>
      </button> : <span className="tree-spacer" aria-hidden="true"/>}
      <NavLink to={doc.route} end onClick={onNavigate} className={({ isActive }) => `sidebar-link topic-link${isActive ? ' selected' : ''}`}>
        <span>{doc.title}</span>
      </NavLink>
    </div>
    {children.length > 0 && <ul id={id} className="topic-children" hidden={!expanded}>
      {children.map(child => <DocumentBranch key={child.id} doc={child} onNavigate={onNavigate}/>)}
    </ul>}
  </li>;
}
export function Sidebar({ onNavigate }) {
    const { collapsedGroups, toggleGroup, expandGroups, toggleSidebar } = useWorkspace();
    const { pathname } = useLocation();
    const id = useId();
    useEffect(() => {
        const current = documents.find(doc => doc.route === `${pathname.replace(/\/$/, '')}/`);
        if (!current)
            return;
        const groups = [current.category];
        let parent = documents.find(doc => doc.id === current.parent);
        while (parent) {
            groups.push(`document:${parent.id}`);
            parent = documents.find(doc => doc.id === parent.parent);
        }
        expandGroups(groups);
    }, [pathname, expandGroups]);
    return <nav className="topic-navigation" aria-label="Learning navigation">
    <div className="navigation-heading">
      <div><h2>Documentation</h2><span>{site.name}</span></div>
      <IconButton label="Collapse topic navigation" className="icon-button sidebar-collapse" onClick={toggleSidebar}><PanelLeftClose size={18}/></IconButton>
    </div>
    <div className="sidebar-scroll">
    <div className="workspace-links">
      {[
            { title: 'Home', to: '/', icon: Home },
            { title: 'All documents', to: '/documents/', icon: Files },
            { title: 'Recently read', to: '/recent/', icon: Clock3 },
            { title: 'Bookmarks', to: '/bookmarks/', icon: Bookmark },
        ].map(({ title, to, icon: Icon }) => <NavLink key={to} to={to} end onClick={onNavigate} className={({ isActive }) => `sidebar-link${isActive ? ' selected' : ''}`}>
        <Icon size={16} aria-hidden="true"/><span>{title}</span>
      </NavLink>)}
    </div>
    {categories.map(category => {
            const expanded = !collapsedGroups.includes(category.id);
            const groupId = `${id}-${category.id}`;
            return <section className="topic-group" key={category.id}>
        <button type="button" className="group-toggle" onClick={() => toggleGroup(category.id)} aria-expanded={expanded} aria-controls={groupId}>
          <ChevronRight size={15} aria-hidden="true" className={expanded ? 'tree-chevron expanded' : 'tree-chevron'}/><span>{category.title}</span>
        </button>
        <ul id={groupId} className="topic-list" hidden={!expanded}>
          {documents.filter(doc => doc.category === category.id && !doc.parent).map(doc => <DocumentBranch key={doc.id} doc={doc} onNavigate={onNavigate}/>)}
        </ul>
      </section>;
        })}
    <div className="sidebar-bottom"><Link to="/concepts/" onClick={onNavigate}>Compare reading layouts</Link><span>Personal notes. Saved on this browser.</span></div>
    </div>
  </nav>;
}
export function NavigationDrawer({ open, onClose }) {
    const ref = useRef(null);
    useEffect(() => {
        if (open && !ref.current?.open)
            ref.current?.showModal();
        if (!open && ref.current?.open)
            ref.current.close();
    }, [open]);
    return <dialog ref={ref} className="navigation-drawer" aria-label="Topic navigation" onCancel={onClose} onClose={onClose} onClick={event => { if (event.target === event.currentTarget)
        onClose(); }}>
    <div className="drawer-heading"><Brand onNavigate={onClose}/><IconButton label="Close navigation" onClick={onClose}><X size={20}/></IconButton></div>
    <Sidebar onNavigate={onClose}/>
  </dialog>;
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, FileText, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { documentById, searchDocuments } from '../content';
import { useWorkspace } from '../workspace';
import { IconButton } from './ui';
export function SearchDialog({ open, onClose }) {
    const dialog = useRef(null);
    const input = useRef(null);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const { recent } = useWorkspace();
    const navigate = useNavigate();
    const results = useMemo(() => {
        if (query.trim())
            return searchDocuments(query).slice(0, 10);
        const recentDocs = recent.map(item => documentById.get(item.id)).filter(doc => doc !== undefined);
        return (recentDocs.length ? recentDocs : searchDocuments('')).slice(0, 6);
    }, [query, recent]);
    useEffect(() => {
        if (open) {
            setQuery('');
            setActive(0);
            if (!dialog.current?.open)
                dialog.current?.showModal();
            input.current?.focus();
        }
        else if (dialog.current?.open)
            dialog.current.close();
    }, [open]);
    useEffect(() => {
        if (open)
            document.getElementById(`search-result-${active}`)?.scrollIntoView({ block: 'nearest' });
    }, [active, open]);
    function select(index) {
        const doc = results[index];
        if (!doc)
            return;
        navigate(doc.route);
        onClose();
    }
    return <dialog ref={dialog} className="search-dialog" onCancel={onClose} onClose={onClose} aria-label="Search learning documents" onClick={event => { if (event.target === event.currentTarget)
        onClose(); }}>
    <div className="command-input">
      <Search size={21} aria-hidden="true"/>
      <input ref={input} placeholder="Search your learning notes..." value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} role="combobox" aria-label="Search documents" aria-expanded={open} aria-controls="search-results" aria-autocomplete="list" aria-activedescendant={results[active] ? `search-result-${active}` : undefined} onKeyDown={event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setActive(current => results.length ? (current + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length : 0);
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                select(active);
            }
        }}/>
      <IconButton label="Close search" onClick={onClose}><X size={18}/></IconButton>
    </div>
    <div className="command-label" role="status">{query.trim() ? `${results.length} matching documents` : recent.length ? 'Recently opened' : 'Start with a topic or type to search'}</div>
    <div id="search-results" className="search-results" role="listbox" aria-label="Search results">
      {results.map((doc, index) => <button type="button" key={doc.id} id={`search-result-${index}`} className={`search-result${index === active ? ' highlighted' : ''}`} role="option" aria-selected={index === active} onClick={() => select(index)} onMouseMove={() => setActive(index)}>
        <FileText size={18}/><span><strong>{doc.title}</strong><small>{doc.categoryTitle} / {doc.readingMinutes} min read</small></span><ArrowUpRight size={16}/>
      </button>)}
      {!results.length && <div className="search-empty"><strong>No documents found</strong><p>Try a topic such as caching, SQL, or requirements.</p></div>}
    </div>
    <div className="command-footer"><span>Arrow keys to navigate</span><span>Enter to open / Esc to close</span></div>
  </dialog>;
}

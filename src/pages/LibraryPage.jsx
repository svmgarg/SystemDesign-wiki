import { useMemo, useState } from 'react';
import { ArrowRight, Bookmark, Folder, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { categories } from '../../content.config';
import { documentById, documents, searchDocuments } from '../content';
import { useWorkspace } from '../workspace';
import { DocumentRow, EmptyState } from '../components/ui';
export function HomePage({ onSearch }) {
    const { recent, bookmarks } = useWorkspace();
    const continueDocs = recent.filter(item => documentById.has(item.id)).slice(0, 3);
    const saved = bookmarks.map(id => documentById.get(id)).filter(doc => doc !== undefined).slice(0, 4);
    const updated = [...documents].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 4);
    return <div className="library-page">
    <div className="page-eyebrow">YOUR WORKSPACE</div><h1>Home</h1><p className="page-description">Pick up a note, explore a design, or find something to review.</p>
    <button type="button" className="home-search" onClick={onSearch}><Search size={19}/><span>Search all your learning notes</span><kbd>Ctrl K</kbd></button>
    <section className="library-section"><div className="section-heading"><h2>Continue reading</h2><Link to="/recent/">View history <ArrowRight size={14}/></Link></div>
      {continueDocs.length ? continueDocs.map(item => {
            const doc = documentById.get(item.id);
            return doc ? <DocumentRow key={doc.id} doc={doc} openedAt={item.openedAt} progress={item.progress}/> : null;
        }) : <EmptyState title="Your next read starts here.">Open a document and your place will be saved in this browser. <Link to="/01-thinking/">Start with Requirements</Link></EmptyState>}
    </section>
    <section className="library-section"><div className="section-heading"><h2>Browse topics</h2><Link to="/documents/">All documents <ArrowRight size={14}/></Link></div>
      <div className="category-list">{categories.map(category => <Link to={`/topics/${category.id}/`} key={category.id} className="category-row">
        <Folder size={19}/><span><strong>{category.title}</strong><small>{category.description}</small></span><ArrowRight size={16}/>
      </Link>)}</div>
    </section>
    <section className="library-section"><div className="section-heading"><h2>Bookmarked</h2><Link to="/bookmarks/">View all <ArrowRight size={14}/></Link></div>
      {saved.length ? saved.map(doc => <DocumentRow key={doc.id} doc={doc}/>) : <EmptyState title="Keep useful notes close.">Use the <Bookmark size={14}/> bookmark button on any document to save it here.</EmptyState>}
    </section>
    <section className="library-section"><div className="section-heading"><h2>Recently updated</h2></div>{updated.map(doc => <DocumentRow key={doc.id} doc={doc}/>)}</section>
    <p className="local-note">Bookmarks, history, and reading position are stored locally in this browser.</p>
  </div>;
}
export function LibraryPage({ view }) {
    const { categoryId } = useParams();
    const category = categories.find(item => item.id === categoryId);
    const { recent, bookmarks } = useWorkspace();
    const [query, setQuery] = useState('');
    const matching = useMemo(() => new Set(searchDocuments(query).map(doc => doc.id)), [query]);
    const all = view === 'recent'
        ? recent.map(item => documentById.get(item.id)).filter(doc => doc !== undefined)
        : documents;
    const visible = all.filter(doc => matching.has(doc.id)
        && (view !== 'bookmarks' || bookmarks.includes(doc.id))
        && (view !== 'category' || doc.category === category?.id));
    const title = view === 'all' ? 'All documents' : view === 'recent' ? 'Recently read' : view === 'bookmarks' ? 'Bookmarks' : category?.title;
    if (!title)
        return <NotFound />;
    return <div className="library-page">
    <div className="page-eyebrow">LIBRARY</div><h1>{title}</h1>
    <p className="page-description">{view === 'recent' ? 'Your reading history, most recently opened first.' : view === 'bookmarks' ? 'Notes and reference material you have saved in this browser.' : category?.description ?? 'Foundations, worked designs, and interview practice in one place.'}</p>
    <label className="filter-field"><Search size={17}/><input type="search" aria-label={`Filter ${title.toLowerCase()}`} placeholder="Filter documents..." value={query} onChange={event => setQuery(event.target.value)}/></label>
    <div className="results-caption" role="status">{visible.length} {visible.length === 1 ? 'document' : 'documents'}</div>
    {visible.map(doc => {
            const opened = recent.find(item => item.id === doc.id);
            return <DocumentRow key={doc.id} doc={doc} openedAt={view === 'recent' ? opened?.openedAt : undefined} progress={view === 'recent' ? opened?.progress : undefined}/>;
        })}
    {!visible.length && <EmptyState title={query ? 'No matching documents.' : view === 'bookmarks' ? 'No bookmarks yet.' : 'Nothing read yet.'}>
      {query ? 'Try a different search term.' : view === 'bookmarks' ? 'Bookmark a document to find it here later.' : <Link to="/documents/">Browse your learning notes</Link>}
    </EmptyState>}
  </div>;
}
export function NotFound() {
    return <div className="library-page"><div className="page-eyebrow">PAGE NOT FOUND</div><h1>This note is not here.</h1><p>The address may have changed. Your documents are still in the library.</p><Link className="quiet-button" to="/documents/">Browse all documents <ArrowRight size={16}/></Link></div>;
}

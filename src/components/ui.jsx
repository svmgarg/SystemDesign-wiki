import { Bookmark, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../workspace';
export function IconButton({ label, children, ...props }) {
    return <button type="button" className="icon-button" aria-label={label} title={label} {...props}>{children}</button>;
}
export function shortDate(value) {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}
export function BookmarkButton({ doc, compact = false }) {
    const { bookmarks, toggleBookmark } = useWorkspace();
    const saved = bookmarks.includes(doc.id);
    return <button type="button" className={compact ? 'icon-button bookmark-button' : 'quiet-button bookmark-button'} aria-label={`${saved ? 'Remove bookmark for' : 'Bookmark'} ${doc.title}`} aria-pressed={saved} onClick={() => toggleBookmark(doc.id)} title={saved ? 'Remove bookmark' : 'Bookmark this document'}>
    <Bookmark size={17} fill={saved ? 'currentColor' : 'none'}/>
    {!compact && <span>{saved ? 'Bookmarked' : 'Bookmark'}</span>}
  </button>;
}
export function DocumentRow({ doc, openedAt, progress }) {
    return <div className="document-row">
    <FileText size={18} className="row-icon" aria-hidden="true"/>
    <Link className="document-row-link" to={doc.route}>
      <span className="document-row-title">{doc.title}</span>
      <span className="row-meta">{doc.categoryTitle}<span aria-hidden="true"> / </span>{doc.readingMinutes} min read
        {progress !== undefined && progress > 0 && <span> / Resume at {Math.round(progress * 100)}%</span>}
      </span>
    </Link>
    <time className="row-date" dateTime={new Date(openedAt ?? doc.updatedAt).toISOString()}>
      {shortDate(openedAt ?? doc.updatedAt)}
    </time>
    <BookmarkButton doc={doc} compact/>
  </div>;
}
export function EmptyState({ title, children }) {
    return <div className="empty-state"><p>{title}</p><div>{children}</div></div>;
}

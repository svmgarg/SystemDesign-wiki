import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, List, Maximize2, Minimize2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { documentById, documentByRoute, documents } from '../content';
import { renderDocument } from '../markdown';
import { useWorkspace } from '../workspace';
import { BookmarkButton, shortDate } from '../components/ui';
import { MarkdownContent } from '../components/MarkdownContent';
function Contents({ headings, active }) {
    return <nav aria-label="On this page"><div className="toc-label">ON THIS PAGE</div><ul>
    {headings.map(heading => <li className={heading.level > 2 ? 'toc-nested' : ''} key={heading.id}>
      <a href={`#${heading.id}`} className={active === heading.id ? 'current' : ''} aria-current={active === heading.id ? 'location' : undefined} onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); }}>{heading.title}</a>
    </li>)}
  </ul></nav>;
}
export function DocumentPage({ doc, variant = 'workspace' }) {
    const rendered = useMemo(() => renderDocument(doc), [doc]);
    const { openDocument, savePosition, recent, readingMode, toggleReading } = useWorkspace();
    const location = useLocation();
    const navigate = useNavigate();
    const initialPosition = useRef(recent.find(item => item.id === doc.id)?.position ?? 0);
    const initialized = useRef(false);
    const [progress, setProgress] = useState(0);
    const [active, setActive] = useState(rendered.headings[0]?.id ?? '');
    const [copyError, setCopyError] = useState('');
    const timers = useRef([]);
    const siblings = documents.filter(item => item.category === doc.category);
    const index = siblings.findIndex(item => item.id === doc.id);
    const previous = siblings[index - 1];
    const next = siblings[index + 1];
    const parent = doc.parent ? documentById.get(doc.parent) : undefined;
    useEffect(() => { openDocument(doc.id); }, [doc.id, openDocument]);
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
            if (target)
                target.scrollIntoView();
            else
                window.scrollTo(0, initialPosition.current);
            initialized.current = true;
            window.dispatchEvent(new Event('scroll'));
        });
        return () => cancelAnimationFrame(frame);
    }, [doc.id, location.hash]);
    useEffect(() => {
        let frame = 0;
        let saveTimer;
        let lastPosition = initialPosition.current;
        let lastProgress = 0;
        const sections = rendered.headings.map(heading => document.getElementById(heading.id)).filter(element => element !== null);
        function update() {
            frame = 0;
            if (!initialized.current || window.location.pathname !== location.pathname)
                return;
            const distance = document.documentElement.scrollHeight - window.innerHeight;
            lastPosition = window.scrollY;
            lastProgress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 1;
            setProgress(lastProgress);
            let current = rendered.headings[0]?.id ?? '';
            for (const element of sections)
                if (element.getBoundingClientRect().top <= 140)
                    current = element.id;
            setActive(current);
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => savePosition(doc.id, lastPosition, lastProgress), 400);
        }
        function queue() { if (!frame)
            frame = requestAnimationFrame(update); }
        window.addEventListener('scroll', queue, { passive: true });
        window.addEventListener('resize', queue);
        queue();
        return () => {
            window.removeEventListener('scroll', queue);
            window.removeEventListener('resize', queue);
            cancelAnimationFrame(frame);
            clearTimeout(saveTimer);
            // The incoming page can change the viewport before this cleanup runs.
            if (initialized.current)
                savePosition(doc.id, lastPosition, lastProgress);
        };
    }, [doc.id, rendered, savePosition, location.pathname]);
    useEffect(() => () => timers.current.forEach(clearTimeout), []);
    async function clickContent(event) {
        if (!(event.target instanceof Element))
            return;
        const copy = event.target.closest('button[data-copy-code]');
        if (copy) {
            const text = copy.closest('.code-block')?.querySelector('pre')?.textContent;
            if (text === undefined || text === null) {
                setCopyError('This code block could not be copied. Select its text to copy it manually.');
                return;
            }
            try {
                await navigator.clipboard.writeText(text);
                copy.textContent = 'Copied';
                setCopyError('');
                timers.current.push(setTimeout(() => { if (copy.isConnected)
                    copy.textContent = 'Copy'; }, 2000));
            }
            catch (error) {
                console.error('Copying code failed:', error);
                setCopyError('Clipboard access was denied. Select the code and copy it manually.');
            }
            return;
        }
        const anchor = event.target.closest('a[href]');
        if (!anchor || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target || anchor.hasAttribute('download'))
            return;
        const url = new URL(anchor.href);
        const base = import.meta.env.BASE_URL.replace(/\/$/, '');
        const pathname = url.pathname.startsWith(`${base}/`) ? url.pathname.slice(base.length) : url.pathname;
        if (url.origin === window.location.origin && documentByRoute.has(pathname)) {
            event.preventDefault();
            navigate(`${pathname}${url.search}${url.hash}`);
        }
    }
    return <div className={`document-layout variant-${variant}`}>
    <div className="reading-progress" aria-hidden="true"><div style={{ transform: `scaleX(${progress})` }}/></div>
    <article className="learning-document">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link><ChevronRight size={13}/>
        <Link to={`/topics/${doc.category}/`}>{doc.categoryTitle}</Link><ChevronRight size={13}/>
        {parent && <><Link to={parent.route}>{parent.title}</Link><ChevronRight size={13}/></>}
        <span aria-current="page">{doc.title}</span>
      </nav>
      <header className="document-heading"><h1>{rendered.title}</h1>
        <div className="document-meta">
          <span><BookOpen size={15}/>{doc.readingMinutes} min read</span>
          <span className="document-updated">Updated {shortDate(doc.updatedAt)}</span>
          <div className="document-actions"><BookmarkButton doc={doc}/>
            <button type="button" className="quiet-button" onClick={toggleReading} aria-pressed={readingMode} aria-label={readingMode ? 'Exit reading mode' : 'Enter reading mode'}>
              {readingMode ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}<span>{readingMode ? 'Exit focus' : 'Focus'}</span>
            </button>
          </div>
        </div>
      </header>
      {rendered.headings.length > 2 && <details className="mobile-contents"><summary><List size={17}/>On this page</summary><Contents headings={rendered.headings} active={active}/></details>}
      {copyError && <p className="error-notice" role="alert">{copyError}</p>}
      <MarkdownContent html={rendered.html} onClick={event => { void clickContent(event); }}/>
      <nav className="document-pagination" aria-label="Related chapters">
        {previous ? <Link to={previous.route}><ArrowLeft size={17}/><span><small>Previous</small>{previous.title}</span></Link> : <span />}
        {next ? <Link to={next.route}><span><small>Next</small>{next.title}</span><ArrowRight size={17}/></Link> : <span />}
      </nav>
      <p className="local-note">Your reading position and bookmarks are saved on this browser.</p>
    </article>
    {rendered.headings.length > 2 && <aside className="contents-rail"><Contents headings={rendered.headings} active={active}/></aside>}
  </div>;
}

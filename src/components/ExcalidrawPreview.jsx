import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Maximize2, Minus, Plus, X } from 'lucide-react';
import { loadExcalidraw } from '../excalidraw';
import { IconButton } from './ui';

export function ExcalidrawPreview({ source, title }) {
    const container = useRef(null);
    const dialog = useRef(null);
    const [requested, setRequested] = useState(false);
    const [drawing, setDrawing] = useState(null);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
                setRequested(true);
                observer.disconnect();
            }
        }, { rootMargin: '300px' });
        observer.observe(container.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!requested) return;
        const controller = new AbortController();
        let objectUrl;
        setDrawing(null);
        setError('');
        async function load() {
            try {
                const rendered = await loadExcalidraw(source, controller.signal);
                if (controller.signal.aborted) return;
                objectUrl = URL.createObjectURL(rendered.blob);
                setDrawing({ ...rendered, url: objectUrl });
            } catch (failure) {
                if (controller.signal.aborted) return;
                console.error('Excalidraw preview failed:', source, failure);
                setError(failure instanceof Error ? failure.message : 'The drawing could not be rendered.');
            }
        }
        void load();
        return () => {
            controller.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [source, requested, attempt]);

    useEffect(() => {
        if (expanded && !dialog.current.open) dialog.current.showModal();
    }, [expanded]);

    const props = { source, title, drawing, error, requested, onRetry: () => setAttempt(value => value + 1) };
    return <span ref={container} className="excalidraw-preview" data-excalidraw-state={error ? 'error' : drawing ? 'ready' : requested ? 'loading' : 'idle'}>
        <ExcalidrawBoard {...props} onExpand={() => setExpanded(true)}/>
        {createPortal(<dialog ref={dialog} className="excalidraw-dialog" aria-label={`${title}: expanded diagram`} onClose={() => setExpanded(false)}>
            {expanded && <ExcalidrawBoard {...props} onClose={() => dialog.current.close()}/>}
        </dialog>, document.body)}
    </span>;
}

function ExcalidrawBoard({ source, title, drawing, error, requested, onRetry, onExpand, onClose }) {
    const viewport = useRef(null);
    const [zoom, setZoom] = useState('fit');
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setSize({ width, height });
        });
        observer.observe(viewport.current);
        return () => observer.disconnect();
    }, []);

    const fitted = drawing ? Math.min(
        Math.max(1, size.width - 32) / drawing.width,
        Math.max(1, size.height - 32) / drawing.height,
        1,
    ) : 1;
    const scale = zoom === 'fit' ? fitted : zoom;
    function changeZoom(factor) {
        setZoom(Math.min(2, Math.max(0.01, scale * factor)));
    }

    return <span className="excalidraw-board">
        <span className="excalidraw-toolbar">
            <span className="excalidraw-label">{title}<small>Read-only / rendered from .excalidraw</small></span>
            <span className="excalidraw-controls" role="group" aria-label="Diagram controls">
                <IconButton label="Zoom out diagram" disabled={!drawing || scale <= 0.01} onClick={() => changeZoom(0.8)}><Minus size={16}/></IconButton>
                <span className="excalidraw-scale" aria-live="polite">{drawing ? `${Math.round(scale * 100)}%` : '--'}</span>
                <IconButton label="Zoom in diagram" disabled={!drawing || scale >= 2} onClick={() => changeZoom(1.25)}><Plus size={16}/></IconButton>
                <button type="button" className="quiet-button" disabled={!drawing} aria-pressed={zoom === 'fit'} onClick={() => setZoom('fit')}>Fit</button>
                <button type="button" className="quiet-button" disabled={!drawing} aria-pressed={zoom === 1} onClick={() => setZoom(1)}>100%</button>
                {onClose
                    ? <button type="button" className="quiet-button" onClick={onClose} autoFocus aria-label="Close expanded diagram"><X size={16}/>Close</button>
                    : <button type="button" className="quiet-button" disabled={!drawing} onClick={onExpand} aria-label="Expand diagram"><Maximize2 size={16}/>Expand</button>}
            </span>
        </span>
        <span ref={viewport} className="excalidraw-viewport" role="region" aria-label={`${title}; use zoom controls and scroll to explore`} tabIndex={0} aria-busy={requested && !drawing && !error}>
            {drawing ? <span className="excalidraw-stage">
                <img className="excalidraw-image" src={drawing.url} alt={title} draggable={false} style={{ width: `${Math.max(1, Math.round(drawing.width * scale))}px` }}/>
            </span> : error ? <span className="excalidraw-message" role="alert">
                <strong>Diagram unavailable</strong><span>{error}</span>
                <button type="button" className="quiet-button" onClick={onRetry}>Retry diagram</button>
            </span> : <span className="excalidraw-message" role="status">{requested ? 'Rendering the Excalidraw file...' : 'The board loads when you scroll here.'}</span>}
        </span>
        <span className="excalidraw-footer">
            <span>{onClose ? 'Press Escape or Close to return to the article.' : 'Zoom to 100% for readable detail, then scroll within the board.'}</span>
            <a href={source} download><Download size={14}/>Download source</a>
            {drawing && <a href={drawing.url} download="diagram.svg">Download SVG</a>}
        </span>
    </span>;
}

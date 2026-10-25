import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExcalidrawPreview } from './ExcalidrawPreview';

export function MarkdownContent({ html, onClick }) {
    const container = useRef(null);
    const [slots, setSlots] = useState([]);
    useLayoutEffect(() => {
        setSlots([...container.current.querySelectorAll('[data-excalidraw-src]')]);
    }, [html]);
    return <>
        <div ref={container} className="prose" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }}/>
        {slots.map((slot, index) => createPortal(
            <ExcalidrawPreview source={slot.dataset.excalidrawSrc} title={slot.dataset.excalidrawTitle}/>,
            slot,
            `${slot.dataset.excalidrawSrc}:${index}`,
        ))}
    </>;
}

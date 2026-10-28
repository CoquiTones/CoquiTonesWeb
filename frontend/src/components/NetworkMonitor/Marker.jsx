import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';

/**
 * A labelled marker for one node. The visible pill is a real button so it is
 * reachable with the keyboard and announced with an accessible name.
 */
export default function Marker({ map, node, isActive, onClick }) {
  const markerRef = useRef(null);
  const contentRef = useRef(document.createElement('div'));

  useEffect(() => {
    if (!map) return undefined;

    const element = contentRef.current;
    element.style.display = 'inline-block';

    markerRef.current = new mapboxgl.Marker({ element, anchor: 'bottom' })
      .setLngLat([Number(node.nlongitude), Number(node.nlatitude)])
      .addTo(map);

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, [map, node.nlatitude, node.nlongitude]);

  return createPortal(
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={`Show details for node ${node.nid}${node.nname ? ` (${node.nname})` : ''}`}
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.35)',
        cursor: 'pointer',
        backgroundColor: isActive ? '#FFC857' : '#1D1A16',
        boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        fontWeight: 700,
        color: isActive ? '#14120F' : '#F5F1E8',
        whiteSpace: 'nowrap',
      }}
    >
      {node.nid}
    </button>,
    contentRef.current,
  );
}

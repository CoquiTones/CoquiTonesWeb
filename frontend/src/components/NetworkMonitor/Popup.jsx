import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import mapboxgl from 'mapbox-gl';

/**
 * Mapbox popup rendered through a React portal so content stays declarative.
 */
export default function Popup({ map, node }) {
  const popupRef = useRef(null);
  const contentRef = useRef(document.createElement('div'));

  useEffect(() => {
    if (!map) return undefined;

    const popup = new mapboxgl.Popup({
      closeOnClick: false,
      closeButton: true,
      offset: 18,
      maxWidth: '300px',
    });
    popup.setDOMContent(contentRef.current);
    popupRef.current = popup;

    return () => {
      popup.remove();
      popupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!popupRef.current || !node) return;
    popupRef.current
      .setLngLat([Number(node.nlongitude), Number(node.nlatitude)])
      .addTo(map);
  }, [map, node]);

  return createPortal(
    <Box sx={{ color: 'text.primary', minWidth: 200 }}>
      <Typography component="p" variant="subtitle2" sx={{ mb: 1 }}>
        Node {node.nid}
        {node.nname ? ` · ${node.nname}` : ''}
      </Typography>
      <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 0.5, columnGap: 1.5 }}>
        <Typography component="dt" variant="caption" color="text.secondary">
          Type
        </Typography>
        <Typography component="dd" variant="caption" sx={{ m: 0, textTransform: 'capitalize' }}>
          {node.ntype || '—'}
        </Typography>
        <Typography component="dt" variant="caption" color="text.secondary">
          Description
        </Typography>
        <Typography component="dd" variant="caption" sx={{ m: 0 }}>
          {node.ndescription || '—'}
        </Typography>
        <Typography component="dt" variant="caption" color="text.secondary">
          Coordinates
        </Typography>
        <Typography component="dd" variant="caption" sx={{ m: 0, fontFamily: 'monospace' }}>
          {node.nlatitude}, {node.nlongitude}
        </Typography>
      </Box>
    </Box>,
    contentRef.current,
  );
}

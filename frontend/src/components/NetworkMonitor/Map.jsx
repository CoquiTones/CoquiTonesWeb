import { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import Marker from './Marker';
import Popup from './Popup';

const INITIAL_CENTER = [-66.48590156897816, 18.215311781299874];
const INITIAL_ZOOM = 9;
const MAX_BOUNDS = [
  [-68.34863711943092, 16.788333451001122],
  [-65.28422465966874, 18.60716956104943],
];

const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * Mapbox view of the sensor network. Renders a text list of nodes for screen
 * readers, since a canvas map is not accessible on its own.
 */
export default function MapEmbed({ Nodes }) {
  const token = import.meta.env.VITE_MAPBOX_API_TOKEN;
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeNode, setActiveNode] = useState(null);

  const nodes = useMemo(
    () => (Nodes?.toArray ? Nodes.toArray() : Array.isArray(Nodes) ? Nodes : []),
    [Nodes],
  );
  const locatedNodes = useMemo(() => nodes.filter((node) => node.hasLocation), [nodes]);

  useEffect(() => {
    if (!token || !containerRef.current) return undefined;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      maxBounds: MAX_BOUNDS,
    });
    mapRef.current = map;

    map.on('load', () => setMapReady(true));

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [token]);

  if (!token) {
    return (
      <Alert severity="info">
        The node map needs a Mapbox access token. Add <code>VITE_MAPBOX_API_TOKEN</code> to the
        frontend environment to enable it.
      </Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: 420 }}>
      <Box
        ref={containerRef}
        id="node-map"
        aria-label="Map of sensor node locations"
        sx={{ width: '100%', height: '100%', minHeight: 420, borderRadius: 2, overflow: 'hidden' }}
      />

      <Box component="ul" sx={srOnly}>
        {locatedNodes.map((node) => (
          <li key={node.nid}>
            Node {node.nid}
            {node.nname ? `, ${node.nname}` : ''}: {node.ntype} at {node.nlatitude}, {node.nlongitude}
          </li>
        ))}
      </Box>

      {mapReady &&
        locatedNodes.map((node) => (
          <Marker
            key={node.nid}
            map={mapRef.current}
            node={node}
            isActive={activeNode?.nid === node.nid}
            onClick={() => setActiveNode(node)}
          />
        ))}

      {mapReady && activeNode && <Popup map={mapRef.current} node={activeNode} />}
    </Box>
  );
}

import React, { useEffect, useState, useRef, useCallback } from "react";

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import Marker from "./Marker";
import Popup from "./Popup";

/**
 * 
 * @param {NodeList} Nodes 
 * @returns 
 */
const MapEmbed = ({ Nodes }) => {
  const INITIAL_CENTER = [-66.1057, 18.4655];
  const INITIAL_ZOOM = 9;


  const [center, setCenter] = useState(INITIAL_CENTER)
  const [zoom, setZoom] = useState(INITIAL_ZOOM)
  const [activeNode, setActiveNode] = useState(null);
  const mapRef = useRef();
  const mapContainerRef = useRef();

  const handleMarkerClick = (selectedNode) => {
    setActiveNode(selectedNode)
  }
  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [
        -66.48590156897816,
        18.215311781299874
      ],
      maxBounds: [[-68.34863711943092, 16.788333451001122], [-65.28422465966874, 18.60716956104943]],
      zoom: 4,
      dragPan: false,
      dragRotate: false,
      scrollZoom: false
    });

    mapRef.current.on('move', () => {
      // get the current center coordinates and zoom level from the map
      const mapCenter = mapRef.current.getCenter()
      const mapZoom = mapRef.current.getZoom()

      // update state
      setCenter([mapCenter.lng, mapCenter.lat])
      setZoom(mapZoom)
    })
    return () => {
      mapRef.current.remove()
    }
  }, [])


  return (
    <>

      <div id="map-container" ref={mapContainerRef} style={{ width: "100%", height: "100vh", position: "relative", padding: "1em" }} >
        {(mapRef.current && Nodes) && Nodes.map((Node) => {
          return <Marker key={Node.nid}
            map={mapRef.current}
            Node={Node}
            onClick={() => handleMarkerClick(Node)}
            isActive={activeNode?.nid === Node.nid}
            anchor="bottom" />
        }
        )
        }
        {(mapRef.current && activeNode) && (<Popup map={mapRef.current} Node={activeNode} />)}
      </div>
    </>
  );
};

export default MapEmbed;

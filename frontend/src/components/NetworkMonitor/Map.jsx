import React, { useMemo, useState, useRef } from "react";

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
  const [activeNode, setActiveNode] = useState();
  const mapRef = useRef();
  const mapContainerRef = useRef();

  const handleMarkerClick = (selectedNode) => {
    console.error("selectedNode: ", selectedNode)
    setActiveNode(selectedNode)
  }
  const markers = useMemo(
    () =>
      Nodes.map((Node) => (
        <Marker key={Node.nid}
          map={mapRef.current}
          longitude={Node.nlongitude}
          latitude={Node.nlatitude}
          onClick={handleMarkerClick}
          isActive={selectedNodeID === Node.nid}
          anchor="bottom" />
      )),
    [Nodes]
  );
  const popups = useMemo(() => {
    <Popup map={mapRef.current} Node={selectedNodeID} />
  })
  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [-66.1057, 18.4655],
      zoom: 9
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
  }, [Nodes])


  return (
    <>

      <div id="map-container" style={{ width: "100%", height: "100%", padding: "1em" }} >
        {mapRef.current && markers}
        {mapRef.current && popups}
      </div>
    </>
  );
};

export default MapEmbed;

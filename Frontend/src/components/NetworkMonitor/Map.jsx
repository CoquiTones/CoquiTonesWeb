import React, { useMemo, useState } from "react";
import {
  GeolocateControl,
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
  FullscreenControl,
} from "react-map-gl/mapbox";

import MapGL from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MapEmbed = ({ ducks }) => {
  // Use useMemo to compute markers
  const [popupInfo, setPopupInfo] = useState(null);
  const markers = useMemo(() =>
    ducks.map(
      (duck) => (
        <Marker
          key={duck.nid}
          longitude={duck.nlongitude}
          latitude={duck.nlatitude}
          anchor="bottom"
          onClick={(e) => {
            // If we let the click event propagates to the map, it will immediately close the popup
            // with `closeOnClick: true`
            e.originalEvent.stopPropagation();
            setPopupInfo(duck);
          }}
        />
      ),
      [ducks]
    )
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <MapGL
        mapboxAccessToken={
          "pk.eyJ1IjoiYWxvbnNvMTQiLCJhIjoiY2x2NnRhbml5MDJtczJrb2V6eWFpajl6NyJ9.p3o47cKv1FYbG-7WFhbM9g"
        }
        initialViewState={{
          longitude: -66.1057,
          latitude: 18.4655,
          zoom: 9,
          width: "100%",
          height: "100%",
        }}
        mapStyle="mapbox://styles/mapbox/navigation-night-v1"
      >
        <GeolocateControl
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
        />
        <FullscreenControl position="top-left" />
        <NavigationControl position="top-left" />
        <ScaleControl />
        {markers.map((duckMarker) => duckMarker)}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.nlongitude}
            latitude={popupInfo.nlatitude}
            onClose={() => setPopupInfo(null)}
          >
            <div style={{ color: "black" }}>
              Node ID: {popupInfo.nid}
              <br />
              Node Description: {popupInfo.ndescription}
            </div>
          </Popup>
        )}
      </MapGL>
    </div>
  );
};

export default MapEmbed;

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { createPortal } from "react-dom";
import 'mapbox-gl/dist/mapbox-gl.css';
const Marker = ({ map, Node, isActive, onClick }) => {
    const markerRef = useRef(null);
    const contentRef = useRef(document.createElement("div"));
    const nlongitude = Node.nlongitude;
    const nlatitude = Node.nlatitude;
    useEffect(() => {
        markerRef.current = new mapboxgl.Marker(contentRef.current, { offset: [0, -50 / 2] })
            .setLngLat([nlongitude, nlatitude])
            .addTo(map);

        return () => {
            markerRef.current.remove();
        };
    }, [Node]);

    return (
        <>
            {createPortal(
                <div
                    onClick={() => onClick(Node.nid)}
                    style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: "50px",
                        backgroundColor: isActive ? "#333" : "#fff",
                        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.5)",
                        fontFamily: "Arial, sans-serif",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: isActive ? "#fff" : "#333",
                        textAlign: "center",
                    }}
                >
                    {Node.nid}
                </div>,
                contentRef.current
            )}
        </>
    );
};

export default Marker;

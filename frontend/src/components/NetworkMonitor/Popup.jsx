import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import mapboxgl from 'mapbox-gl'
import { Node } from "../../services/rest/ResponseORM/NetworkMonitor/NodeResponse"


/**
 * 
 * @param {*} mapRef
 * @param {Node} Node
 * @returns 
 */
const Popup = ({ map, Node }) => {

    // a ref to hold the popup instance
    const popupRef = useRef()
    // a ref for an element to hold the popup's content
    const contentRef = useRef(document.createElement("div"))

    // instantiate the popup on mount, remove it on unmount
    useEffect(() => {
        if (!map) return

        // create a new popup instance, but do not set its location or content yet
        popupRef.current = new mapboxgl.Popup({
            closeOnClick: false,
            offset: 20
        })

        return () => {
            popupRef.current.remove()
        }
    }, [])


    // when Node changes, set the popup's location and content, and add it to the map
    useEffect(() => {
        if (!Node) return
        popupRef.current
            .setLngLat([Node.nlongitude, Node.nlatitude]) // set its position using Node's geometry
            .setHTML(contentRef.current.outerHTML) // use contentRef's `outerHTML` to set the content of the popup
            .addTo(map) // add the popup to the map
    }, [Node])

    // use a react portal to render the content to show in the popup, assigning it to contentRef
    return (
        <>{
            createPortal(
                <div className="portal-content" style={{ color: "black" }}>
                    <table>
                        <tbody>
                            <tr>
                                <td><strong>Node {Node.nid}: {Node.nname} </strong></td>
                            </tr>
                            <tr>
                                <td><strong>Node Type: </strong></td>
                                <td>{Node.ntype}</td>
                            </tr>
                            <tr>
                                <td><strong>Description: </strong></td>
                                <td>{Node.ndescription}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>,
                contentRef.current
            )
        }</>
    )
}

export default Popup
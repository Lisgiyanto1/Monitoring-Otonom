import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";

import carMarker from "../assets/car.png";

import CarTooltip from "./cartooltip";
import type { DeviceData } from "./component-types/peta-mqtt-type";

interface MarkerCarProps {
    map: mapboxgl.Map;
    data: DeviceData;
    cityName: string;
}

export default function MarkerCar({ map, data, cityName }: MarkerCarProps) {
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const rootRef = useRef<ReactDOM.Root | null>(null);
    const popupNodeRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!markerRef.current) {
            // marker element (mobil)
            const el = document.createElement("div");
            el.className = "marker-car";
            el.style.backgroundImage = `url(${carMarker})`;
            el.style.width = "50px";
            el.style.height = "50px";
            el.style.backgroundSize = "100%";
            el.style.backgroundRepeat = "no-repeat";

            // popup container
            popupNodeRef.current = document.createElement("div");
            rootRef.current = ReactDOM.createRoot(popupNodeRef.current);

            const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(
                popupNodeRef.current
            );

            // buat marker + popup
            markerRef.current = new mapboxgl.Marker(el)
                .setLngLat([data.longitude, data.latitude])
                .setPopup(popup)
                .addTo(map);
        }

        return () => {
            // cleanup hanya saat component bener-bener unmount
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
            if (rootRef.current) {
                rootRef.current.unmount();
                rootRef.current = null;
            }
        };
    }, [map]); 
    useEffect(() => {
        if (rootRef.current) {
            rootRef.current.render(<CarTooltip data={data} cityName={cityName} />);
        }

        if (markerRef.current) {
            markerRef.current.setLngLat([data.longitude, data.latitude]);
        }

        map.flyTo({
            center: [data.longitude, data.latitude],
            essential: true,
            bearing: 10,
            pitch: 60,
            zoom: 20,
        });
    }, [data, cityName, map]); // update tiap ada data/cityName berubah


    return null;
}

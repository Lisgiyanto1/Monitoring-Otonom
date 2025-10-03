import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";

import carMarker from "../assets/car.png";
import { calculateBearing } from "../utils/geo"; // <-- Impor fungsi helper

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

    // Ref untuk menyimpan koordinat sebelumnya
    const prevCoordsRef = useRef<[number, number] | null>(null);

    useEffect(() => {
        // --- Inisialisasi marker (hanya sekali) ---
        if (!markerRef.current) {
            const el = document.createElement("div");
            el.className = "marker-car";
            el.style.backgroundImage = `url(${carMarker})`;
            el.style.width = "50px";
            el.style.height = "50px";
            el.style.backgroundSize = "contain"; // 'contain' lebih baik dari '100%'
            el.style.backgroundRepeat = "no-repeat";

            popupNodeRef.current = document.createElement("div");
            rootRef.current = ReactDOM.createRoot(popupNodeRef.current);

            const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(
                popupNodeRef.current
            );

            // Buat marker dengan opsi rotasi
            markerRef.current = new mapboxgl.Marker({
                element: el,
                // Opsi ini penting agar rotasi marker selaras dengan peta
                rotationAlignment: 'map',
                pitchAlignment: 'map'
            })
                .setLngLat([data.longitude, data.latitude])
                .setPopup(popup)
                .addTo(map);

            // Simpan posisi awal sebagai posisi "sebelumnya"
            prevCoordsRef.current = [data.longitude, data.latitude];
        }

        return () => {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
            if (rootRef.current) {
                rootRef.current.unmount();
                rootRef.current = null;
            }
        };
    }, [map]); // Dependency tetap [map] agar hanya jalan sekali

    useEffect(() => {
        // --- Update posisi dan rotasi marker ---
        if (rootRef.current) {
            rootRef.current.render(<CarTooltip data={data} cityName={cityName} />);
        }

        if (markerRef.current) {
            const currentCoords: [number, number] = [data.longitude, data.latitude];
            const prevCoords = prevCoordsRef.current;

            let bearing = 0; // Default bearing jika tidak ada pergerakan

            // Hitung bearing hanya jika ada posisi sebelumnya dan posisinya berubah
            if (prevCoords && (prevCoords[0] !== currentCoords[0] || prevCoords[1] !== currentCoords[1])) {
                bearing = calculateBearing(prevCoords, currentCoords);
            } else {
                // Jika tidak ada pergerakan, gunakan bearing map saat ini atau rotasi marker terakhir
                bearing = markerRef.current.getRotation();
            }

            // Terapkan posisi dan rotasi baru ke marker
            markerRef.current.setLngLat(currentCoords);
            markerRef.current.setRotation(bearing);

            // Perbarui ref dengan koordinat saat ini untuk iterasi berikutnya
            prevCoordsRef.current = currentCoords;

            // Animasikan peta untuk mengikuti mobil dengan bearing yang sesuai
            map.flyTo({
                center: currentCoords,
                essential: true,
                bearing: bearing, // <-- Gunakan bearing yang dihitung
                pitch: 60,
                zoom: 18, // Zoom mungkin lebih baik tidak terlalu dekat
                speed: 1.5, // Atur kecepatan animasi
            });
        }
    }, [data, cityName, map]);

    return null;
}
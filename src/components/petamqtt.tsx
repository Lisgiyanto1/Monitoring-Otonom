import axios from "axios";
import { Moon, Sun } from "lucide-react"; // ⬅️ icon
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

import Logo from "../assets/Politeknik_Negeri_Semarang.webp";
import MarkerCar from "./carmarker";
import type { DeviceData } from "./component-types/peta-mqtt-type";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOXKEY || "";

export default function PetaMqtt() {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
    const [status, setStatus] = useState("Connecting...");
    const [cityName, setCityName] = useState("Fetching location...");
    const [theme, setTheme] = useState<"day" | "night">("day"); // ⬅️ control manual

    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    // pilih style berdasarkan mode
    const getMapStyle = (mode: "day" | "night") =>
        mode === "day"
            ? "mapbox://styles/mapbox/light-v11"
            : "mapbox://styles/mapbox/dark-v11";

    // cek jam lokal untuk auto mode awal
    useEffect(() => {
        const hour = new Date().getHours();
        setTheme(hour >= 6 && hour < 18 ? "day" : "night");
    }, []);

    // Fetch data device dari backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get<DeviceData>(
                    `${apiBaseUrl}/api/latest-data`
                );
                const responseDummy = await axios.get<DeviceData>(
                    `${apiBaseUrl}/api/dummy`
                )
                if (response.data) {
                    setDeviceData(response.data);
                } else if (responseDummy.data) {
                    setDeviceData(responseDummy.data);
                }

                setStatus("Connected");
            } catch (error) {
                console.error("Error fetching device data:", error);
                setStatus("Disconnected");
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 3000);
        return () => clearInterval(intervalId);
    }, [apiBaseUrl]);

    // Init Mapbox hanya sekali
    useEffect(() => {
        if (!map.current && mapContainer.current) {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: getMapStyle(theme),
                center: [110.4145, -6.982], // default Semarang
                zoom: 16,
                pitch: 60,
                bearing: -17.6,
                antialias: true,
            });

            map.current.on("load", () => {
                // Tambah 3D building
                map.current!.addLayer({
                    id: "add-3d-buildings",
                    source: "composite",
                    "source-layer": "building",
                    filter: ["==", "extrude", "true"],
                    type: "fill-extrusion",
                    minzoom: 15,
                    paint: {
                        "fill-extrusion-color": "#aaa",
                        "fill-extrusion-height": [
                            "interpolate", ["linear"], ["zoom"],
                            15, 0,
                            15.05, ["get", "height"]
                        ],
                        "fill-extrusion-base": [
                            "interpolate", ["linear"], ["zoom"],
                            15, 0,
                            15.05, ["get", "min_height"]
                        ],
                        "fill-extrusion-opacity": 0.6,
                    },
                });
            });
        }
    }, [theme]);

    // Update style map kalau theme berubah
    useEffect(() => {
        if (map.current) {
            map.current.setStyle(getMapStyle(theme));
        }
    }, [theme]);

    // Update city name setiap kali deviceData berubah
    useEffect(() => {
        if (!deviceData) return;
        const fetchCityName = async () => {
            try {
                const response = await axios.get(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${deviceData.longitude},${deviceData.latitude}.json?access_token=${mapboxgl.accessToken}`
                );
                const fetched = response.data.features[0]?.text || "Unknown Location";
                setCityName(fetched);
            } catch (err) {
                console.error("Error fetching city name:", err);
            }
        };
        fetchCityName();
    }, [deviceData]);

    return (
        <div className="relative w-screen h-screen">
            {/* MAP */}
            <div ref={mapContainer} className="absolute inset-0 w-full h-full z-0" />

            {/* HEADER */}
            <div className="absolute top-5 left-5 bg-white px-6 py-3 rounded-full shadow-xl z-10 flex items-center">
                <h1 className="text-lg font-bold text-gray-800 flex flex-row justify-center items-center  gap-2">
                    Dashboard Realtime Tracking{" "}
                    <b className="text-lg font-semibold text-blue-600">| MEVI</b>
                    <img src={Logo} className="w-10 h-10" />
                </h1>
            </div>

            {/* SWITCH THEME BUTTON */}
            <button
                onClick={() => setTheme(theme === "day" ? "night" : "day")}
                className="absolute top-5 right-5 bg-white p-3 rounded-full shadow-xl z-10 hover:bg-gray-100 transition"
            >
                {theme === "day" ? (
                    <Moon className="w-6 h-6 text-gray-700" />
                ) : (
                    <Sun className="w-6 h-6 text-yellow-500" />
                )}
            </button>

            {/* STATUS */}
            <div className="absolute bottom-5 right-5 bg-white px-6 py-3 rounded-full shadow-xl z-10 flex items-center">
                <span
                    className={`h-3 w-3 rounded-full mr-2 ${status === "Connected"
                        ? "bg-green-500 animate-pulse"
                        : "bg-red-500"
                        }`}
                ></span>
                <span className="font-semibold text-gray-700">{status}</span>
            </div>

            {/* MARKER */}
            {map.current && deviceData && (
                <MarkerCar map={map.current} data={deviceData} cityName={cityName} />
            )}
        </div>
    );
}


import { Battery, Gauge, MapPin } from "lucide-react";
import type { DeviceData } from "./component-types/peta-mqtt-type";


interface Props {
    data: DeviceData;
    cityName: string;
}

export default function CarTooltip({ data, cityName }: Props) {
    return (
        <div className="font-sans text-gray-700 max-w-xs">
            <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <div className="text-sm font-semibold">
                    lat {data.latitude.toFixed(4)}, long {data.longitude.toFixed(4)}
                </div>
            </div>
            <div className="text-xs text-gray-500 pl-6">{cityName}</div>
            <div className="border-t border-gray-100 my-2"></div>
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                    <Gauge className="w-4 h-4 text-green-500" /> {data.speed} km/h
                </div>
                <div className="flex items-center gap-1">
                    <Battery className="w-4 h-4 text-yellow-500" /> {data.battery}%
                </div>
            </div>
        </div>
    );
}

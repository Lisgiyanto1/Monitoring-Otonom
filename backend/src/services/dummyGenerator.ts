import { DummyLokasi } from '../data/dummy/dummyData';
import { DeviceData } from '../types/deviceData';

export function startDummyDataGenerator(
    onData: (data: DeviceData) => void,
    interval = 5000
): NodeJS.Timeout {
    let featureIndex = 0;
    let coordIndex = 0;

    return setInterval(() => {
        const features = DummyLokasi[0]?.features;
        if (!features || features.length === 0) {
            console.error("❌ DummyLokasi kosong / tidak valid.");
            return;
        }

        if (featureIndex >= features.length) {
            featureIndex = 0;
            coordIndex = 0;
        }

        const feature = features[featureIndex];
        if (!feature) return;

        const { type, coordinates } = feature.geometry;

        const data: DeviceData = {
            latitude: 0,
            longitude: 0,
            battery: Math.floor(Math.random() * 100),
            speed: Math.floor(Math.random() * 100),
        };

        if (type === "Point") {
            data.latitude = coordinates[1];
            data.longitude = coordinates[0];
            featureIndex++;
            coordIndex = 0;
        } else if (type === "LineString") {
            if (coordIndex < coordinates.length) {
                const [lon, lat] = coordinates[coordIndex];
                data.latitude = lat;
                data.longitude = lon;
                coordIndex++;
            } else {
                featureIndex++;
                coordIndex = 0;
            }
        }

        onData(data);
    }, interval);
}

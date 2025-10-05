import { DeviceData } from '../types/deviceData';

export function parseTTNPayload(payload: Buffer): DeviceData | null {
    try {
        const message = JSON.parse(payload.toString());
        const decoded = message?.uplink_message?.decoded_payload;

        if (!decoded) return null;

        return {
            latitude: decoded.latitude ?? decoded.lat ?? 0.0,
            longitude: decoded.longitude ?? decoded.lon ?? decoded.long ?? 0.0,
            battery: decoded.battery ?? 0,
            speed: decoded.speed ?? 0,
        };
    } catch (err) {
        console.error('Error parsing TTN message:', err);
        return null;
    }
}

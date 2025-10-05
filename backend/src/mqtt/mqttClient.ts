import mqtt, { IClientOptions, MqttClient } from 'mqtt';

import { DeviceData } from '../types/deviceData';
import { parseTTNPayload } from './parseMqtt';

export function connectToMqtt(
    onData: (data: DeviceData) => void,
    onStatus: (status: string) => void
): MqttClient {
    const brokerUrl = `mqtt://${process.env.LORA_BROKER ?? 'localhost'}:${process.env.LORA_PORT ?? '1883'}`;
    const options: IClientOptions = {
        username: process.env.LORA_USERNAME,
        password: process.env.LORA_PASSWORD,
        clientId: `backend_server_${Date.now()}`,
    };

    console.log(`🔌 Connecting to TTN broker at ${brokerUrl}...`);
    const client = mqtt.connect(brokerUrl, options);

    client.on('connect', () => {
        onStatus('Connected to TTN ✅');
        const topic = process.env.LORA_TOPIC;
        if (topic) {
            client.subscribe(topic, (err) => {
                if (err) {
                    console.error('❌ Subscription failed:', err);
                    onStatus('Subscription Failed');
                } else {
                    console.log(`📡 Subscribed to topic: ${topic}`);
                }
            });
        } else {
            console.warn('⚠️ No LORA_TOPIC defined in .env');
        }
    });

    client.on('message', (_topic, payload) => {
        const parsed = parseTTNPayload(payload);
        if (parsed) onData(parsed);
    });

    client.on('error', (err) => {
        console.error('❌ MQTT Error:', err);
        onStatus('Connection Error');
    });

    client.on('close', () => {
        onStatus('Disconnected from TTN');
    });

    return client;
}

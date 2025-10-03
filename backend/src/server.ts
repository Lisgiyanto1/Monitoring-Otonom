
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import { Server } from 'http';
import mqtt, { IClientOptions, MqttClient } from 'mqtt';
import { DummyLokasi } from './dummy';


interface DeviceData {
  latitude: number;
  longitude: number;
  battery: number;
  speed: number;
}


let app: Express;
let server: Server;
let client: MqttClient;
let dummyDataInterval: NodeJS.Timeout;

let latestDeviceData: DeviceData | null = null;
let connectionStatus = 'Offline';


function parseTTNPayload(payload: Buffer): DeviceData | null {
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


function startDummyDataGenerator(interval = 5000): NodeJS.Timeout {
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

    if (type === "Point") {
      latestDeviceData = {
        latitude: coordinates[1],
        longitude: coordinates[0],
        battery: Math.floor(Math.random() * 100),
        speed: Math.floor(Math.random() * 100),
      };
      featureIndex++;
      coordIndex = 0;
    } else if (type === "LineString") {
      if (coordIndex < coordinates.length) {
        const [lon, lat] = coordinates[coordIndex];
        latestDeviceData = {
          latitude: lat,
          longitude: lon,
          battery: Math.floor(Math.random() * 100),
          speed: Math.floor(Math.random() * 100),
        };
        coordIndex++;
      } else {
        featureIndex++;
        coordIndex = 0;
      }
    }
  }, interval);
}


export function startServer(): { app: Express; server: Server } {
  app = express();
  app.use(cors());

  const port =
    process.env.NODE_ENV === 'test'
      ? 0
      : Number(process.env.API_PORT) || 3001;


  latestDeviceData = null;
  connectionStatus = 'Initializing...';


  const brokerUrl = `mqtt://${process.env.LORA_BROKER ?? 'localhost'}:${process.env.LORA_PORT ?? '1883'}`;
  const options: IClientOptions = {
    username: process.env.LORA_USERNAME,
    password: process.env.LORA_PASSWORD,
    clientId: `backend_server_${Date.now()}`,
  };

  console.log(`🔌 Connecting to TTN broker at ${brokerUrl}...`);
  client = mqtt.connect(brokerUrl, options);

  client.on('connect', () => {
    connectionStatus = 'Connected to TTN ✅';
    console.log(connectionStatus);

    const topic = process.env.LORA_TOPIC;
    if (topic) {
      client.subscribe(topic, (err) => {
        if (err) {
          console.error('❌ Subscription failed:', err);
          connectionStatus = 'Subscription Failed';
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
    if (parsed) {
      latestDeviceData = parsed;
      console.log('📥 Received TTN data:', parsed);
    }
  });

  client.on('error', (err) => {
    connectionStatus = 'Connection Error';
    console.error('❌ MQTT Error:', err);
  });

  client.on('close', () => {
    connectionStatus = 'Disconnected from TTN';
    console.log(connectionStatus);
  });


  dummyDataInterval = startDummyDataGenerator();


  app.get('/api/dummy', (_req: Request, res: Response) => {
    res.json(DummyLokasi);
  });

  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({
      status: connectionStatus,
      hasData: latestDeviceData !== null,
    });
  });

  app.get('/api/latest-data', (_req: Request, res: Response) => {
    if (latestDeviceData) {
      res.json(latestDeviceData);
    } else {
      res.status(404).json({ message: 'No device data available yet.' });
    }
  });


  server = app.listen(port, () => {
    const address = server.address();
    const actualPort = typeof address === 'string' ? address : address?.port;
    console.log(`🚀 Backend running at http://localhost:${actualPort}`);
  });

  return { app, server };
}


export function stopServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server) return resolve();

    console.log("🛑 Stopping server & services...");

    clearInterval(dummyDataInterval);

    if (client) {
      client.end(true, () => console.log("🔌 MQTT disconnected."));
    }

    server.close((err) => {
      if (err) {
        console.error("❌ Error closing server:", err);
        return reject(err);
      }
      console.log("✅ Server stopped.");
      resolve();
    });
  });
}

if (require.main === module) {
  dotenv.config();
  startServer();
}

// File: backend/src/server.ts (Refactored for Testability)

import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import { Server } from 'http';
import mqtt, { MqttClient } from 'mqtt';
import { DummyLokasi } from './dummy';

// Tipe data yang dibutuhkan
interface DeviceData {
  latitude: number;
  longitude: number;
  battery: number;
  speed: number;
}

// --- Deklarasi Variabel di Scope Modul ---
// Variabel-variabel ini akan diinisialisasi oleh startServer()
// dan dihentikan oleh stopServer().
let app: Express;
let server: Server;
let client: MqttClient;
let dummyDataInterval: NodeJS.Timeout;

let latestDeviceData: DeviceData | null = null;
let connectionStatus: string = 'Offline';

// --- FUNGSI UTAMA: UNTUK MEMULAI SEMUA LAYANAN ---
export function startServer(): { app: Express, server: Server } {
  app = express();
  // Gunakan port 0 untuk tes agar otomatis memilih port yang tersedia
  // atau port dari .env untuk penggunaan normal.
  const port = process.env.NODE_ENV === 'test' ? 0 : (process.env.API_PORT || 3001);
  app.use(cors());

  // Inisialisasi State
  latestDeviceData = null;
  connectionStatus = 'Initializing...';

  // --- Koneksi ke TTN MQTT Broker ---
  const brokerUrl = `mqtt://${process.env.LORA_BROKER}:${process.env.LORA_PORT}`;
  const options: mqtt.IClientOptions = {
    username: process.env.LORA_USERNAME,
    password: process.env.LORA_PASSWORD,
    clientId: `backend_server_${Date.now()}`,
  };
  
  console.log(`Attempting to connect to TTN broker at ${brokerUrl}`);
  client = mqtt.connect(brokerUrl, options);

  // --- Event Handlers untuk Klien MQTT ---
  client.on('connect', () => {
    connectionStatus = 'Connected to TTN :)';
    console.log(connectionStatus);
    client.subscribe(process.env.LORA_TOPIC!, (err) => {
      if (err) {
        console.error('Failed to subscribe:', err);
        connectionStatus = 'Subscription Failed';
      } else {
        console.log(`Subscribed to topic: ${process.env.LORA_TOPIC}`);
      }
    });
  });

  client.on('message', (topic: string, payload: Buffer) => {
    try {
      const message = JSON.parse(payload.toString());
      if (message.uplink_message?.decoded_payload) {
        const decoded = message.uplink_message.decoded_payload;
        console.log('Received decoded payload:', decoded);
        latestDeviceData = {
          latitude: decoded.latitude ?? decoded.lat ?? 0.0,
          longitude: decoded.longitude ?? decoded.lon ?? decoded.long ?? 0.0,
          battery: decoded.battery ?? 0,
          speed: decoded.speed ?? 0,
        };
      }
    } catch (error) {
      console.error('Error parsing TTN message:', error);
    }
  });

  client.on('error', (err: Error) => {
    connectionStatus = 'Connection Error';
    console.error('MQTT Connection Error:', err);
  });

  client.on('close', () => {
    connectionStatus = 'Disconnected from TTN';
    console.log(connectionStatus);
  });

  // --- Logika Dummy Data (setInterval) ---
  let currentFeatureIndex = 0;
  let currentCoordinateIndex = 0;
  dummyDataInterval = setInterval(() => {
    if (!DummyLokasi[0]?.features || DummyLokasi[0].features.length === 0) {
      console.error("Struktur DummyLokasi tidak valid atau kosong.");
      return;
    }
    const features = DummyLokasi[0].features;
    if (currentFeatureIndex >= features.length) {
      currentFeatureIndex = 0;
      currentCoordinateIndex = 0;
    }
    const currentFeature = features[currentFeatureIndex];
    if (!currentFeature) {
      currentFeatureIndex = 0;
      return;
    }
    if (currentFeature.geometry.type === "Point") {
      latestDeviceData = {
        latitude: currentFeature.geometry.coordinates[1],
        longitude: currentFeature.geometry.coordinates[0],
        battery: Math.floor(Math.random() * 100),
        speed: Math.floor(Math.random() * 100),
      };
      currentFeatureIndex++;
      currentCoordinateIndex = 0;
    } else if (currentFeature.geometry.type === "LineString") {
      const lineCoords = currentFeature.geometry.coordinates;
      if (currentCoordinateIndex < lineCoords.length) {
        const currentPoint = lineCoords[currentCoordinateIndex];
        latestDeviceData = {
          latitude: currentPoint[1],
          longitude: currentPoint[0],
          battery: Math.floor(Math.random() * 100),
          speed: Math.floor(Math.random() * 100),
        };
        currentCoordinateIndex++;
      }
      if (currentCoordinateIndex >= lineCoords.length) {
        currentFeatureIndex++;
        currentCoordinateIndex = 0;
      }
    }
  }, 5000);

  // --- API Endpoints ---
  app.get('/api/dummy', (req: Request, res: Response) => {
    res.json(DummyLokasi);
  });
  app.get('/api/status', (req: Request, res: Response) => {
    res.json({
      status: connectionStatus,
      hasData: latestDeviceData !== null
    });
  });
  app.get('/api/latest-data', (req: Request, res: Response) => {
    if (latestDeviceData) {
      res.json(latestDeviceData);
    } else {
      res.status(404).json({ message: 'No data has been received from the device yet.' });
    }
  });

  // --- Menjalankan Server ---
  server = app.listen(port, () => {
    const address = server.address();
    const actualPort = typeof address === 'string' ? address : address?.port;
    console.log(`|| Backend server is running on http://localhost:${actualPort} ||`);
  });

  return { app, server };
}

// --- FUNGSI UTAMA: UNTUK MENGHENTIKAN SEMUA LAYANAN ---
export function stopServer(): Promise<void> {
  // Gunakan Promise untuk menangani operasi asinkron
  return new Promise((resolve, reject) => {
    // Jika server tidak berjalan, langsung selesaikan
    if (!server) {
      return resolve();
    }
    
    console.log("|| Stopping server and services... ||");
    
    // 1. Hentikan interval dummy data
    clearInterval(dummyDataInterval);

    // 2. Putuskan koneksi MQTT, jika ada
    if (client) {
      // 'true' memaksa koneksi ditutup tanpa menunggu pesan offline.
      client.end(true, () => {
        console.log("|| MQTT client disconnected. ||");
      }); 
    }

    // 3. Matikan server HTTP
    server.close((err) => {
      if (err) {
        console.error("Error closing server:", err);
        return reject(err);
      }
      console.log("|| Server stopped. ||");
      resolve();
    });
  });
}

if (require.main === module) {
  dotenv.config();
  startServer();
}
// File: backend/src/server.ts
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import mqtt, { MqttClient } from 'mqtt';

// Impor tipe data yang sama dengan frontend untuk konsistensi
// (Anda bisa membuat shared library atau cukup copy-paste untuk proyek sederhana)
interface DeviceData {
  latitude: number;
  longitude: number;
  battery: number;
  speed: number;
}

// --- Setup Awal ---
dotenv.config(); // Memuat variabel dari file .env
const app = express();
const port = process.env.API_PORT || 3001;
app.use(cors()); // Mengizinkan permintaan dari domain lain (frontend Anda)

// --- State Management Sederhana ---
// Di aplikasi produksi, ini akan menjadi database (e.g., Redis, PostgreSQL).
let latestDeviceData: DeviceData | null = null;
let connectionStatus: string = 'Initializing...';

// --- Koneksi ke TTN MQTT Broker ---
const brokerUrl = `mqtt://${process.env.LORA_BROKER}:${process.env.LORA_PORT}`;
const options: mqtt.IClientOptions = {
  username: process.env.LORA_USERNAME,
  password: process.env.LORA_PASSWORD,
  clientId: `backend_server_${Date.now()}`,
};

console.log(`Attempting to connect to TTN broker at ${brokerUrl}`);
const client: MqttClient = mqtt.connect(brokerUrl, options);

// --- Event Handlers untuk Klien MQTT ---
client.on('connect', () => {
  connectionStatus = 'Connected to TTN :)';
  console.log(connectionStatus);
  client.subscribe(process.env.LORA_TOPIC!, (err) => { // Tanda '!' berarti kita yakin variabel ini ada
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
    
    // Ekstrak data dari struktur payload TTN V3 yang kompleks
    if (message.uplink_message?.decoded_payload) {
      const decoded = message.uplink_message.decoded_payload;
      console.log('Received decoded payload:', decoded);
      
      // Simpan data yang sudah diproses ke state kita
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
  // Di aplikasi produksi, Anda mungkin ingin mencoba koneksi ulang di sini
});

client.on('close', () => {
  connectionStatus = 'Disconnected from TTN';
  console.log(connectionStatus);
});

// --- API Endpoints ---

// Endpoint untuk frontend memeriksa status koneksi backend ke TTN
app.get('/api/status', (req: Request, res: Response) => {
  res.json({ 
    status: connectionStatus,
    hasData: latestDeviceData !== null 
  });
});

// Endpoint utama untuk frontend mendapatkan data perangkat terbaru
app.get('/api/latest-data', (req: Request, res: Response) => {
  if (latestDeviceData) {
    res.json(latestDeviceData);
  } else {
    res.status(404).json({ message: 'No data has been received from the device yet.' });
  }
});

// --- Menjalankan Server ---
app.listen(port, () => {
  console.log(`|| Backend server is running on http://localhost:${port} ||`);
});
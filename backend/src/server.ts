import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express } from 'express';
import { Server } from 'http';
import { MqttClient } from 'mqtt/*';
import { connectToMqtt } from './mqtt/mqttClient';
import { createApiRoutes } from './routes/apiRoutes';
import { startDummyDataGenerator } from './services/dummyGenerator';
import { DeviceData } from './types/deviceData';

dotenv.config();

let app: Express;
let server: Server;
let latestDeviceData: DeviceData | null = null;
let connectionStatus = 'Offline'; // Default sesuai hasil aktual

let dummyInterval: NodeJS.Timeout;
let mqttClient: MqttClient;

export function startServer(): { app: Express; server: Server } {
  app = express();
  app.use(cors());

  const port =
    process.env.NODE_ENV === 'test'
      ? 0
      : Number(process.env.API_PORT) || 3001;

  mqttClient = connectToMqtt(
    (data) => (latestDeviceData = data),
    (status) => (connectionStatus = status)
  );

  dummyInterval = startDummyDataGenerator((data) => (latestDeviceData = data));

  app.use('/api', createApiRoutes(() => connectionStatus, () => latestDeviceData));

  server = app.listen(port, () => {
    const address = server.address();
    const actualPort = typeof address === 'string' ? address : address?.port;
    console.log(`🚀 Backend running at http://localhost:${actualPort}`);
  });

  process.on('SIGINT', () => {
    stopServer();
  });

  return { app, server };
}

export async function stopServer(): Promise<void> {
  clearInterval(dummyInterval);
  if (mqttClient) mqttClient.end(true);
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log('🛑 Server stopped.');
  }
}

if (require.main === module) {
  startServer();
}

import { Server } from 'http';
import request from 'supertest';
import { DummyLokasi } from '../src/dummy';
import { startServer, stopServer } from '../src/server';

jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    subscribe: jest.fn(),
    end: jest.fn((force: boolean, callback?: () => void) => {
      if (callback) callback();
    }),
  })),
}));

describe('API Endpoints Tests', () => {
  let runningServer: Server;

  beforeAll(async () => {
    const { server } = await startServer(); // pastikan async
    runningServer = server;
  });

  afterAll(async () => {
    if (runningServer) {
      await stopServer();
    }
  });

  describe('GET /api/dummy', () => {
    it('should return the complete dummy location data with a 200 status code', async () => {
      const response = await request(runningServer).get('/api/dummy');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(DummyLokasi);
    });
  });

  describe('GET /api/status', () => {
    it('should return the initial status before any data is received', async () => {
      const response = await request(runningServer).get('/api/status');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        status: 'Initializing...',
        hasData: false,
      });
    });
  });

  describe('GET /api/latest-data', () => {
    it('should return a 404 Not Found error when no data has been received yet', async () => {
      const response = await request(runningServer).get('/api/latest-data');
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({
        message: 'No device data available yet.',
      });
    });
  });

});

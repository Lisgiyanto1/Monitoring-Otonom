// File: backend/src/server.test.ts

import request from 'supertest';
import app from './server'; // Pastikan Anda mengekspor 'app' dari server.ts

describe('GET /', () => {
  it('should respond with a 200 status code', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });
});
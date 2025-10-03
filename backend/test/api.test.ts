// File: backend/test/api.test.ts

import request from 'supertest';
import { DummyLokasi } from '../src/dummy';
import app from '../src/server';

// =====================================================================================
// MOCKING DEPENDENSI (MEMALSUKAN LIBRARY EKSTERNAL)
// =====================================================================================
jest.mock('mqtt', () => ({
    connect: jest.fn(() => ({
        on: jest.fn(),
        subscribe: jest.fn(),
        end: jest.fn(),
    })),
}));

// Mengaktifkan kontrol waktu palsu untuk Jest
jest.useFakeTimers();

// =====================================================================================
// MULAI MENULIS TES
// =====================================================================================

describe('API Endpoints Tests', () => {

    // Hook ini akan berjalan SETELAH SEMUA tes dalam blok 'describe' ini selesai.
    afterAll(() => {
        // ================== PERBAIKAN UTAMA DI SINI ==================
        // 1. Secara eksplisit membersihkan SEMUA timer yang sedang menunggu di antrian.
        //    Ini adalah langkah paling penting untuk mencegah "kebocoran".
        jest.clearAllTimers();

        // 2. Mengembalikan penggunaan timer ke kondisi normal.
        jest.useRealTimers();
        // =============================================================
    });

    // Tes untuk endpoint /api/dummy
    describe('GET /api/dummy', () => {
        it('should return the complete dummy location data with a 200 status code', async () => {
            const response = await request(app).get('/api/dummy');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(DummyLokasi);
        });
    });

    // Tes untuk endpoint /api/status
    describe('GET /api/status', () => {
        it('should return the initial status before any data is received', async () => {
            const response = await request(app).get('/api/status');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                status: 'Initializing...',
                hasData: false
            });
        });
    });

    // Tes untuk endpoint /api/latest-data
    describe('GET /api/latest-data', () => {
        it('should return a 404 Not Found error when no data has been received yet', async () => {
            const response = await request(app).get('/api/latest-data');
            expect(response.statusCode).toBe(404);
            expect(response.body).toEqual({
                message: 'No data has been received from the device yet.'
            });
        });
    });

});
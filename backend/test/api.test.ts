import request from 'supertest';
import { DummyLokasi } from '../src/dummy'; // Mengimpor data dummy untuk perbandingan
import app from '../src/server'; // Mengimpor app dari server.ts yang sudah dimodifikasi

/**
 * =====================================================================================
 * MOCKING DEPENDENCIES
 * =====================================================================================
 * Kode di server.ts mencoba terhubung ke MQTT broker.
 * Dalam lingkungan tes, koneksi ini tidak ada dan akan menyebabkan error atau timeout.
 * Kita 'menipu' Jest untuk menggunakan versi palsu (mock) dari library 'mqtt'.
 * Jadi, saat server.ts memanggil `mqtt.connect()`, ia tidak benar-benar terhubung ke mana pun.
 */
jest.mock('mqtt', () => ({
    connect: jest.fn(() => ({
        on: jest.fn(), // Mock method .on() agar tidak error
        subscribe: jest.fn(), // Mock method .subscribe()
        end: jest.fn(), // Mock method .end()
    })),
}));

// Juga, kita matikan setInterval agar tidak membuat tes berjalan selamanya.
jest.useFakeTimers();

// =====================================================================================
// MULAI MENULIS TES
// =====================================================================================

describe('API Endpoints Tests', () => {

    // Tes untuk endpoint /api/dummy
    describe('GET /api/dummy', () => {
        it('should return the complete dummy location data with a 200 status code', async () => {
            const response = await request(app).get('/api/dummy');

            expect(response.statusCode).toBe(200);
            // `toEqual` digunakan untuk membandingkan objek atau array secara mendalam
            expect(response.body).toEqual(DummyLokasi);
        });
    });

    // Tes untuk endpoint /api/status
    describe('GET /api/status', () => {
        it('should return the initial status before any data is received', async () => {
            const response = await request(app).get('/api/status');

            expect(response.statusCode).toBe(200);
            // Saat server pertama kali dimulai, statusnya adalah 'Initializing...' dan belum ada data
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

        // Catatan: Menguji kasus 'sukses' untuk endpoint ini akan lebih rumit.
        // Anda perlu cara untuk memanipulasi variabel 'latestDeviceData' dari dalam tes.
        // Ini biasanya melibatkan teknik mocking yang lebih canggih pada modul server.
        // Untuk saat ini, menguji kasus kegagalan awal sudah merupakan langkah yang bagus.
    });

});
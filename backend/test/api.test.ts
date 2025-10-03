// File: backend/test/api.test.ts

import request from 'supertest';
import { DummyLokasi } from '../src/dummy'; // Mengimpor data dummy untuk perbandingan
import app from '../src/server'; // Mengimpor app dari server.ts yang sudah dimodifikasi

// =====================================================================================
// MOCKING DEPENDENSI (MEMALSUKAN LIBRARY EKSTERNAL)
// =====================================================================================
// Kode di `server.ts` mencoba terhubung ke MQTT broker. Dalam lingkungan tes,
// koneksi ini tidak ada dan akan menyebabkan error atau timeout.
// Kita 'menipu' Jest untuk menggunakan versi palsu (mock) dari library 'mqtt'.
// Jadi, saat server.ts memanggil `mqtt.connect()`, ia tidak benar-benar terhubung ke internet.
jest.mock('mqtt', () => ({
    connect: jest.fn(() => ({
        on: jest.fn(), // Mock method .on() agar tidak error
        subscribe: jest.fn(),
        end: jest.fn(),
    })),
}));

// Gunakan fake timers untuk mengontrol `setInterval` dan `setTimeout` di dalam kode kita.
// Ini mencegah `setInterval` dari server.ts berjalan secara nyata dan mengganggu tes.
jest.useFakeTimers();

// =====================================================================================
// MULAI MENULIS TES
// =====================================================================================

describe('API Endpoints Tests', () => {

    // Hook ini akan berjalan SETELAH SEMUA tes dalam blok 'describe' ini selesai.
    // Tujuannya adalah untuk membersihkan proses yang masih berjalan di latar belakang.
    afterAll(() => {
        // Membersihkan semua timer yang tertunda dan mengembalikan kontrol waktu ke Node.js.
        // Ini secara efektif akan "menghentikan" setInterval dan mengatasi error
        // "Cannot log after tests are done".
        jest.useRealTimers();
    });

    // Tes untuk endpoint /api/dummy
    describe('GET /api/dummy', () => {
        it('should return the complete dummy location data with a 200 status code', async () => {
            // Menjalankan permintaan GET ke /api/dummy
            const response = await request(app).get('/api/dummy');

            // Memastikan status code adalah 200 (OK)
            expect(response.statusCode).toBe(200);
            // `toEqual` digunakan untuk membandingkan objek atau array secara mendalam
            // Memastikan body respons sama persis dengan data dummy yang kita impor
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

            // Memastikan status code adalah 404 (Not Found) karena belum ada data
            expect(response.statusCode).toBe(404);
            // Memastikan pesan errornya sesuai
            expect(response.body).toEqual({
                message: 'No data has been received from the device yet.'
            });
        });
    });

});
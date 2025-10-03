// File: jest.config.js (di root)

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Lingkungan tes seperti browser
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'], // File setup tambahan
  moduleNameMapper: {
    // Menangani impor file CSS/aset yang tidak bisa dibaca Jest
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
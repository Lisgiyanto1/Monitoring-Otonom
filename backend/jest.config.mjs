export default {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // +++++++++++++++++++++++ TAMBAHKAN BARIS INI +++++++++++++++++++++++
  // Secara eksplisit memberitahu Jest untuk hanya mencari tes di dalam direktori
  // 'src' atau 'test' yang ada di dalam folder backend ini.
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/test/**/*.test.ts'],
  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json', 
    }],
  },
};
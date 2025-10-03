export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      // Pastikan path ke tsconfig backend Anda benar
      tsconfig: 'tsconfig.json', 
    }],
  },
};
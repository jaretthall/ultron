export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  
  // Module name mapping for absolute imports and aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1', 
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
    '<rootDir>/components/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/components/**/*.(test|spec).{js,jsx,ts,tsx}',
    '<rootDir>/services/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/services/**/*.(test|spec).{js,jsx,ts,tsx}',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'services/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/setupTests.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
  
  coverageThreshold: {
    global: {
      branches: 2,
      functions: 3,
      lines: 4,
      statements: 4,
    },
  },
  
  // Transform ignore patterns for ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(@google/genai)/)',
  ],
  
  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Test timeout
  testTimeout: 10000,
};

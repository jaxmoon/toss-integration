const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js 앱의 경로 (next.config.js와 .env 파일을 로드하기 위함)
  dir: './',
})

// Jest에 전달할 커스텀 설정
const customJestConfig = {
  // 각 테스트 전에 실행할 설정 파일
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // 테스트 환경
  testEnvironment: 'jest-environment-jsdom',

  // 모듈 경로 매핑 (tsconfig.json의 paths와 일치)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // 테스트 파일 패턴
  testMatch: [
    '**/__tests__/**/*.{test,spec}.{ts,tsx}',
    '**/*.{test,spec}.{ts,tsx}',
  ],

  // 테스트에서 제외할 패턴
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/__tests__/utils/',
    '<rootDir>/__tests__/mocks/',
    '<rootDir>/e2e/',
  ],

  // 커버리지 수집 대상
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'config/**/*.ts',
    'types/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],

  // 커버리지 임계값 (목표: 80%)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // 테스트 타임아웃 (결제 API 테스트 고려)
  testTimeout: 10000,
}

// Next.js용 Jest 설정 반환
module.exports = createJestConfig(customJestConfig)

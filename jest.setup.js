// jest.setup.js
import '@testing-library/jest-dom'

// Toss Payments SDK 모킹
global.TossPayments = jest.fn(() => ({
  widgets: jest.fn(() => ({
    setAmount: jest.fn(),
    renderPaymentMethods: jest.fn(),
    renderAgreement: jest.fn(),
  })),
  requestPayment: jest.fn(),
}))

// 환경 변수 모킹
process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm'
process.env.TOSS_SECRET_KEY = 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6'
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'

// window.matchMedia 모킹 (CSS 미디어 쿼리 테스트용)
// Only run in jsdom environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// IntersectionObserver 모킹
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

console.log('✅ Jest setup complete')

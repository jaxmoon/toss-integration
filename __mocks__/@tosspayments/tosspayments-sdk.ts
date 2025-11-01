/**
 * Mock for @tosspayments/tosspayments-sdk
 */

export const loadTossPayments = jest.fn((clientKey: string) => {
  if (!clientKey) {
    return Promise.reject(new Error('Client key is required'))
  }

  return Promise.resolve({
    widgets: jest.fn((options?: { customerKey?: string }) => ({
      setAmount: jest.fn(),
      renderPaymentMethods: jest.fn(),
      renderAgreement: jest.fn(),
      requestPayment: jest.fn(),
    })),
    requestPayment: jest.fn(),
  })
})

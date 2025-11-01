// __tests__/sample.test.ts
describe('Test Environment', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true)
  })

  it('should have environment variables', () => {
    expect(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY).toBeDefined()
    expect(process.env.TOSS_SECRET_KEY).toBeDefined()
  })

  it('should import mock data', async () => {
    const { mockOrder, mockCustomer } = await import('./mocks/payment-data')
    expect(mockOrder.orderId).toBe('order-test-001')
    expect(mockCustomer.name).toBe('홍길동')
  })
})

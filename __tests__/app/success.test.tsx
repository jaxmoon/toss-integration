/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import SuccessPage from '@/app/success/page'

// Mock Next.js navigation and search params
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => {
    const params = new URLSearchParams('paymentKey=test_key&orderId=order-001&amount=50000')
    return params
  },
  usePathname: () => '/success',
}))

// Mock fetch for payment confirmation
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    success: true,
    data: {
      paymentKey: 'test_key',
      orderId: 'order-001',
      status: 'DONE',
      totalAmount: 50000,
      method: '카드',
      approvedAt: '2024-01-01T00:00:00.000Z',
    },
  }),
}) as jest.Mock

describe('Success Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render success page with loading state initially', () => {
    render(<SuccessPage />)

    // Initial loading state (Suspense fallback or component loading)
    expect(screen.getByText(/불러오는 중|확인하는 중/)).toBeInTheDocument()
  })

  it('should display success message after payment confirmation', async () => {
    render(<SuccessPage />)

    // Wait for payment confirmation to complete
    await waitFor(() => {
      expect(screen.getByText(/결제 완료/)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify success heading is present (no subtitle message in this implementation)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('결제 완료')
  })

  it('should display payment details', async () => {
    render(<SuccessPage />)

    // Wait for details to load
    await waitFor(() => {
      expect(screen.getByText(/결제 완료/)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify order ID is displayed
    expect(screen.getByText(/order-001/)).toBeInTheDocument()

    // Verify amount is displayed
    expect(screen.getByText(/50,000원/)).toBeInTheDocument()
  })

  it('should have home button', async () => {
    render(<SuccessPage />)

    await waitFor(() => {
      expect(screen.getByText(/결제 완료/)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify home button exists - uses "홈으로 돌아가기" text
    const homeButton = screen.getByRole('link', { name: /홈으로 돌아가기/i })
    expect(homeButton).toBeInTheDocument()
    expect(homeButton).toHaveAttribute('href', '/')
  })
})

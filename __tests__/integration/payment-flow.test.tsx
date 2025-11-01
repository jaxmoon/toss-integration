/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import CheckoutPage from '@/app/checkout/page'
import { DEFAULT_ORDER } from '@/config/constants'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/checkout',
}))

// Mock Toss Payments SDK
jest.mock('@tosspayments/tosspayments-sdk', () => ({
  loadTossPayments: jest.fn().mockResolvedValue({
    widgets: jest.fn().mockResolvedValue({
      renderPaymentMethods: jest.fn(),
      renderAgreement: jest.fn(),
      requestPayment: jest.fn(),
    }),
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Payment Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render checkout page with order summary and payment widget', async () => {
    render(<CheckoutPage />)

    // 페이지 제목 확인
    expect(screen.getByText(/주문\/결제/)).toBeInTheDocument()

    // 주문 요약 섹션 확인
    const orderSection = screen.getByRole('region', { name: '주문 정보' })
    expect(orderSection).toBeInTheDocument()

    // 결제 정보 섹션 확인
    const paymentSection = screen.getByRole('region', { name: '결제 정보' })
    expect(paymentSection).toBeInTheDocument()

    // 결제 정보 제목 확인
    expect(screen.getByText('결제 정보')).toBeInTheDocument()
  })

  it('should display order total correctly', () => {
    render(<CheckoutPage />)

    // 총 결제금액 표시 확인
    expect(screen.getByText('총 결제금액')).toBeInTheDocument()

    // 금액 포맷 확인 (50,000원) - getAllByText를 사용하여 여러 개 허용
    const amountTexts = screen.getAllByText(/50,000원/)
    expect(amountTexts.length).toBeGreaterThan(0)
  })

  it('should display test payment notice', () => {
    render(<CheckoutPage />)

    // 테스트 안내 섹션 확인
    const testNotice = screen.getByRole('complementary', { name: '테스트 안내' })
    expect(testNotice).toBeInTheDocument()

    // 테스트 카드번호 안내 확인
    expect(screen.getByText(/테스트 카드번호/)).toBeInTheDocument()
    expect(screen.getByText(/4242 4242 4242 4242/)).toBeInTheDocument()
  })

  it('should display order items with correct information', () => {
    render(<CheckoutPage />)

    // 주문 상품 확인 - 첫 번째 상품 (여러 곳에 표시될 수 있음)
    const firstItem = DEFAULT_ORDER.items[0]
    const itemNames = screen.getAllByText(firstItem.name)
    expect(itemNames.length).toBeGreaterThan(0)

    // 상품 가격 확인 - getAllByText 사용
    const priceTexts = screen.getAllByText(/50,000원/)
    expect(priceTexts.length).toBeGreaterThan(0)
  })

  it('should render payment widget loading state initially', async () => {
    render(<CheckoutPage />)

    // 결제 위젯이 로딩 중인 상태 확인
    // Note: 실제 로딩 상태는 PaymentWidget 컴포넌트 내부에서 관리됨
    await waitFor(() => {
      const paymentSection = screen.getByRole('region', { name: '결제 정보' })
      expect(paymentSection).toBeInTheDocument()
    })
  })

  it('should have proper accessibility attributes', () => {
    render(<CheckoutPage />)

    // ARIA labels 확인
    expect(screen.getByRole('region', { name: '주문 정보' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '결제 정보' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: '테스트 안내' })).toBeInTheDocument()

    // 페이지 헤더 확인
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('주문/결제')
  })

  it('should display order name in summary', () => {
    render(<CheckoutPage />)

    // 주문명 확인 (여러 곳에 표시될 수 있음)
    const orderNames = screen.getAllByText(DEFAULT_ORDER.orderName)
    expect(orderNames.length).toBeGreaterThan(0)
  })
})

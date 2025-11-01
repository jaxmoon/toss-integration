/**
 * @jest-environment jsdom
 */
import { render, screen } from '@/__tests__/utils/test-utils'
import FailPage from '@/app/fail/page'

// Mock Next.js navigation and search params
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => {
    const params = new URLSearchParams('code=PAY_PROCESS_CANCELED&message=사용자가 결제를 취소했습니다')
    return params
  },
  usePathname: () => '/fail',
}))

describe('Fail Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render fail page with error message', () => {
    render(<FailPage />)

    // Verify page title
    expect(screen.getByText(/결제 실패/)).toBeInTheDocument()

    // Verify error message
    expect(screen.getByText(/사용자가 결제를 취소했습니다/)).toBeInTheDocument()
  })

  it('should display error code', () => {
    render(<FailPage />)

    // Verify error code is displayed
    expect(screen.getByText(/에러 코드:/)).toBeInTheDocument()
    expect(screen.getByText(/PAY_PROCESS_CANCELED/)).toBeInTheDocument()
  })

  it('should have retry button', () => {
    render(<FailPage />)

    // Verify retry button exists
    const retryButton = screen.getByRole('link', { name: /다시 시도/i })
    expect(retryButton).toBeInTheDocument()
    expect(retryButton).toHaveAttribute('href', '/checkout')
  })

  it('should have home button', () => {
    render(<FailPage />)

    // Verify home button exists
    const homeButton = screen.getByRole('link', { name: /홈으로/i })
    expect(homeButton).toBeInTheDocument()
    expect(homeButton).toHaveAttribute('href', '/')
  })

  it('should have proper accessibility attributes', () => {
    render(<FailPage />)

    // Verify main heading
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/결제 실패/)

    // Verify error section is marked as alert
    const errorAlert = screen.getByRole('alert')
    expect(errorAlert).toBeInTheDocument()
  })
})

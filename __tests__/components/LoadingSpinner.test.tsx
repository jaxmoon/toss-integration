import { render, screen } from '@/__tests__/utils/test-utils'
import { LoadingSpinner } from '@/components/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('should render spinner', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should display custom message', () => {
    render(<LoadingSpinner message="결제 처리 중..." />)
    expect(screen.getByText('결제 처리 중...')).toBeInTheDocument()
  })

  it('should display default message', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-live', 'polite')
  })
})

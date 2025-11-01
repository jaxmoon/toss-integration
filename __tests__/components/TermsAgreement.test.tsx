import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { TermsAgreement } from '@/components/TermsAgreement'

describe('TermsAgreement', () => {
  it('should render all required terms', () => {
    render(<TermsAgreement onAgreementChange={jest.fn()} />)
    expect(screen.getByText(/개인정보 수집 및 이용/)).toBeInTheDocument()
    expect(screen.getByText(/결제대행 서비스 이용약관/)).toBeInTheDocument()
  })

  it('should call onChange when term is checked', () => {
    const handleChange = jest.fn()
    render(<TermsAgreement onAgreementChange={handleChange} />)

    const checkbox = screen.getByLabelText(/개인정보 수집/)
    fireEvent.click(checkbox)

    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      allAgreed: false,
    }))
  })

  it('should check all when "전체 동의" is clicked', () => {
    const handleChange = jest.fn()
    render(<TermsAgreement onAgreementChange={handleChange} />)

    const allAgree = screen.getByLabelText(/전체 동의/)
    fireEvent.click(allAgree)

    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      allAgreed: true,
    }))
  })

  it('should disable submit when required terms not agreed', () => {
    const handleChange = jest.fn()
    render(<TermsAgreement onAgreementChange={handleChange} />)

    // Initially all unchecked
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      canProceed: false,
    }))
  })
})

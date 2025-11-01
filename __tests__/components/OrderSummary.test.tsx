import { render, screen } from '@/__tests__/utils/test-utils'
import { OrderSummary } from '@/components/OrderSummary'
import { mockOrder } from '@/__tests__/mocks/payment-data'

describe('OrderSummary', () => {
  it('should render order name', () => {
    render(<OrderSummary order={mockOrder} />)
    expect(screen.getByText(mockOrder.orderName)).toBeInTheDocument()
  })

  it('should render all order items', () => {
    render(<OrderSummary order={mockOrder} />)
    mockOrder.items.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument()
    })
  })

  it('should display formatted prices', () => {
    render(<OrderSummary order={mockOrder} />)
    expect(screen.getAllByText(/10,000원/)).toHaveLength(2) // item price + total
  })

  it('should calculate and display total amount', () => {
    render(<OrderSummary order={mockOrder} />)
    expect(screen.getByText('총 결제금액')).toBeInTheDocument()
    const totalElement = screen.getByText('총 결제금액').nextElementSibling
    expect(totalElement).toHaveTextContent('10,000원')
  })

  it('should display item quantities', () => {
    const orderWithMultiple = {
      ...mockOrder,
      items: [{ ...mockOrder.items[0], quantity: 3 }],
    }
    render(<OrderSummary order={orderWithMultiple} />)
    expect(screen.getByText(/수량: 3/)).toBeInTheDocument()
  })
})

/**
 * Toss Payments 결제 연동을 위한 TypeScript 타입 정의
 *
 * @see https://docs.tosspayments.com/reference
 */

/**
 * 주문 상품 정보
 */
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

/**
 * 주문 정보
 */
export interface Order {
  orderId: string;
  orderName: string;
  amount: number;
  items: OrderItem[];
}

/**
 * 고객 정보
 */
export interface Customer {
  name: string;
  email: string;
  phone: string;
}

/**
 * 결제 요청 파라미터
 * Toss Payments 위젯 requestPayment 호출 시 사용
 */
export interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerMobilePhone: string;
  successUrl: string;
  failUrl: string;
}

/**
 * 결제 상태
 * @see https://docs.tosspayments.com/reference#payment-객체
 */
export type PaymentStatus =
  | 'READY'              // 결제 준비
  | 'IN_PROGRESS'        // 결제 진행 중
  | 'WAITING_FOR_DEPOSIT' // 가상계좌 입금 대기
  | 'DONE'               // 결제 완료
  | 'CANCELED'           // 결제 취소
  | 'PARTIAL_CANCELED'   // 부분 취소
  | 'ABORTED'            // 결제 승인 실패
  | 'EXPIRED';           // 결제 만료

/**
 * 결제 수단
 */
export type PaymentMethod =
  | '카드'
  | '가상계좌'
  | '계좌이체'
  | '휴대폰'
  | '문화상품권'
  | '도서문화상품권'
  | '게임문화상품권';

/**
 * 결제 확인 응답
 * Toss Payments API /v1/payments/confirm 응답 구조
 */
export interface PaymentConfirmation {
  /** 결제 키 */
  paymentKey: string;

  /** 주문 ID */
  orderId: string;

  /** 결제 타입 (NORMAL, BILLING, BRANDPAY) */
  type?: string;

  /** 결제 상태 */
  status: PaymentStatus;

  /** 총 결제 금액 */
  totalAmount: number;

  /** 결제 수단 */
  method: string;

  /** 결제 요청 시간 (ISO 8601) */
  requestedAt: string;

  /** 결제 승인 시간 (ISO 8601) */
  approvedAt?: string;

  /** 공급가액 (과세 대상 금액) */
  suppliedAmount?: number;

  /** 부가세 */
  vat?: number;

  /** 카드 정보 (카드 결제 시) */
  card?: {
    amount?: number;
    issuerCode?: string;
    acquirerCode?: string;
    number?: string;
    installmentPlanMonths?: number;
    approveNo?: string;
    useCardPoint?: boolean;
    cardType?: string;
    ownerType?: string;
    acquireStatus?: string;
    isInterestFree?: boolean;
    interestPayer?: string;
  };

  /** 가상계좌 정보 (가상계좌 결제 시) */
  virtualAccount?: {
    accountType?: string;
    accountNumber?: string;
    bankCode?: string;
    customerName?: string;
    dueDate?: string;
    refundStatus?: string;
    expired?: boolean;
    settlementStatus?: string;
  };

  /** 이체 정보 (계좌이체 시) */
  transfer?: {
    bankCode?: string;
    settlementStatus?: string;
  };

  /** 휴대폰 결제 정보 */
  mobilePhone?: {
    customerMobilePhone?: string;
    settlementStatus?: string;
  };

  /** 상품권 결제 정보 */
  giftCertificate?: {
    approveNo?: string;
    settlementStatus?: string;
  };

  /** 취소 내역 */
  cancels?: Array<{
    cancelAmount: number;
    cancelReason: string;
    taxFreeAmount: number;
    taxExemptionAmount: number;
    refundableAmount: number;
    easyPayDiscountAmount: number;
    canceledAt: string;
    transactionKey: string;
    receiptKey?: string;
  }>;

  /** 영수증 URL */
  receipt?: {
    url?: string;
  };

  /** 결제 실패 정보 */
  failure?: {
    code?: string;
    message?: string;
  };

  /** 현금영수증 정보 */
  cashReceipt?: {
    type?: string;
    receiptKey?: string;
    issueNumber?: string;
    receiptUrl?: string;
    amount?: number;
    taxFreeAmount?: number;
  };

  /** 할인 금액 */
  discount?: {
    amount?: number;
  };

  /** 간편결제 정보 */
  easyPay?: {
    provider?: string;
    amount?: number;
    discountAmount?: number;
  };

  /** 국가 코드 */
  country?: string;

  /** 통화 단위 */
  currency?: string;

  /** 결제 창 언어 */
  locale?: string;
}

/**
 * API 응답 래퍼
 * 공통 API 응답 구조
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 결제 검증 요청
 * 백엔드 API로 전달하는 파라미터
 */
export interface PaymentConfirmRequest {
  /** 결제 키 */
  paymentKey: string;

  /** 주문 ID */
  orderId: string;

  /** 결제 금액 */
  amount: number;
}

/**
 * Toss Payments 에러 응답
 * @see https://docs.tosspayments.com/reference/error-codes
 */
export interface TossPaymentsError {
  code: string;
  message: string;
}

/**
 * 결제 위젯 초기화 옵션
 */
export interface PaymentWidgetOptions {
  /** 클라이언트 키 */
  clientKey: string;

  /** 고객 키 */
  customerKey: string;
}

/**
 * 결제 위젯 인스턴스
 */
export interface PaymentWidgetInstance {
  renderPaymentMethods: (
    selector: string,
    options: { value: number; currency: string; country: string }
  ) => Promise<void>;

  renderAgreement: (selector: string) => Promise<void>;

  requestPayment: (params: PaymentRequest) => Promise<void>;
}

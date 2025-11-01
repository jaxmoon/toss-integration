/**
 * Toss Payments 환경 변수 및 상수 설정
 */

/**
 * Toss Payments 클라이언트 설정
 *
 * ⚠️ 주의: 이 파일은 클라이언트 번들에 포함됩니다!
 * - NEXT_PUBLIC_* 환경 변수만 사용하세요
 * - 절대 시크릿 키를 포함하지 마세요
 */
export const TOSS_PAYMENTS_CLIENT_CONFIG = {
  /**
   * 클라이언트 키 (브라우저에서 사용)
   * @env NEXT_PUBLIC_TOSS_CLIENT_KEY
   */
  clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '',

  /**
   * 고객 키 (테스트 환경에서는 ANONYMOUS 사용 가능)
   * 프로덕션에서는 실제 고객 식별자 사용 권장
   */
  customerKey: 'ANONYMOUS',
} as const;

/**
 * 애플리케이션 URL 설정
 */
export const APP_CONFIG = {
  /**
   * 애플리케이션 기본 URL
   * @env NEXT_PUBLIC_BASE_URL
   */
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',

  /**
   * 결제 성공 리다이렉트 URL
   */
  get successUrl() {
    return `${this.baseUrl}/success`;
  },

  /**
   * 결제 실패 리다이렉트 URL
   */
  get failUrl() {
    return `${this.baseUrl}/fail`;
  },
} as const;

/**
 * 샘플 상품 데이터
 * 테스트 및 데모 목적으로 사용
 */
export const SAMPLE_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Toss Payments 위젯 통합 가이드',
    price: 50000,
    quantity: 1,
    imageUrl: '/images/sample-product.jpg',
  },
  {
    id: 'prod-002',
    name: '결제 시스템 구축 컨설팅',
    price: 150000,
    quantity: 1,
    imageUrl: '/images/consulting.jpg',
  },
  {
    id: 'prod-003',
    name: 'PG 연동 기술 지원',
    price: 100000,
    quantity: 1,
    imageUrl: '/images/technical-support.jpg',
  },
] as const;

/**
 * 기본 주문 정보 (샘플)
 *
 * ⚠️ 주의: 실제 결제에서는 사용하지 마세요!
 * - 실제 orderId는 서버에서 생성해야 합니다
 * - amount와 orderName도 서버에서 검증되어야 합니다
 */
export const DEFAULT_ORDER_SAMPLE = {
  orderName: 'Toss Payments 위젯 통합 가이드',
  amount: 50000,
  items: [SAMPLE_PRODUCTS[0]],
} as const;

/**
 * 테스트 고객 정보
 * 개발 환경에서 사용
 */
export const TEST_CUSTOMER = {
  name: '홍길동',
  email: 'test@example.com',
  phone: '01012345678',
} as const;

/**
 * 테스트 카드 정보
 * Toss Payments 테스트 환경에서 사용 가능한 카드 정보
 * @see https://docs.tosspayments.com/reference/test-card
 */
export const TEST_CARDS = {
  /**
   * 일반 승인 테스트 카드
   */
  NORMAL: {
    number: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
    password: '00',
    description: '일반 승인 성공 카드',
  },

  /**
   * 잔액 부족 테스트 카드
   */
  INSUFFICIENT_FUNDS: {
    number: '4000000000000002',
    expiry: '12/25',
    cvc: '123',
    password: '00',
    description: '잔액 부족 카드',
  },

  /**
   * 도난 신고 테스트 카드
   */
  STOLEN_CARD: {
    number: '4000000000000069',
    expiry: '12/25',
    cvc: '123',
    password: '00',
    description: '도난 신고 카드',
  },
} as const;

/**
 * 에러 메시지
 * 사용자에게 표시할 에러 메시지
 */
export const ERROR_MESSAGES = {
  /** 일반 결제 실패 */
  PAYMENT_FAILED: '결제에 실패했습니다. 다시 시도해주세요.',

  /** 금액 검증 실패 */
  INVALID_AMOUNT: '결제 금액이 올바르지 않습니다.',

  /** 주문 정보 검증 실패 */
  INVALID_ORDER: '주문 정보가 올바르지 않습니다.',

  /** SDK 로드 실패 */
  SDK_LOAD_FAILED: 'Toss Payments SDK를 로드하지 못했습니다.',

  /** API 요청 에러 */
  API_ERROR: 'API 요청 중 오류가 발생했습니다.',

  /** 네트워크 에러 */
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',

  /** 결제 검증 실패 */
  VERIFICATION_FAILED: '결제 검증에 실패했습니다.',

  /** 타임아웃 */
  TIMEOUT: '요청 시간이 초과되었습니다.',

  /** 필수 파라미터 누락 */
  MISSING_PARAMETERS: '필수 파라미터가 누락되었습니다.',

  /** 환경 변수 미설정 */
  MISSING_ENV_VARS: '필요한 환경 변수가 설정되지 않았습니다.',
} as const;

/**
 * 성공 메시지
 * 사용자에게 표시할 성공 메시지
 */
export const SUCCESS_MESSAGES = {
  /** 결제 완료 */
  PAYMENT_COMPLETE: '결제가 완료되었습니다.',

  /** 주문 생성 */
  ORDER_CREATED: '주문이 생성되었습니다.',

  /** 결제 취소 */
  PAYMENT_CANCELED: '결제가 취소되었습니다.',

  /** 결제 검증 성공 */
  VERIFICATION_SUCCESS: '결제 검증이 완료되었습니다.',
} as const;

/**
 * 결제 상태 한글 표시
 */
export const PAYMENT_STATUS_LABELS = {
  READY: '결제 준비',
  IN_PROGRESS: '결제 진행 중',
  WAITING_FOR_DEPOSIT: '입금 대기',
  DONE: '결제 완료',
  CANCELED: '결제 취소',
  PARTIAL_CANCELED: '부분 취소',
  ABORTED: '결제 실패',
  EXPIRED: '결제 만료',
} as const;

/**
 * 결제 수단 한글 표시
 */
export const PAYMENT_METHOD_LABELS = {
  카드: '신용/체크카드',
  가상계좌: '가상계좌',
  계좌이체: '계좌이체',
  휴대폰: '휴대폰 결제',
  문화상품권: '문화상품권',
  도서문화상품권: '도서문화상품권',
  게임문화상품권: '게임문화상품권',
} as const;

/**
 * API 타임아웃 설정 (밀리초)
 */
export const API_TIMEOUT = {
  /** 일반 API 요청 타임아웃 */
  DEFAULT: 10000, // 10초

  /** 결제 확인 API 타임아웃 */
  PAYMENT_CONFIRM: 15000, // 15초

  /** SDK 로드 타임아웃 */
  SDK_LOAD: 5000, // 5초
} as const;

/**
 * 통화 단위
 */
export const CURRENCY = {
  KRW: 'KRW', // 한국 원화
  USD: 'USD', // 미국 달러
} as const;

/**
 * 국가 코드
 */
export const COUNTRY = {
  KR: 'KR', // 대한민국
  US: 'US', // 미국
} as const;

/**
 * 결제 위젯 렌더링 옵션
 */
export const WIDGET_OPTIONS = {
  /** 기본 통화 */
  currency: CURRENCY.KRW,

  /** 기본 국가 */
  country: COUNTRY.KR,

  /** 로케일 */
  locale: 'ko_KR',
} as const;

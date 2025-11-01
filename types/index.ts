/**
 * 타입 정의 중앙 내보내기
 * 프로젝트 전반에서 타입을 쉽게 import할 수 있도록 중앙에서 관리
 *
 * @example
 * ```typescript
 * import type { Order, PaymentRequest, PaymentConfirmation } from '@/types';
 * ```
 */

export type {
  OrderItem,
  Order,
  Customer,
  PaymentRequest,
  PaymentStatus,
  PaymentMethod,
  PaymentConfirmation,
  ApiResponse,
  PaymentConfirmRequest,
  TossPaymentsError,
  PaymentWidgetOptions,
  PaymentWidgetInstance,
} from './payment';

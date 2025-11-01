/**
 * LoadingSpinner Component
 *
 * 결제 처리 중 사용자에게 로딩 상태를 시각적으로 표시하는 컴포넌트입니다.
 * 접근성을 고려하여 ARIA 속성을 포함하며, 스크린 리더에서 적절히 동작합니다.
 *
 * @example
 * ```tsx
 * <LoadingSpinner message="결제 처리 중..." size="lg" />
 * ```
 */
export interface LoadingSpinnerProps {
  /** 로딩 메시지 */
  message?: string
  /** 스피너 크기 */
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-3',
  lg: 'w-16 h-16 border-4',
} as const

/**
 * LoadingSpinner 컴포넌트
 *
 * 애니메이션이 적용된 스피너와 메시지를 표시합니다.
 * CSS 애니메이션을 사용하여 부드러운 회전 효과를 제공합니다.
 */
export function LoadingSpinner({
  message = '로딩 중...',
  size = 'md',
}: LoadingSpinnerProps) {
  const spinnerClasses = `${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center justify-center gap-4 p-8"
    >
      <div
        className={spinnerClasses}
        aria-hidden="true"
      />
      <p className="text-sm text-gray-600 font-medium">
        {message}
      </p>
    </div>
  )
}

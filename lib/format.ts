/**
 * 숫자를 한국 원화 형식으로 포맷팅
 * @example formatCurrency(10000) → "10,000원"
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

/**
 * 숫자를 천단위 콤마로 포맷팅
 * @example formatNumber(10000) → "10,000"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR')
}

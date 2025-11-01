export interface TermsAgreementState {
  personalInfo: boolean      // 개인정보 수집 (필수)
  paymentService: boolean     // 결제대행 서비스 (필수)
  marketing: boolean          // 마케팅 정보 수신 (선택)
  allAgreed: boolean          // 전체 동의
  canProceed: boolean         // 결제 진행 가능 여부
}

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { TermsAgreementState } from '@/types/terms'

export interface TermsAgreementProps {
  onAgreementChange: (state: TermsAgreementState) => void
}

export function TermsAgreement({ onAgreementChange }: TermsAgreementProps) {
  const [agreement, setAgreement] = useState({
    personalInfo: false,
    paymentService: false,
    marketing: false,
  })

  // 상태 계산 (메모이제이션으로 최적화)
  const { allAgreed, canProceed } = useMemo(() => {
    const allAgreed = agreement.personalInfo && agreement.paymentService && agreement.marketing
    const canProceed = agreement.personalInfo && agreement.paymentService
    return { allAgreed, canProceed }
  }, [agreement])

  // 부모 컴포넌트에 상태 전달
  useEffect(() => {
    onAgreementChange({
      ...agreement,
      allAgreed,
      canProceed,
    })
  }, [agreement, allAgreed, canProceed, onAgreementChange])

  // 전체 동의 핸들러 (useCallback으로 최적화)
  const handleAllAgree = useCallback(() => {
    const newValue = !allAgreed
    setAgreement({
      personalInfo: newValue,
      paymentService: newValue,
      marketing: newValue,
    })
  }, [allAgreed])

  // 개별 약관 동의 핸들러 (useCallback으로 최적화)
  const handleTermChange = useCallback((term: keyof typeof agreement) => {
    setAgreement((prev) => ({
      ...prev,
      [term]: !prev[term],
    }))
  }, [])

  return (
    <div
      className="bg-gray-50 rounded-lg p-4 space-y-3"
      role="group"
      aria-labelledby="terms-heading"
    >
      <h3 id="terms-heading" className="sr-only">약관 동의</h3>

      {/* 전체 동의 */}
      <label className="flex items-center gap-3 p-3 bg-white rounded border-2 border-gray-200 cursor-pointer hover:border-blue-300 transition-colors">
        <input
          type="checkbox"
          checked={allAgreed}
          onChange={handleAllAgree}
          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="전체 동의"
        />
        <span className="font-bold text-gray-900">전체 동의</span>
      </label>

      <div className="space-y-2 pl-2" role="group" aria-label="개별 약관">
        {/* 필수 - 개인정보 */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={agreement.personalInfo}
            onChange={() => handleTermChange('personalInfo')}
            className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="개인정보 수집 및 이용 동의 (필수)"
            aria-required="true"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
            [필수] 개인정보 수집 및 이용 동의
          </span>
        </label>

        {/* 필수 - 결제대행 */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={agreement.paymentService}
            onChange={() => handleTermChange('paymentService')}
            className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="결제대행 서비스 이용약관 동의 (필수)"
            aria-required="true"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
            [필수] 결제대행 서비스 이용약관 동의
          </span>
        </label>

        {/* 선택 - 마케팅 */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={agreement.marketing}
            onChange={() => handleTermChange('marketing')}
            className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="마케팅 정보 수신 동의 (선택)"
            aria-required="false"
          />
          <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
            [선택] 마케팅 정보 수신 동의
          </span>
        </label>
      </div>

      {!canProceed && (
        <p className="text-xs text-red-600 mt-2" role="alert" aria-live="polite">
          * 필수 약관에 모두 동의해주세요
        </p>
      )}
    </div>
  )
}

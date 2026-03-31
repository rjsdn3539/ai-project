import * as PortOne from '@portone/browser-sdk/v2'

// 포트원 콘솔 → 상점 정보에서 확인
const STORE_ID = 'store-24963220-ba6b-40a2-b75d-58c38c391431'

export const PAYMENT_METHODS = [
  { key: 'KAKAOPAY',     label: '카카오페이',   icon: '💛', channelKey: 'channel-key-4575acaf-b9b8-457c-8e18-cf3aba429b7b', payMethod: 'EASY_PAY' },
  { key: 'TOSS',         label: '토스페이',     icon: '💙', channelKey: 'channel-key-adc611f5-8d1b-4e81-95dc-f7ff61ed8447', payMethod: 'EASY_PAY' },
  { key: 'TOSSPAYMENTS', label: '토스페이먼츠', icon: '💳', channelKey: 'channel-key-f0201852-4876-4d63-84c3-ce4f47bd287a', payMethod: 'CARD' },
]

/**
 * @param {object} options
 * @param {string} options.orderName - 주문명
 * @param {number} options.totalAmount - 결제금액 (원)
 * @param {string} options.channelKey - 결제 채널 키
 * @param {string} options.payMethod - 결제 수단
 * @param {string} [options.customerName] - 구매자명
 * @param {string} [options.customerEmail] - 구매자 이메일
 * @returns {Promise<{success: boolean, paymentId?: string, error?: string}>}
 */
export async function requestPayment({ orderName, totalAmount, channelKey, payMethod, customerName, customerEmail }) {
  const paymentId = `payment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const params = {
    storeId: STORE_ID,
    channelKey,
    paymentId,
    orderName,
    totalAmount,
    currency: 'CURRENCY_KRW',
    payMethod,
    customer: {
      ...(customerName && { fullName: customerName }),
      ...(customerEmail && { email: customerEmail }),
    },
  }

  // 간편결제는 easyPayProvider 추가
  if (payMethod === 'EASY_PAY' && channelKey === PAYMENT_METHODS[0].channelKey) {
    params.easyPay = { easyPayProvider: 'EASY_PAY_PROVIDER_KAKAOPAY' }
  } else if (payMethod === 'EASY_PAY' && channelKey === PAYMENT_METHODS[1].channelKey) {
    params.easyPay = { easyPayProvider: 'EASY_PAY_PROVIDER_TOSSPAY' }
  }

  const response = await PortOne.requestPayment(params)

  if (response.code) {
    return { success: false, error: response.message || '결제가 취소되었습니다.' }
  }

  return { success: true, paymentId: response.paymentId }
}

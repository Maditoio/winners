import crypto from 'crypto'

const DEFAULT_BASE_URL = 'https://api.nowpayments.io/v1'

export type NowPaymentsCreatePaymentResponse = {
  payment_id: number
  pay_address?: string
  pay_amount?: number
  pay_currency?: string
  price_amount?: number
  price_currency?: string
  order_id?: string
}

export function verifyNowPaymentsSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha512', secret.trim())
  hmac.update(rawBody)
  const digest = hmac.digest('hex')

  const digestBuffer = Buffer.from(digest, 'utf8')
  const signatureBuffer = Buffer.from(signature.trim(), 'utf8')

  if (digestBuffer.length !== signatureBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer)
}

export async function createNowPaymentsPayment(params: {
  amount: number
  orderId: string
  ipnCallbackUrl: string
  description: string
  payCurrency: string
  priceCurrency: string
}): Promise<NowPaymentsCreatePaymentResponse> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY
  if (!apiKey) {
    console.error('[NOWPAYMENTS] API key not configured')
    throw new Error('NOWPAYMENTS_API_KEY is not set')
  }

  const baseUrl = process.env.NOWPAYMENTS_API_BASE_URL || DEFAULT_BASE_URL
  console.log('[NOWPAYMENTS] Using API base URL:', baseUrl)

  const payload = {
    price_amount: params.amount,
    price_currency: params.priceCurrency,
    pay_currency: params.payCurrency,
    order_id: params.orderId,
    order_description: params.description,
    ipn_callback_url: params.ipnCallbackUrl
  }
  console.log('[NOWPAYMENTS] Sending payment request:', {
    ...payload,
    ipn_callback_url: '***redacted***'
  })

  const response = await fetch(`${baseUrl}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(payload)
  })

  console.log('[NOWPAYMENTS] Response status:', response.status)

  if (!response.ok) {
    const errorBody = await response.text()
    const errorLog = `NOWPayments create payment failed with status ${response.status}: ${errorBody}`
    console.error('[NOWPAYMENTS]', errorLog)
    throw new Error(errorLog)
  }

  const data = await response.json()
  console.log('[NOWPAYMENTS] Payment created successfully:', {
    payment_id: data.payment_id,
    pay_address: data.pay_address ? '***redacted***' : 'missing',
    pay_currency: data.pay_currency
  })
  return data
}

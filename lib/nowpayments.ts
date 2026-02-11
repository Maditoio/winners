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
  payload: Record<string, unknown>,
  signature: string,
  secret: string
): boolean {
  const sortedPayload = JSON.stringify(payload, Object.keys(payload).sort())
  const hmac = crypto.createHmac('sha512', secret.trim())
  hmac.update(sortedPayload)
  const digest = hmac.digest('hex')

  const digestBuffer = Buffer.from(digest, 'utf8')
  const signatureBuffer = Buffer.from(signature, 'utf8')

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
    throw new Error('NOWPAYMENTS_API_KEY is not set')
  }

  const baseUrl = process.env.NOWPAYMENTS_API_BASE_URL || DEFAULT_BASE_URL

  const payload = {
    price_amount: params.amount,
    price_currency: params.priceCurrency,
    pay_currency: params.payCurrency,
    order_id: params.orderId,
    order_description: params.description,
    ipn_callback_url: params.ipnCallbackUrl
  }

  const response = await fetch(`${baseUrl}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`NOWPayments create payment failed: ${errorBody}`)
  }

  return response.json()
}

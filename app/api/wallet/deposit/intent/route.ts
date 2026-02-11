import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { nanoid } from 'nanoid'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNowPaymentsPayment } from '@/lib/nowpayments'

const MINIMUM_DEPOSIT = 3

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { amount } = await req.json()
    const depositAmount = Number(amount)

    if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (depositAmount < MINIMUM_DEPOSIT) {
      return NextResponse.json(
        { error: `Minimum deposit is ${MINIMUM_DEPOSIT} USDT` },
        { status: 400 }
      )
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    const callbackBaseUrl = process.env.NOWPAYMENTS_IPN_CALLBACK_URL
      || process.env.NEXT_PUBLIC_APP_URL

    if (!callbackBaseUrl) {
      return NextResponse.json(
        { error: 'Webhook callback URL is not configured' },
        { status: 500 }
      )
    }

    const payCurrency = (process.env.NOWPAYMENTS_PAY_CURRENCY || 'usdtpolygon').toLowerCase()
    const priceCurrency = (process.env.NOWPAYMENTS_PRICE_CURRENCY || 'usdt').toLowerCase()
    const orderId = `${session.user.id}:${nanoid(10)}`

    const payment = await createNowPaymentsPayment({
      amount: depositAmount,
      orderId,
      ipnCallbackUrl: `${callbackBaseUrl}/api/wallet/deposit`,
      description: `Wallet deposit for ${session.user.email || session.user.id}`,
      payCurrency,
      priceCurrency
    })

    if (!payment.payment_id || !payment.pay_address) {
      return NextResponse.json(
        { error: 'NOWPayments did not return a payment address' },
        { status: 502 }
      )
    }

    const paymentId = String(payment.payment_id)
    const payAmount = Number(payment.pay_amount ?? payment.price_amount ?? depositAmount)

    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'DEPOSIT',
          amount: payAmount,
          status: 'PENDING',
          txHash: paymentId,
          toAddress: payment.pay_address,
          description: `NOWPayments deposit (${orderId})`
        }
      })

      await tx.wallet.update({
        where: { userId: session.user.id },
        data: { cryptoAddress: payment.pay_address }
      })
    })

    return NextResponse.json({
      paymentId,
      payAddress: payment.pay_address,
      payAmount: payAmount.toString(),
      payCurrency: payment.pay_currency || payCurrency
    })
  } catch (error) {
    console.error('Create deposit intent error:', error)
    return NextResponse.json(
      { error: 'Failed to create deposit address' },
      { status: 500 }
    )
  }
}

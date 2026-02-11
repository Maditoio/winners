import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { nanoid } from 'nanoid'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNowPaymentsPayment } from '@/lib/nowpayments'

const MINIMUM_DEPOSIT = 3

export async function POST(req: Request) {
  console.log('[DEPOSIT INTENT] ========== NEW REQUEST ==========')
  try {
    console.log('[DEPOSIT INTENT] Starting deposit request')
    const session = await getServerSession(authOptions)
    console.log('[DEPOSIT INTENT] Session:', session?.user?.id ? 'authenticated' : 'not authenticated')

    if (!session?.user) {
      console.warn('[DEPOSIT INTENT] No session found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { amount } = await req.json()
    const depositAmount = Number(amount)
    console.log('[DEPOSIT INTENT] Request amount:', depositAmount)

    if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
      console.warn('[DEPOSIT INTENT] Invalid amount:', depositAmount)
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (depositAmount < MINIMUM_DEPOSIT) {
      console.warn('[DEPOSIT INTENT] Amount below minimum:', depositAmount, '<', MINIMUM_DEPOSIT)
      return NextResponse.json(
        { error: `Minimum deposit is ${MINIMUM_DEPOSIT} USDT` },
        { status: 400 }
      )
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id }
    })
    console.log('[DEPOSIT INTENT] Wallet found:', !!wallet)

    if (!wallet) {
      console.error('[DEPOSIT INTENT] Wallet not found for user:', session.user.id)
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Use fixed Vercel URL for webhook callback (doesn't change with deployments)
    const ipnCallbackUrl = 'https://winners-zeta.vercel.app/api/wallet/deposit'
    console.log('[DEPOSIT INTENT] IPN Callback URL:', ipnCallbackUrl)

    const payCurrency = (process.env.NOWPAYMENTS_PAY_CURRENCY || 'usdtp').toLowerCase()
    const priceCurrency = (process.env.NOWPAYMENTS_PRICE_CURRENCY || 'usd').toLowerCase()
    const orderId = `${session.user.id}:${nanoid(10)}`
    console.log('[DEPOSIT INTENT] Creating payment:', { orderId, amount: depositAmount, payCurrency, priceCurrency })

    const payment = await createNowPaymentsPayment({
      amount: depositAmount,
      orderId,
      ipnCallbackUrl,
      description: `Wallet deposit for ${session.user.email || session.user.id}`,
      payCurrency,
      priceCurrency
    })
    console.log('[DEPOSIT INTENT] Payment created:', { paymentId: payment.payment_id, payAddress: payment.pay_address })

    if (!payment.payment_id || !payment.pay_address) {
      console.error('[DEPOSIT INTENT] Payment missing required fields:', { paymentId: payment.payment_id, payAddress: payment.pay_address })
      return NextResponse.json(
        { error: 'NOWPayments did not return a payment address' },
        { status: 502 }
      )
    }

    const paymentId = String(payment.payment_id)
    const payAmount = Number(payment.pay_amount ?? payment.price_amount ?? depositAmount)
    console.log('[DEPOSIT INTENT] Payment amount resolved:', payAmount)

    await prisma.$transaction(async (tx) => {
      console.log('[DEPOSIT INTENT] Creating transaction record...')
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

      console.log('[DEPOSIT INTENT] Updating wallet with pay address...')
      await tx.wallet.update({
        where: { userId: session.user.id },
        data: { cryptoAddress: payment.pay_address }
      })
      console.log('[DEPOSIT INTENT] Wallet updated successfully')
    })

    console.log('[DEPOSIT INTENT] Deposit intent created successfully')
    return NextResponse.json({
      paymentId,
      payAddress: payment.pay_address,
      payAmount: payAmount.toString(),
      payCurrency: payment.pay_currency || payCurrency
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : ''
    
    console.error('[DEPOSIT INTENT] ERROR - Create deposit intent failed')
    console.error('[DEPOSIT INTENT] Error message:', errorMessage)
    console.error('[DEPOSIT INTENT] Error stack:', errorStack)
    console.error('[DEPOSIT INTENT] Full error:', error)
    
    return NextResponse.json(
      { error: 'Failed to create deposit address', details: errorMessage },
      { status: 500 }
    )
  }
}

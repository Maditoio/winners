import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyNowPaymentsSignature } from '@/lib/nowpayments'

const MINIMUM_DEPOSIT = 10
const COMPLETED_STATUSES = new Set(['confirmed', 'finished'])
const PARTIAL_STATUSES = new Set(['partially_paid'])
const FAILED_STATUSES = new Set(['failed', 'refunded', 'expired'])

const normalizeStatus = (status?: string) =>
  status?.toLowerCase().trim() || ''

const parseAmount = (value: unknown) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : null
}

// Webhook endpoint for crypto deposits
export async function POST(req: Request) {
  try {
    console.log('[DEPOSIT WEBHOOK] Received IPN webhook')
    
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET
    if (!ipnSecret) {
      console.error('[DEPOSIT WEBHOOK] IPN secret not configured')
      return NextResponse.json(
        { error: 'IPN secret is not configured' },
        { status: 500 }
      )
    }

    const signature = req.headers.get('x-nowpayments-sig')
      || req.headers.get('x-nowpayments-signature')

    if (!signature) {
      console.warn('[DEPOSIT WEBHOOK] Missing signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    const rawBody = await req.text()
    let payload: Record<string, unknown>

    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error('[DEPOSIT WEBHOOK] Failed to parse JSON body')
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }
    console.log('[DEPOSIT WEBHOOK] Payload parsed, order_id:', payload.order_id)

    const isValidSignature = verifyNowPaymentsSignature(
      rawBody,
      signature,
      ipnSecret
    )
    console.log('[DEPOSIT WEBHOOK] Signature valid:', isValidSignature)

    if (!isValidSignature) {
      console.warn('[DEPOSIT WEBHOOK] Signature verification failed')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const paymentId = payload.payment_id ? String(payload.payment_id) : ''
    const paymentStatus = normalizeStatus(String(payload.payment_status || ''))
    const payAddress = payload.pay_address ? String(payload.pay_address) : ''
    const payCurrency = payload.pay_currency
      ? String(payload.pay_currency).toLowerCase()
      : ''
    console.log('[DEPOSIT WEBHOOK] Extracted values:', { paymentId, paymentStatus, payCurrency })

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Missing payment_id' },
        { status: 400 }
      )
    }

    const expectedCurrency = (process.env.NOWPAYMENTS_PAY_CURRENCY || 'usdtmatic').toLowerCase()
    if (payCurrency && payCurrency !== expectedCurrency) {
      return NextResponse.json(
        { error: 'Unsupported payment currency' },
        { status: 400 }
      )
    }

    const amountFromPayload = parseAmount(payload.outcome_amount)
      ?? parseAmount(payload.actually_paid)
      ?? parseAmount(payload.pay_amount)
      ?? parseAmount(payload.price_amount)

    if (!amountFromPayload || amountFromPayload <= 0) {
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    let wallet = null
    let transaction = await prisma.transaction.findUnique({
      where: { txHash: paymentId }
    })

    if (transaction) {
      wallet = await prisma.wallet.findUnique({
        where: { userId: transaction.userId }
      })
    }

    if (!wallet && payload.order_id) {
      const orderId = String(payload.order_id)
      const userId = orderId.split(':')[0]
      wallet = await prisma.wallet.findUnique({
        where: { userId }
      })
    }

    if (!wallet && payAddress) {
      wallet = await prisma.wallet.findUnique({
        where: { cryptoAddress: payAddress }
      })
    }

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: wallet.userId },
      select: { referredBy: true, email: true }
    })

    const isCompleted = COMPLETED_STATUSES.has(paymentStatus)
    const isPartial = PARTIAL_STATUSES.has(paymentStatus)
    const isFailed = FAILED_STATUSES.has(paymentStatus)
    const isBelowMinimum = amountFromPayload < MINIMUM_DEPOSIT
    const isPayable = isCompleted || isPartial

    const result = await prisma.$transaction(async (tx) => {
      const existingTx = await tx.transaction.findUnique({
        where: { txHash: paymentId }
      })

      if (existingTx?.status === 'COMPLETED') {
        return existingTx
      }

      const priorConfirmedDeposits = await tx.transaction.count({
        where: {
          userId: wallet.userId,
          type: 'DEPOSIT',
          status: 'COMPLETED'
        }
      })

      if (existingTx) {
        if (isPayable) {
          const previousAmount = Number(existingTx.amount)
          const creditDelta = amountFromPayload - (Number.isFinite(previousAmount) ? previousAmount : 0)
          const updatedTx = await tx.transaction.update({
            where: { id: existingTx.id },
            data: {
              status: isCompleted ? (isBelowMinimum ? 'FAILED' : 'COMPLETED') : 'PENDING',
              amount: amountFromPayload,
              toAddress: payAddress || existingTx.toAddress
            }
          })

          if (!isBelowMinimum && creditDelta > 0) {
            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: {
                  increment: creditDelta
                }
              }
            })
          }

          if (isCompleted && !isBelowMinimum && user?.referredBy && priorConfirmedDeposits === 0) {
            const alreadyCredited = await tx.transaction.findFirst({
              where: {
                userId: user.referredBy,
                type: 'REFERRAL_BONUS',
                description: `Referral bonus for user ${wallet.userId}`
              }
            })

            if (!alreadyCredited) {
              const referralSetting = await tx.appSetting.findUnique({
                where: { key: 'referralBonus' }
              })
              const referralBonus = referralSetting
                ? parseFloat(referralSetting.value)
                : 0.25

              await tx.wallet.update({
                where: { userId: user.referredBy },
                data: {
                  balance: {
                    increment: referralBonus
                  }
                }
              })

              await tx.transaction.create({
                data: {
                  userId: user.referredBy,
                  type: 'REFERRAL_BONUS',
                  amount: referralBonus,
                  status: 'COMPLETED',
                  description: `Referral bonus for user ${wallet.userId}`
                }
              })
            }
          }

          return updatedTx
        }

        if (isFailed) {
          return tx.transaction.update({
            where: { id: existingTx.id },
            data: { status: 'FAILED' }
          })
        }

        return existingTx
      }

      const newTx = await tx.transaction.create({
        data: {
          userId: wallet.userId,
          type: 'DEPOSIT',
          amount: amountFromPayload,
          status: isCompleted ? (isBelowMinimum ? 'FAILED' : 'COMPLETED') : 'PENDING',
          txHash: paymentId,
          toAddress: payAddress || undefined,
          description: 'Deposit'
        }
      })

      if (isPayable && !isBelowMinimum) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: amountFromPayload
            }
          }
        })

        if (isCompleted && user?.referredBy && priorConfirmedDeposits === 0) {
          const alreadyCredited = await tx.transaction.findFirst({
            where: {
              userId: user.referredBy,
              type: 'REFERRAL_BONUS',
              description: `Referral bonus for user ${wallet.userId}`
            }
          })

          if (!alreadyCredited) {
            const referralSetting = await tx.appSetting.findUnique({
              where: { key: 'referralBonus' }
            })
            const referralBonus = referralSetting
              ? parseFloat(referralSetting.value)
              : 0.25

            await tx.wallet.update({
              where: { userId: user.referredBy },
              data: {
                balance: {
                  increment: referralBonus
                }
              }
            })

            await tx.transaction.create({
              data: {
                userId: user.referredBy,
                type: 'REFERRAL_BONUS',
                amount: referralBonus,
                status: 'COMPLETED',
                description: `Referral bonus for user ${wallet.userId}`
              }
            })
          }
        }
      }

      if (isFailed && !isCompleted) {
        await tx.transaction.update({
          where: { id: newTx.id },
          data: { status: 'FAILED' }
        })
      }

      return newTx
    })

    if (isCompleted && isBelowMinimum) {
      return NextResponse.json(
        { message: 'Deposit below minimum, no credit applied' },
        { status: 200 }
      )
    }

    return NextResponse.json({
      message: 'Deposit processed successfully',
      transaction: result
    })
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json(
      { error: 'Failed to process deposit' },
      { status: 500 }
    )
  }
}

// Get deposit address
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    return NextResponse.json({
      cryptoAddress: wallet.cryptoAddress,
      balance: wallet.balance.toString()
    })
  } catch (error) {
    console.error('Deposit info error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deposit info' },
      { status: 500 }
    )
  }
}

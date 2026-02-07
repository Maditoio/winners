import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Webhook endpoint for crypto deposits
export async function POST(req: Request) {
  try {
    const { txHash, toAddress, amount, status } = await req.json()

    if (!txHash || !toAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate minimum deposit
    const MINIMUM_DEPOSIT = 3
    const depositAmount = parseFloat(amount)
    if (depositAmount < MINIMUM_DEPOSIT) {
      return NextResponse.json(
        { error: `Minimum deposit is ${MINIMUM_DEPOSIT} USDT` },
        { status: 400 }
      )
    }

    // Find wallet by crypto address
    const wallet = await prisma.wallet.findUnique({
      where: { cryptoAddress: toAddress }
    })

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

    const priorConfirmedDeposits = await prisma.transaction.count({
      where: {
        userId: wallet.userId,
        type: 'DEPOSIT',
        status: 'COMPLETED'
      }
    })

    // Check if transaction already processed
    const existingTx = await prisma.transaction.findUnique({
      where: { txHash }
    })

    if (existingTx) {
      if (status === 'confirmed' && existingTx.status !== 'COMPLETED') {
        await prisma.transaction.update({
          where: { id: existingTx.id },
          data: { status: 'COMPLETED' }
        })

        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: parseFloat(amount)
            }
          }
        })

        if (user?.referredBy && priorConfirmedDeposits === 0) {
          const alreadyCredited = await prisma.transaction.findFirst({
            where: {
              userId: user.referredBy,
              type: 'REFERRAL_BONUS',
              description: `Referral bonus for user ${wallet.userId}`
            }
          })

          if (!alreadyCredited) {
            const referralSetting = await prisma.appSetting.findUnique({
              where: { key: 'referralBonus' }
            })
            const referralBonus = referralSetting
              ? parseFloat(referralSetting.value)
              : 0.25

            await prisma.wallet.update({
              where: { userId: user.referredBy },
              data: {
                balance: {
                  increment: referralBonus
                }
              }
            })

            await prisma.transaction.create({
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

      return NextResponse.json(
        { message: 'Transaction already processed' },
        { status: 200 }
      )
    }

    const isConfirmed = status === 'confirmed'

    const transaction = await prisma.$transaction(async (tx) => {
      const depositTx = await tx.transaction.create({
        data: {
          userId: wallet.userId,
          type: 'DEPOSIT',
          amount: depositAmount,
          status: isConfirmed ? 'COMPLETED' : 'PENDING',
          txHash,
          toAddress,
          description: 'Crypto deposit'
        }
      })

      if (isConfirmed) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: depositAmount
            }
          }
        })

        if (user?.referredBy && priorConfirmedDeposits === 0) {
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

      return depositTx
    })

    return NextResponse.json({
      message: 'Deposit processed successfully',
      transaction
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

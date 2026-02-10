import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET - Fetch user's withdrawal requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { requestedAt: 'desc' }
    })

    const formattedWithdrawals = withdrawals.map(w => ({
      id: w.id,
      amount: w.amount.toString(),
      fee: w.fee.toString(),
      netAmount: w.netAmount.toString(),
      cryptoAddress: w.cryptoAddress,
      status: w.status,
      requestedAt: w.requestedAt.toISOString(),
      reviewedAt: w.reviewedAt?.toISOString(),
      adminNotes: w.adminNotes
    }))

    return NextResponse.json(formattedWithdrawals)
  } catch (error) {
    console.error('Withdrawal fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    )
  }
}

// POST - Create withdrawal request
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if it's a weekday (Monday to Friday)
    const day = new Date().getDay()
    if (day === 0 || day === 6) {
      return NextResponse.json(
        { error: 'Withdrawals are only allowed Monday to Friday' },
        { status: 400 }
      )
    }

    const { amount, cryptoAddress } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      )
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is 10 USDT' },
        { status: 400 }
      )
    }

    if (!cryptoAddress || cryptoAddress.length < 10) {
      return NextResponse.json(
        { error: 'Invalid crypto address' },
        { status: 400 }
      )
    }

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    const balance = parseFloat(wallet.balance.toString())
    
    if (balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Calculate fee and net amount
    const fee = amount * 0.18 // 18% fee
    const netAmount = amount - fee

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Deduct amount from wallet
      await tx.wallet.update({
        where: { userId: session.user.id },
        data: {
          balance: {
            decrement: new Prisma.Decimal(amount)
          }
        }
      })

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'WITHDRAWAL',
          amount: new Prisma.Decimal(amount),
          status: 'PENDING',
          toAddress: cryptoAddress,
          description: `Withdrawal request - ${netAmount.toFixed(2)} USDT after ${fee.toFixed(2)} USDT fee`
        }
      })

      // Create withdrawal request
      const withdrawalRequest = await tx.withdrawalRequest.create({
        data: {
          userId: session.user.id,
          amount: new Prisma.Decimal(amount),
          fee: new Prisma.Decimal(fee),
          netAmount: new Prisma.Decimal(netAmount),
          cryptoAddress,
          status: 'PENDING',
          transactionId: transaction.id
        }
      })

      return { withdrawalRequest, transaction }
    })

    return NextResponse.json({
      success: true,
      withdrawalRequest: {
        id: result.withdrawalRequest.id,
        amount: result.withdrawalRequest.amount.toString(),
        fee: result.withdrawalRequest.fee.toString(),
        netAmount: result.withdrawalRequest.netAmount.toString(),
        status: result.withdrawalRequest.status
      }
    })
  } catch (error) {
    console.error('Withdrawal request error:', error)
    return NextResponse.json(
      { error: 'Failed to process withdrawal request' },
      { status: 500 }
    )
  }
}

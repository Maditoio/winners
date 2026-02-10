import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { withdrawalId, status, adminNotes } = await req.json()

    if (!withdrawalId || !status) {
      return NextResponse.json(
        { error: 'Withdrawal ID and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['PENDING', 'UNDER_REVIEW', 'COMPLETED', 'REJECTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get the withdrawal request
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: {
        user: true,
        transaction: true
      }
    })

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      )
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update withdrawal request
      const updatedWithdrawal = await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
          adminNotes: adminNotes || withdrawal.adminNotes
        }
      })

      // Update transaction status accordingly
      if (withdrawal.transactionId) {
        let transactionStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
        
        if (status === 'COMPLETED') {
          transactionStatus = 'COMPLETED'
        } else if (status === 'REJECTED') {
          transactionStatus = 'CANCELLED'
          
          // Refund the amount if rejected
          await tx.wallet.update({
            where: { userId: withdrawal.userId },
            data: {
              balance: {
                increment: new Prisma.Decimal(withdrawal.amount.toString())
              }
            }
          })

          // Create refund transaction
          await tx.transaction.create({
            data: {
              userId: withdrawal.userId,
              type: 'DEPOSIT',
              amount: new Prisma.Decimal(withdrawal.amount.toString()),
              status: 'COMPLETED',
              description: `Refund for rejected withdrawal request #${withdrawalId.slice(0, 8)}`
            }
          })
        } else {
          transactionStatus = 'PENDING'
        }

        await tx.transaction.update({
          where: { id: withdrawal.transactionId },
          data: { status: transactionStatus }
        })
      }

      return updatedWithdrawal
    })

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: result.id,
        status: result.status,
        reviewedAt: result.reviewedAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Withdrawal update error:', error)
    return NextResponse.json(
      { error: 'Failed to update withdrawal status' },
      { status: 500 }
    )
  }
}

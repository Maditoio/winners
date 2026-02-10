import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
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
      adminNotes: w.adminNotes,
      user: {
        id: w.user.id,
        email: w.user.email,
        name: w.user.name
      }
    }))

    return NextResponse.json(formattedWithdrawals)
  } catch (error) {
    console.error('Admin withdrawals fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    )
  }
}

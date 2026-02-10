import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { withdrawalAddress } = await req.json()

    if (!withdrawalAddress || withdrawalAddress.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a valid withdrawal address' },
        { status: 400 }
      )
    }

    // Check if withdrawal address is already set
    const existingWallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: { withdrawalAddress: true }
    })

    if (existingWallet?.withdrawalAddress) {
      return NextResponse.json(
        { error: 'Withdrawal address is already set and cannot be changed for security reasons' },
        { status: 403 }
      )
    }

    // Set withdrawal address (only if not already set)
    const wallet = await prisma.wallet.update({
      where: { userId: session.user.id },
      data: { withdrawalAddress: withdrawalAddress.trim() }
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal address set successfully',
      wallet: {
        withdrawalAddress: wallet.withdrawalAddress
      }
    })
  } catch (error) {
    console.error('Update withdrawal address error:', error)
    return NextResponse.json(
      { error: 'Failed to update withdrawal address' },
      { status: 500 }
    )
  }
}

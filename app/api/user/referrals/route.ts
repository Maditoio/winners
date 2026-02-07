import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        referralCode: true,
        _count: {
          select: { referrals: true }
        },
        referrals: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate total bonus earned
    const bonusTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: 'REFERRAL_BONUS'
      }
    })

    const totalBonus = bonusTransactions.reduce(
      (sum: number, tx: any) => sum + parseFloat(tx.amount.toString()),
      0
    )

    const referralSetting = await prisma.appSetting.findUnique({
      where: { key: 'referralBonus' }
    })
    const referralBonus = referralSetting ? referralSetting.value : '0.25'

    return NextResponse.json({
      referralCode: user.referralCode,
      referralCount: user._count.referrals,
      totalBonus: totalBonus.toString(),
      referralBonus,
      referrals: user.referrals,
      referralLink: `${process.env.NEXTAUTH_URL}/auth/signup?ref=${user.referralCode}`
    })
  } catch (error) {
    console.error('Referrals error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
      { status: 500 }
    )
  }
}

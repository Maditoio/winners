import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_BONUS = 0.25

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const setting = await prisma.appSetting.findUnique({
      where: { key: 'referralBonus' }
    })

    return NextResponse.json({
      referralBonus: setting ? setting.value : DEFAULT_BONUS.toString()
    })
  } catch (error) {
    console.error('Referral setting error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch setting' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { referralBonus } = await req.json()
    const parsed = parseFloat(referralBonus)

    if (Number.isNaN(parsed) || parsed < 0) {
      return NextResponse.json(
        { error: 'Invalid bonus amount' },
        { status: 400 }
      )
    }

    const setting = await prisma.appSetting.upsert({
      where: { key: 'referralBonus' },
      update: { value: parsed.toString() },
      create: { key: 'referralBonus', value: parsed.toString() }
    })

    return NextResponse.json({
      referralBonus: setting.value
    })
  } catch (error) {
    console.error('Referral setting update error:', error)
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}

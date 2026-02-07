import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ReferralTier {
  referralThreshold: number
  maxTickets: number
}

interface GlobalSettings {
  referralBonus: string
  maxTicketsWithoutReferrals: string
  referralTiers?: ReferralTier[]
}

const DEFAULT_TIERS: ReferralTier[] = [
  { referralThreshold: 10, maxTickets: 25 },
  { referralThreshold: 25, maxTickets: 50 },
  { referralThreshold: 50, maxTickets: 75 },
  { referralThreshold: 75, maxTickets: 150 },
  { referralThreshold: 150, maxTickets: 300 }
]

export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany()
    const result: Record<string, string> = {}
    settings.forEach(s => {
      result[s.key] = s.value
    })
    
    let referralTiers = DEFAULT_TIERS
    if (result['referralTiers']) {
      try {
        referralTiers = JSON.parse(result['referralTiers'])
      } catch {
        referralTiers = DEFAULT_TIERS
      }
    }
    
    return NextResponse.json({
      referralBonus: result['referralBonus'] || '0.25',
      maxTicketsWithoutReferrals: result['maxTicketsWithoutReferrals'] || '10',
      referralTiers
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const referralBonus = body.referralBonus || '0.25'
    const maxTicketsWithoutReferrals = body.maxTicketsWithoutReferrals || '10'
    const referralTiers = body.referralTiers || DEFAULT_TIERS

    // Validate tiers
    if (!Array.isArray(referralTiers) || referralTiers.length === 0) {
      return NextResponse.json({ error: 'Invalid referral tiers' }, { status: 400 })
    }

    for (const tier of referralTiers) {
      if (typeof tier.referralThreshold !== 'number' || typeof tier.maxTickets !== 'number') {
        return NextResponse.json({ error: 'Invalid tier format' }, { status: 400 })
      }
      if (tier.referralThreshold < 0 || tier.maxTickets < 1) {
        return NextResponse.json({ error: 'Invalid tier values' }, { status: 400 })
      }
    }

    // Update settings
    await prisma.appSetting.upsert({
      where: { key: 'referralBonus' },
      update: { value: referralBonus },
      create: { key: 'referralBonus', value: referralBonus }
    })

    await prisma.appSetting.upsert({
      where: { key: 'maxTicketsWithoutReferrals' },
      update: { value: maxTicketsWithoutReferrals.toString() },
      create: { key: 'maxTicketsWithoutReferrals', value: maxTicketsWithoutReferrals.toString() }
    })

    await prisma.appSetting.upsert({
      where: { key: 'referralTiers' },
      update: { value: JSON.stringify(referralTiers) },
      create: { key: 'referralTiers', value: JSON.stringify(referralTiers) }
    })

    return NextResponse.json({
      referralBonus,
      maxTicketsWithoutReferrals,
      referralTiers
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}


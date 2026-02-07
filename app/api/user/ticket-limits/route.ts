import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ReferralTier {
  referralThreshold: number
  maxTickets: number
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const settings = await prisma.appSetting.findMany({
      where: {
        key: {
          in: ['maxTicketsWithoutReferrals', 'referralTiers', 'referralBonus']
        }
      }
    })

    const userReferralCount = await prisma.user.count({
      where: { referredBy: session.user.id }
    })

    // Default values
    let maxTicketsWithoutReferrals = 10
    let referralBonus = '0.25'
    const defaultTiers: ReferralTier[] = [
      { referralThreshold: 10, maxTickets: 25 },
      { referralThreshold: 25, maxTickets: 50 },
      { referralThreshold: 50, maxTickets: 75 },
      { referralThreshold: 75, maxTickets: 150 },
      { referralThreshold: 150, maxTickets: 300 }
    ]
    let tiers = defaultTiers

    // Load settings from database
    settings.forEach(s => {
      if (s.key === 'maxTicketsWithoutReferrals') {
        maxTicketsWithoutReferrals = parseInt(s.value)
      }
      if (s.key === 'referralBonus') {
        referralBonus = s.value
      }
      if (s.key === 'referralTiers') {
        try {
          tiers = JSON.parse(s.value)
        } catch {
          tiers = defaultTiers
        }
      }
    })

    // Calculate max tickets based on referral tier
    let maxTickets = maxTicketsWithoutReferrals
    
    // Sort tiers by referral threshold
    const sortedTiers = [...tiers].sort((a, b) => a.referralThreshold - b.referralThreshold)
    
    // Find the appropriate tier
    for (const tier of sortedTiers) {
      if (userReferralCount >= tier.referralThreshold) {
        maxTickets = tier.maxTickets
      }
    }

    const result = {
      referralBonus,
      maxTicketsWithoutReferrals,
      userReferrals: userReferralCount,
      maxTickets,
      tiers: sortedTiers
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching user limits:', error)
    return NextResponse.json({ error: 'Failed to fetch user limits' }, { status: 500 })
  }
}

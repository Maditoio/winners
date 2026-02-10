import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { quantity = 1 } = await req.json()

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    // Get draw details
    const draw = await prisma.draw.findUnique({
      where: { id },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    })

    if (!draw) {
      return NextResponse.json(
        { error: 'Draw not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    if (now > draw.drawDate) {
      return NextResponse.json(
        { error: 'Draw entry window has closed' },
        { status: 400 }
      )
    }

    if (draw.status === 'DRAWING' || draw.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Draw is not accepting entries at this time' },
        { status: 400 }
      )
    }

    // Check if max entries reached
    if (draw.maxEntries && draw._count.entries + quantity > draw.maxEntries) {
      return NextResponse.json(
        { error: 'Not enough entries available' },
        { status: 400 }
      )
    }

    // Get global settings for ticket limits
    const globalSettings = await prisma.appSetting.findMany({
      where: {
        key: {
          in: ['maxTicketsWithoutReferrals', 'referralTiers']
        }
      }
    })

    const maxTicketsWithoutReferrals = parseInt(
      globalSettings.find((s: any) => s.key === 'maxTicketsWithoutReferrals')?.value || '10'
    )

    const defaultTiers = [
      { referralThreshold: 10, maxTickets: 25 },
      { referralThreshold: 25, maxTickets: 50 },
      { referralThreshold: 50, maxTickets: 75 },
      { referralThreshold: 75, maxTickets: 150 },
      { referralThreshold: 150, maxTickets: 300 }
    ]

    let referralTiers = defaultTiers
    const tiersSettings = globalSettings.find((s: any) => s.key === 'referralTiers')
    if (tiersSettings) {
      try {
        referralTiers = JSON.parse(tiersSettings.value)
      } catch {
        referralTiers = defaultTiers
      }
    }

    // Check user's ticket limit based on referral count
    const userReferralCount = await prisma.user.count({
      where: { referredBy: session.user.id }
    })

    // Calculate max tickets using tier system
    let maxTickets = maxTicketsWithoutReferrals
    const sortedTiers = [...referralTiers].sort((a: any, b: any) => a.referralThreshold - b.referralThreshold)
    
    for (const tier of sortedTiers) {
      if (userReferralCount >= tier.referralThreshold) {
        maxTickets = tier.maxTickets
      }
    }

    // Check if user is within ticket limit
    const userTicketsInDraw = await prisma.entry.count({
      where: {
        userId: session.user.id,
        drawId: draw.id
      }
    })

    if (userTicketsInDraw + quantity > maxTickets) {
      const nextTier = sortedTiers.find((t: any) => t.referralThreshold > userReferralCount)
      const nextTierInfo = nextTier 
        ? `Get ${nextTier.referralThreshold - userReferralCount} more referrals for ${nextTier.maxTickets} tickets`
        : null

      return NextResponse.json(
        {
          error: `You can only purchase up to ${maxTickets} tickets per draw`,
          referralLimit: true,
          userTicketsInDraw,
          maxTickets,
          userReferrals: userReferralCount,
          nextTier: nextTierInfo
        },
        { status: 400 }
      )
    }

    // Get user wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    const totalCost = parseFloat(draw.entryPrice.toString()) * quantity

    if (parseFloat(wallet.balance.toString()) < totalCost) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Create entries and update wallet in transaction
    const entries = await prisma.$transaction(async (tx: any) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: totalCost
          }
        }
      })

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'ENTRY_PURCHASE',
          amount: totalCost,
          status: 'COMPLETED',
          fromAddress: wallet.cryptoAddress,
          toAddress: 'APP_TREASURY',
          description: `Purchased ${quantity} entry(s) for ${draw.title}`
        }
      })

      // Create entries
      const newEntries = []
      for (let i = 0; i < quantity; i++) {
        const entry = await tx.entry.create({
          data: {
            userId: session.user.id,
            drawId: draw.id,
            ticketNumber: nanoid(10)
          }
        })
        newEntries.push(entry)
      }

      // Update draw current entries count
      await tx.draw.update({
        where: { id },
        data: {
          currentEntries: {
            increment: quantity
          }
        }
      })

      return newEntries
    })

    return NextResponse.json({
      message: 'Entries purchased successfully',
      entries: entries.map((e: any) => ({
        id: e.id,
        ticketNumber: e.ticketNumber
      })),
      totalCost: totalCost.toFixed(2)
    })
  } catch (error) {
    console.error('Enter draw error:', error)
    return NextResponse.json(
      { error: 'Failed to enter draw' },
      { status: 500 }
    )
  }
}

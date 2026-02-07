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

    const entries = await prisma.entry.findMany({
      where: { userId: session.user.id },
      include: {
        draw: {
          select: {
            id: true,
            title: true,
            entryPrice: true,
            status: true,
            drawDate: true,
            firstPrizeImage: true
          }
        }
      },
      orderBy: { purchasedAt: 'desc' }
    })

    return NextResponse.json(
      entries.map((entry) => ({
        id: entry.id,
        ticketNumber: entry.ticketNumber,
        purchasedAt: entry.purchasedAt.toISOString(),
        draw: {
          ...entry.draw,
          entryPrice: entry.draw.entryPrice.toString(),
          drawDate: entry.draw.drawDate.toISOString()
        }
      }))
    )
  } catch (error) {
    console.error('Tickets error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

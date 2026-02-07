import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const draws = await prisma.draw.findMany({
      include: {
        prizes: { orderBy: { position: 'asc' } },
        _count: { select: { entries: true, winners: true } }
      },
      orderBy: { drawDate: 'desc' }
    })

    const now = new Date()

    return NextResponse.json(
      draws.map((draw: any) => ({
        id: draw.id,
        title: draw.title,
        status: draw.status,
        startDate: draw.startDate.toISOString(),
        endDate: draw.endDate.toISOString(),
        drawDate: draw.drawDate.toISOString(),
        entryPrice: draw.entryPrice.toString(),
        currentEntries: draw._count.entries,
        winnersCount: draw._count.winners,
        prizeCount: draw.prizes.length,
        isReadyToDraw: now >= draw.drawDate && draw.status !== 'DRAWING' && draw.status !== 'COMPLETED'
      }))
    )
  } catch (error) {
    console.error('Admin draws error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch draws' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const draw = await prisma.draw.findUnique({
      where: { id },
      include: {
        prizes: {
          orderBy: { position: 'asc' }
        },
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

    return NextResponse.json({
      ...draw,
      entryPrice: draw.entryPrice.toString(),
      currentEntries: draw._count.entries,
      isOpen:
        now <= new Date(draw.endDate) &&
        draw.status !== 'COMPLETED' &&
        draw.status !== 'DRAWING',
      prizes: draw.prizes.map((prize: any) => ({
        ...prize,
        prizeAmount: prize.prizeAmount?.toString()
      }))
    })
  } catch (error) {
    console.error('Draw error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch draw' },
      { status: 500 }
    )
  }
}

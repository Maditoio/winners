import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const draw = await prisma.draw.findUnique({
      where: { id }
    })

    if (!draw) {
      return NextResponse.json(
        { error: 'Draw not found' },
        { status: 404 }
      )
    }

    if (draw.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Draw has not been completed yet' },
        { status: 400 }
      )
    }

    // Get all winners for this draw, ordered by position
    const winners = await prisma.winner.findMany({
      where: { drawId: id },
      orderBy: { position: 'asc' },
      include: {
        draw: {
          select: { title: true }
        }
      }
    })

    return NextResponse.json({
      drawId: id,
      drawTitle: draw.title,
      totalParticipants: await prisma.entry.count({
        where: { drawId: id }
      }),
      winners: winners.map((w) => ({
        position: w.position,
        ticketNumber: w.ticketNumber,
        prizeAmount: w.prizeAmount?.toString(),
        createdAt: w.createdAt.toISOString()
      })),
      totalWinners: winners.length,
      drawnAt: draw.updatedAt.toISOString()
    })
  } catch (error) {
    console.error('Get winners error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    )
  }
}

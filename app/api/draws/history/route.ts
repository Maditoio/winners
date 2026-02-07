import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const draws = await prisma.draw.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        winners: {
          include: {
            draw: {
              select: {
                title: true
              }
            }
          },
          orderBy: { position: 'asc' }
        },
        prizes: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { drawDate: 'desc' },
      take: 20
    })

    return NextResponse.json(
      draws.map((draw: any) => ({
        ...draw,
        entryPrice: draw.entryPrice.toString(),
        winners: draw.winners.map((winner: any) => ({
          ...winner,
          prizeAmount: winner.prizeAmount?.toString()
        })),
        prizes: draw.prizes.map((prize: any) => ({
          ...prize,
          prizeAmount: prize.prizeAmount?.toString()
        }))
      }))
    )
  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}

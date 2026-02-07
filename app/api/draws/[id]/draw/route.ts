import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function shuffle<T>(array: T[]) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const draw = await prisma.draw.findUnique({
      where: { id },
      include: {
        prizes: { orderBy: { position: 'asc' } },
        entries: true
      }
    })

    if (!draw) {
      return NextResponse.json(
        { error: 'Draw not found' },
        { status: 404 }
      )
    }

    if (draw.status === 'DRAWING' || draw.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Draw already completed' },
        { status: 400 }
      )
    }

    const now = new Date()
    if (now < draw.drawDate) {
      return NextResponse.json(
        { error: 'Draw date has not been reached yet' },
        { status: 400 }
      )
    }

    if (draw.entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries to draw from' },
        { status: 400 }
      )
    }

    if (draw.prizes.length === 0) {
      return NextResponse.json(
        { error: 'No prizes configured for this draw' },
        { status: 400 }
      )
    }

    const winnerCount = draw.prizes.length
    if (winnerCount > draw.entries.length) {
      return NextResponse.json(
        { error: 'Not enough entries to select winners' },
        { status: 400 }
      )
    }

    // Shuffle entries and select winners using 10% chunks until we have enough winners
    const totalEntries = shuffle(draw.entries)
    const chunkSize = Math.max(1, Math.ceil(totalEntries.length * 0.1))
    const candidatePool: typeof totalEntries = []

    let index = 0
    while (candidatePool.length < winnerCount && index < totalEntries.length) {
      candidatePool.push(...totalEntries.slice(index, index + chunkSize))
      index += chunkSize
    }

    const winnersPool = shuffle(candidatePool).slice(0, winnerCount)

    const result = await prisma.$transaction(async (tx: any) => {
      await tx.draw.update({
        where: { id },
        data: { status: 'DRAWING' }
      })

      const winners = []
      for (let i = 0; i < winnersPool.length; i++) {
        const prize = draw.prizes[i]
        const winnerEntry = winnersPool[i]

        const winner = await tx.winner.create({
          data: {
            drawId: draw.id,
            userId: winnerEntry.userId,
            position: prize.position,
            prizeAmount: prize.prizeAmount,
            ticketNumber: winnerEntry.ticketNumber
          }
        })
        winners.push(winner)
      }

      await tx.draw.update({
        where: { id },
        data: { status: 'COMPLETED' }
      })

      return winners
    })

    return NextResponse.json({
      message: 'Draw completed successfully',
      winners: result
    })
  } catch (error) {
    console.error('Run draw error:', error)
    return NextResponse.json(
      { error: 'Failed to run draw' },
      { status: 500 }
    )
  }
}

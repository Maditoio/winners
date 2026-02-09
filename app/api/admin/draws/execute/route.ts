import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Fisher-Yates shuffle using cryptographically secure random numbers
 * Industry standard for lottery systems
 */
function cryptoShuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    // Generate cryptographically secure random index
    const randomBytes = crypto.randomBytes(4)
    const randomValue = randomBytes.readUInt32BE(0)
    const j = randomValue % (i + 1)
    
    // Swap elements
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { drawId, numberOfWinners = 10 } = body

    // Get the draw
    const draw = await prisma.draw.findUnique({
      where: { id: drawId },
      include: {
        entries: {
          select: {
            id: true,
            userId: true,
            ticketNumber: true
          }
        },
        prizes: {
          orderBy: { position: 'asc' }
        }
      }
    })

    if (!draw) {
      return NextResponse.json(
        { error: 'Draw not found' },
        { status: 404 }
      )
    }

    if (draw.entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries in this draw' },
        { status: 400 }
      )
    }

    // Get the timestamp of draw execution
    const drawTimestamp = new Date()

    // Shuffle entries using cryptographically secure Fisher-Yates algorithm
    const shuffledEntries = cryptoShuffle(draw.entries)

    // Select unique winners (one per user) up to numberOfWinners
    const winners = new Map<string, any>() // userId -> entry
    const selectedEntries: any[] = []

    for (const entry of shuffledEntries) {
      if (winners.size >= numberOfWinners) break
      
      if (!winners.has(entry.userId)) {
        winners.set(entry.userId, entry)
        selectedEntries.push(entry)
      }
    }

    // Create winner records
    const prizePositions = draw.prizes.map((p) => ({
      position: p.position,
      amount: p.prizeAmount
    }))

    const createdWinners = []
    for (let i = 0; i < selectedEntries.length; i++) {
      const entry = selectedEntries[i]
      const prizePosition = Math.min(i + 1, prizePositions.length) // Map to available prizes
      const prizeAmount = prizePositions[prizePosition - 1]?.amount || null

      const winner = await prisma.winner.create({
        data: {
          drawId,
          userId: entry.userId,
          position: prizePosition,
          prizeAmount,
          ticketNumber: entry.ticketNumber
        }
      })

      // Award prize to user's wallet if there's a prize amount
      if (prizeAmount) {
        await prisma.wallet.update({
          where: { userId: entry.userId },
          data: {
            balance: {
              increment: Number(prizeAmount)
            }
          }
        })

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId: entry.userId,
            type: 'PRIZE_WIN',
            amount: prizeAmount,
            status: 'COMPLETED',
            description: `Prize from draw: ${draw.title} (Position ${prizePosition})`
          }
        })
      }

      createdWinners.push(winner)
    }

    // Update draw status to COMPLETED
    const updatedDraw = await prisma.draw.update({
      where: { id: drawId },
      data: {
        status: 'COMPLETED',
        updatedAt: drawTimestamp
      }
    })

    return NextResponse.json({
      message: 'Draw executed successfully',
      draw: updatedDraw,
      winners: createdWinners.map((w) => ({
        position: w.position,
        ticketNumber: w.ticketNumber,
        userId: w.userId,
        prizeAmount: w.prizeAmount?.toString(),
        createdAt: w.createdAt
      })),
      totalWinners: createdWinners.length,
      drawnAt: drawTimestamp.toISOString()
    })
  } catch (error) {
    console.error('Execute draw error:', error)
    return NextResponse.json(
      { error: 'Failed to execute draw' },
      { status: 500 }
    )
  }
}

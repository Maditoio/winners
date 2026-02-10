import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const draws = await prisma.draw.findMany({
      where: {
        status: { in: ['ACTIVE', 'UPCOMING'] }
      },
      include: {
        prizes: {
          orderBy: { position: 'asc' }
        },
        _count: {
          select: { entries: true }
        }
      },
      orderBy: { drawDate: 'asc' }
    })

    const now = new Date()

    return NextResponse.json(
      draws.map((draw: any) => ({
        ...draw,
        entryPrice: draw.entryPrice.toString(),
        currentEntries: draw._count.entries,
        isOpen:
          now >= new Date(draw.createdAt) &&
          now < new Date(draw.drawDate) &&
          draw.status !== 'COMPLETED' &&
          draw.status !== 'DRAWING',
        prizes: draw.prizes.map((prize: any) => ({
          ...prize,
          prizeAmount: prize.prizeAmount?.toString()
        }))
      }))
    )
  } catch (error) {
    console.error('Draws error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch draws' },
      { status: 500 }
    )
  }
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

    const { title, description, entryPrice, maxEntries, drawDate, firstPrizeImage, prizes } = await req.json()

    const draw = await prisma.draw.create({
      data: {
        title,
        description,
        entryPrice: parseFloat(entryPrice),
        maxEntries,
        drawDate: new Date(drawDate),
        firstPrizeImage,
        prizes: {
          create: prizes.map((prize: any) => ({
            position: prize.position,
            name: prize.name,
            description: prize.description,
            prizeAmount: prize.prizeAmount ? parseFloat(prize.prizeAmount) : null,
            imageUrl: prize.imageUrl
          }))
        }
      },
      include: {
        prizes: true
      }
    })

    return NextResponse.json(draw)
  } catch (error) {
    console.error('Create draw error:', error)
    return NextResponse.json(
      { error: 'Failed to create draw' },
      { status: 500 }
    )
  }
}

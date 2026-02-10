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

    // Validation
    if (!title || !entryPrice || !drawDate) {
      return NextResponse.json(
        { error: 'Title, entry price, and draw date are required' },
        { status: 400 }
      )
    }

    if (!prizes || prizes.length === 0) {
      return NextResponse.json(
        { error: 'At least one prize is required' },
        { status: 400 }
      )
    }

    // Validate image sizes (1MB max)
    if (firstPrizeImage && firstPrizeImage.startsWith('data:image')) {
      const base64Length = firstPrizeImage.split(',')[1]?.length || 0
      const sizeInBytes = (base64Length * 3) / 4
      if (sizeInBytes > 1024 * 1024) {
        return NextResponse.json(
          { error: 'First prize image must be less than 1MB' },
          { status: 400 }
        )
      }
    }

    // Validate prize images
    for (const prize of prizes) {
      if (prize.imageUrl && prize.imageUrl.startsWith('data:image')) {
        const base64Length = prize.imageUrl.split(',')[1]?.length || 0
        const sizeInBytes = (base64Length * 3) / 4
        if (sizeInBytes > 1024 * 1024) {
          return NextResponse.json(
            { error: `Prize "${prize.name}" image must be less than 1MB` },
            { status: 400 }
          )
        }
      }
    }

    const draw = await prisma.draw.create({
      data: {
        title,
        description: description || null,
        entryPrice: parseFloat(entryPrice),
        maxEntries: maxEntries ? parseInt(maxEntries) : null,
        drawDate: new Date(drawDate),
        firstPrizeImage: firstPrizeImage || null,
        prizes: {
          create: prizes.map((prize: any, index: number) => ({
            position: index + 1,
            name: prize.name,
            description: prize.description || null,
            prizeAmount: prize.prizeAmount ? parseFloat(prize.prizeAmount) : null,
            imageUrl: prize.imageUrl || null
          }))
        }
      },
      include: {
        prizes: true
      }
    })

    return NextResponse.json(draw)
  } catch (error: any) {
    console.error('Create draw error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create draw' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

export async function PUT(
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
    const body = await req.json()

    const {
      title,
      description,
      startDate,
      endDate,
      drawDate,
      entryPrice,
      maxEntries,
      prizes,
      status
    } = body

    // First, delete existing prizes
    await prisma.prize.deleteMany({
      where: { drawId: id }
    })

    // Update draw with new prizes
    const updatedDraw = await prisma.draw.update({
      where: { id },
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        drawDate: new Date(drawDate),
        entryPrice: parseFloat(entryPrice),
        maxEntries: maxEntries ? parseInt(maxEntries) : null,
        status,
        prizes: {
          create: prizes.map((prize: any) => ({
            position: prize.position,
            name: prize.name,
            prizeAmount: prize.prizeAmount ? parseFloat(prize.prizeAmount) : null
          }))
        }
      },
      include: {
        prizes: { orderBy: { position: 'asc' } }
      }
    })

    return NextResponse.json({
      message: 'Draw updated successfully',
      draw: {
        ...updatedDraw,
        entryPrice: updatedDraw.entryPrice.toString(),
        prizes: updatedDraw.prizes.map((prize: any) => ({
          ...prize,
          prizeAmount: prize.prizeAmount?.toString()
        }))
      }
    })
  } catch (error) {
    console.error('Update draw error:', error)
    return NextResponse.json(
      { error: 'Failed to update draw' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Get draw with entries
    const draw = await prisma.draw.findUnique({
      where: { id },
      include: {
        entries: true
      }
    })

    if (!draw) {
      return NextResponse.json(
        { error: 'Draw not found' },
        { status: 404 }
      )
    }

    // Process refunds for all users with entries
    if (draw.entries.length > 0) {
      // Group entries by userId and sum amounts
      const refundsByUser = new Map<string, number>()
      
      for (const entry of draw.entries) {
        const current = refundsByUser.get(entry.userId) || 0
        refundsByUser.set(entry.userId, current + Number(draw.entryPrice))
      }

      // Process refunds in a transaction
      for (const [userId, refundAmount] of refundsByUser) {
        // Update wallet balance
        await prisma.wallet.update({
          where: { userId },
          data: {
            balance: {
              increment: refundAmount
            }
          }
        })

        // Create refund transaction record with DEPOSIT type (REFUND enum will be added later)
        await prisma.transaction.create({
          data: {
            userId,
            type: 'DEPOSIT',
            amount: refundAmount,
            status: 'COMPLETED',
            description: `Refund for deleted draw: ${draw.title}`
          }
        })
      }
    }

    // Delete prizes first (cascade should handle this, but being explicit)
    await prisma.prize.deleteMany({
      where: { drawId: id }
    })

    // Delete the draw (entries will be cascade deleted)
    await prisma.draw.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Draw deleted successfully',
      refundedCount: draw.entries.length
    })
  } catch (error) {
    console.error('Delete draw error:', error)
    return NextResponse.json(
      { error: 'Failed to delete draw' },
      { status: 500 }
    )
  }
}

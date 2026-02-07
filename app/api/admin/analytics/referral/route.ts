import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all referral bonus transactions
    const referralTransactions = await prisma.transaction.findMany({
      where: {
        type: 'REFERRAL_BONUS',
        status: 'COMPLETED'
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Aggregate by day
    const byDay = new Map<string, { amount: number, count: number }>()
    referralTransactions.forEach(tx => {
      const dateKey = tx.createdAt.toISOString().split('T')[0]
      const existing = byDay.get(dateKey) || { amount: 0, count: 0 }
      byDay.set(dateKey, {
        amount: existing.amount + parseFloat(tx.amount.toString()),
        count: existing.count + 1
      })
    })

    // Aggregate by month
    const byMonth = new Map<string, { amount: number, count: number }>()
    referralTransactions.forEach(tx => {
      const dateKey = tx.createdAt.toISOString().slice(0, 7)
      const existing = byMonth.get(dateKey) || { amount: 0, count: 0 }
      byMonth.set(dateKey, {
        amount: existing.amount + parseFloat(tx.amount.toString()),
        count: existing.count + 1
      })
    })

    // Aggregate by year
    const byYear = new Map<string, { amount: number, count: number }>()
    referralTransactions.forEach(tx => {
      const dateKey = tx.createdAt.getFullYear().toString()
      const existing = byYear.get(dateKey) || { amount: 0, count: 0 }
      byYear.set(dateKey, {
        amount: existing.amount + parseFloat(tx.amount.toString()),
        count: existing.count + 1
      })
    })

    // Calculate totals
    const totalAmount = referralTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0)
    const totalCount = referralTransactions.length

    return NextResponse.json({
      total: {
        amount: totalAmount,
        count: totalCount
      },
      byDay: Array.from(byDay.entries()).map(([date, data]) => ({
        date,
        ...data
      })),
      byMonth: Array.from(byMonth.entries()).map(([month, data]) => ({
        month,
        ...data
      })),
      byYear: Array.from(byYear.entries()).map(([year, data]) => ({
        year,
        ...data
      }))
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

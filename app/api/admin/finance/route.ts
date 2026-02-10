import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    // Get withdrawal requests data
    const withdrawalRequests = await prisma.withdrawalRequest.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 && {
          requestedAt: dateFilter
        })
      },
      select: {
        id: true,
        amount: true,
        fee: true,
        netAmount: true,
        status: true,
        requestedAt: true,
        reviewedAt: true
      },
      orderBy: { requestedAt: 'desc' }
    })

    // Calculate withdrawal fee income (only from completed withdrawals)
    const completedWithdrawals = withdrawalRequests.filter(w => w.status === 'COMPLETED')
    const totalWithdrawalFeeIncome = completedWithdrawals.reduce(
      (sum, w) => sum + parseFloat(w.fee.toString()),
      0
    )
    const totalWithdrawalAmount = completedWithdrawals.reduce(
      (sum, w) => sum + parseFloat(w.amount.toString()),
      0
    )

    // All withdrawals by status
    const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'PENDING')
    const underReviewWithdrawals = withdrawalRequests.filter(w => w.status === 'UNDER_REVIEW')
    const rejectedWithdrawals = withdrawalRequests.filter(w => w.status === 'REJECTED')

    const pendingFees = pendingWithdrawals.reduce(
      (sum, w) => sum + parseFloat(w.fee.toString()),
      0
    )
    const underReviewFees = underReviewWithdrawals.reduce(
      (sum, w) => sum + parseFloat(w.fee.toString()),
      0
    )

    // Get deposit transactions - EXCLUDE refunds from rejected withdrawals or cancelled draws
    // Only count deposits from external crypto transfers (should have txHash)
    const deposits = await prisma.transaction.findMany({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        txHash: { not: null }, // Only real crypto deposits have transaction hashes
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter
        })
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        userId: true,
        txHash: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalDeposits = deposits.reduce(
      (sum, d) => sum + parseFloat(d.amount.toString()),
      0
    )

    // Get entry purchases (revenue from draws)
    const entryPurchases = await prisma.transaction.findMany({
      where: {
        type: 'ENTRY_PURCHASE',
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter
        })
      },
      select: {
        amount: true
      }
    })

    const totalEntryRevenue = entryPurchases.reduce(
      (sum, e) => sum + parseFloat(e.amount.toString()),
      0
    )

    // Prize payouts
    const prizePayouts = await prisma.transaction.findMany({
      where: {
        type: 'PRIZE_WIN',
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter
        })
      },
      select: {
        amount: true
      }
    })

    const totalPrizePayouts = prizePayouts.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0
    )

    // Referral bonuses paid
    const referralBonuses = await prisma.transaction.findMany({
      where: {
        type: 'REFERRAL_BONUS',
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter
        })
      },
      select: {
        amount: true
      }
    })

    const totalReferralBonuses = referralBonuses.reduce(
      (sum, r) => sum + parseFloat(r.amount.toString()),
      0
    )

    // Calculate profit/loss
    const totalIncome = totalWithdrawalFeeIncome + totalEntryRevenue
    const totalExpenses = totalWithdrawalAmount + totalPrizePayouts + totalReferralBonuses
    const netProfit = totalIncome - totalExpenses

    return NextResponse.json({
      summary: {
        totalWithdrawalFeeIncome: totalWithdrawalFeeIncome.toFixed(2),
        totalWithdrawalAmount: totalWithdrawalAmount.toFixed(2),
        totalDeposits: totalDeposits.toFixed(2),
        totalEntryRevenue: totalEntryRevenue.toFixed(2),
        totalPrizePayouts: totalPrizePayouts.toFixed(2),
        totalReferralBonuses: totalReferralBonuses.toFixed(2),
        totalIncome: totalIncome.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        netProfit: netProfit.toFixed(2)
      },
      withdrawals: {
        completed: {
          count: completedWithdrawals.length,
          totalAmount: totalWithdrawalAmount.toFixed(2),
          totalFees: totalWithdrawalFeeIncome.toFixed(2)
        },
        pending: {
          count: pendingWithdrawals.length,
          potentialFees: pendingFees.toFixed(2)
        },
        underReview: {
          count: underReviewWithdrawals.length,
          potentialFees: underReviewFees.toFixed(2)
        },
        rejected: {
          count: rejectedWithdrawals.length
        }
      },
      deposits: {
        count: deposits.length,
        total: totalDeposits.toFixed(2)
      },
      entries: {
        count: entryPurchases.length,
        revenue: totalEntryRevenue.toFixed(2)
      },
      prizes: {
        count: prizePayouts.length,
        total: totalPrizePayouts.toFixed(2)
      },
      referrals: {
        count: referralBonuses.length,
        total: totalReferralBonuses.toFixed(2)
      }
    })
  } catch (error) {
    console.error('Finance data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch finance data' },
      { status: 500 }
    )
  }
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FinanceData {
  summary: {
    totalWithdrawalFeeIncome: string
    totalWithdrawalAmount: string
    totalDeposits: string
    totalEntryRevenue: string
    totalPrizePayouts: string
    totalReferralBonuses: string
    totalIncome: string
    totalExpenses: string
    netProfit: string
  }
  withdrawals: {
    completed: {
      count: number
      totalAmount: string
      totalFees: string
    }
    pending: {
      count: number
      potentialFees: string
    }
    underReview: {
      count: number
      potentialFees: string
    }
    rejected: {
      count: number
    }
  }
  deposits: {
    count: number
    total: string
  }
  entries: {
    count: number
    revenue: string
  }
  prizes: {
    count: number
    total: string
  }
  referrals: {
    count: number
    total: string
  }
}

export default function FinanceAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [financeData, setFinanceData] = useState<FinanceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchFinanceData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const res = await fetch(`/api/admin/finance?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch finance data')
      const data = await res.json()
      setFinanceData(data)
    } catch {
      setError('Failed to load finance data')
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session && session.user.role !== 'ADMIN') {
      router.push('/draws')
    } else if (session?.user?.role === 'ADMIN') {
      fetchFinanceData()
    }
  }, [status, session, router, fetchFinanceData])

  const handleDateFilter = () => {
    fetchFinanceData()
  }

  const clearDateFilter = () => {
    setStartDate('')
    setEndDate('')
    setTimeout(() => fetchFinanceData(), 0)
  }

  const exportToCSV = () => {
    if (!financeData) return

    const csvData = [
      ['Financial Report', ''],
      ['Generated', new Date().toLocaleString()],
      ['Period', startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'],
      [''],
      ['INCOME'],
      ['Withdrawal Fees (18%)', financeData.summary.totalWithdrawalFeeIncome],
      ['Entry Sales', financeData.summary.totalEntryRevenue],
      ['Total Income', financeData.summary.totalIncome],
      [''],
      ['EXPENSES'],
      ['Withdrawals Paid', financeData.summary.totalWithdrawalAmount],
      ['Prize Payouts', financeData.summary.totalPrizePayouts],
      ['Referral Bonuses', financeData.summary.totalReferralBonuses],
      ['Total Expenses', financeData.summary.totalExpenses],
      [''],
      ['NET PROFIT', financeData.summary.netProfit],
      [''],
      ['DEPOSITS'],
      ['Total Deposits', financeData.deposits.total],
      ['Deposit Count', financeData.deposits.count.toString()],
      [''],
      ['WITHDRAWALS'],
      ['Completed Count', financeData.withdrawals.completed.count.toString()],
      ['Completed Amount', financeData.withdrawals.completed.totalAmount],
      ['Completed Fees', financeData.withdrawals.completed.totalFees],
      ['Pending Count', financeData.withdrawals.pending.count.toString()],
      ['Pending Potential Fees', financeData.withdrawals.pending.potentialFees],
      ['Under Review Count', financeData.withdrawals.underReview.count.toString()],
      ['Under Review Potential Fees', financeData.withdrawals.underReview.potentialFees],
      ['Rejected Count', financeData.withdrawals.rejected.count.toString()]
    ]

    const csv = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-purple-600 hover:text-purple-700">
              ← Back
            </Link>
            <h1 className="text-3xl font-bold text-black">💰 Financial Dashboard</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 Filter by Date Range</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
          </div>
          <button
            onClick={handleDateFilter}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Apply Filter
          </button>
          {(startDate || endDate) && (
            <button
              onClick={clearDateFilter}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear Filter
            </button>
          )}
          <button
            onClick={() => fetchFinanceData()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            🔄 Refresh
          </button>
          {financeData && (
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📊 Export CSV
            </button>
          )}
        </div>
        {(startDate || endDate) && (
          <p className="text-sm text-gray-600 mt-3">
            Showing data from {startDate || 'beginning'} to {endDate || 'now'}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="text-center text-gray-600 py-12">Loading financial data...</div>
      ) : financeData ? (
        <>
          {/* Profit & Loss Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">📈 Profit & Loss Statement</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="text-sm font-medium text-green-700 uppercase mb-2">Total Income</div>
                <div className="text-3xl font-bold text-green-900">${financeData.summary.totalIncome}</div>
                <div className="text-xs text-green-700 mt-2">
                  Fees + Entry Sales
                </div>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <div className="text-sm font-medium text-red-700 uppercase mb-2">Total Expenses</div>
                <div className="text-3xl font-bold text-red-900">${financeData.summary.totalExpenses}</div>
                <div className="text-xs text-red-700 mt-2">
                  Withdrawals + Prizes + Bonuses
                </div>
              </div>
              <div className={`border-2 rounded-lg p-6 ${
                parseFloat(financeData.summary.netProfit) >= 0
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className={`text-sm font-medium uppercase mb-2 ${
                  parseFloat(financeData.summary.netProfit) >= 0
                    ? 'text-blue-700'
                    : 'text-red-700'
                }`}>Net Profit</div>
                <div className={`text-3xl font-bold ${
                  parseFloat(financeData.summary.netProfit) >= 0
                    ? 'text-blue-900'
                    : 'text-red-900'
                }`}>
                  ${financeData.summary.netProfit}
                </div>
                <div className={`text-xs mt-2 ${
                  parseFloat(financeData.summary.netProfit) >= 0
                    ? 'text-blue-700'
                    : 'text-red-700'
                }`}>
                  Income - Expenses
                </div>
              </div>
            </div>
          </div>

          {/* Income Breakdown */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">💵 Income Breakdown</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-purple-900">Withdrawal Fees (18%)</h3>
                  <span className="text-2xl">💰</span>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">
                  ${financeData.summary.totalWithdrawalFeeIncome}
                </div>
                <div className="text-sm text-purple-700">
                  From {financeData.withdrawals.completed.count} completed withdrawals
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  Total withdrawn: ${financeData.withdrawals.completed.totalAmount}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-blue-900">Entry Sales Revenue</h3>
                  <span className="text-2xl">🎟️</span>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">
                  ${financeData.summary.totalEntryRevenue}
                </div>
                <div className="text-sm text-blue-700">
                  From {financeData.entries.count} entry purchases
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Breakdown */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">💸 Expenses Breakdown</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-orange-900">Withdrawals Paid</h3>
                  <span className="text-xl">📤</span>
                </div>
                <div className="text-2xl font-bold text-orange-900 mb-2">
                  ${financeData.summary.totalWithdrawalAmount}
                </div>
                <div className="text-xs text-orange-700">
                  To {financeData.withdrawals.completed.count} users
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-yellow-900">Prize Payouts</h3>
                  <span className="text-xl">🏆</span>
                </div>
                <div className="text-2xl font-bold text-yellow-900 mb-2">
                  ${financeData.summary.totalPrizePayouts}
                </div>
                <div className="text-xs text-yellow-700">
                  {financeData.prizes.count} prizes awarded
                </div>
              </div>
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-pink-900">Referral Bonuses</h3>
                  <span className="text-xl">🎁</span>
                </div>
                <div className="text-2xl font-bold text-pink-900 mb-2">
                  ${financeData.summary.totalReferralBonuses}
                </div>
                <div className="text-xs text-pink-700">
                  {financeData.referrals.count} bonuses paid
                </div>
              </div>
            </div>
          </div>

          {/* Withdrawal Status Details */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">📋 Withdrawal Status Details</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm font-medium text-green-700 uppercase mb-2">Completed</div>
                <div className="text-2xl font-bold text-green-900">{financeData.withdrawals.completed.count}</div>
                <div className="text-xs text-green-700 mt-1">Fees: ${financeData.withdrawals.completed.totalFees}</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm font-medium text-yellow-700 uppercase mb-2">Pending</div>
                <div className="text-2xl font-bold text-yellow-900">{financeData.withdrawals.pending.count}</div>
                <div className="text-xs text-yellow-700 mt-1">Potential: ${financeData.withdrawals.pending.potentialFees}</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-sm font-medium text-orange-700 uppercase mb-2">Under Review</div>
                <div className="text-2xl font-bold text-orange-900">{financeData.withdrawals.underReview.count}</div>
                <div className="text-xs text-orange-700 mt-1">Potential: ${financeData.withdrawals.underReview.potentialFees}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm font-medium text-red-700 uppercase mb-2">Rejected</div>
                <div className="text-2xl font-bold text-red-900">{financeData.withdrawals.rejected.count}</div>
                <div className="text-xs text-red-700 mt-1">No fees collected</div>
              </div>
            </div>
          </div>

          {/* Deposits Overview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">💳 Deposits Overview</h2>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-indigo-700 uppercase mb-2">Total Deposits Received</div>
                  <div className="text-4xl font-bold text-indigo-900">${financeData.deposits.total}</div>
                  <div className="text-sm text-indigo-700 mt-2">
                    From {financeData.deposits.count} completed deposits
                  </div>
                  <div className="text-xs text-indigo-600 mt-3">
                    ℹ️ Deposits are user funds added to platform (not direct income)
                  </div>
                </div>
                <span className="text-6xl">📥</span>
              </div>
            </div>
          </div>

          {/* Audit Notes */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">📝 Audit Notes</h3>
            <ul className="text-xs text-gray-700 space-y-2">
              <li>• <strong>Income Sources:</strong> Withdrawal fees (18% of each completed withdrawal) and entry sales revenue</li>
              <li>• <strong>Expenses:</strong> Net amount paid to users for withdrawals, prize payouts, and referral bonuses</li>
              <li>• <strong>Deposits:</strong> User funds received (not counted as income, represents user balances)</li>
              <li>• <strong>Pending/Under Review:</strong> Potential fees shown but not yet realized income</li>
              <li>• <strong>Rejected Withdrawals:</strong> Funds returned to user, no fees collected</li>
            </ul>
          </div>
        </>
      ) : null}
      </div>
    </div>
  )
}

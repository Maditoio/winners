'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ReferralAnalytics {
  total: {
    amount: number
    count: number
  }
  byDay: Array<{ date: string; amount: number; count: number }>
  byMonth: Array<{ month: string; amount: number; count: number }>
  byYear: Array<{ year: string; amount: number; count: number }>
}

export default function ReferralAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'yearly' | 'monthly' | 'daily'>('yearly')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session && session.user.role !== 'ADMIN') {
      router.push('/draws')
    } else if (session?.user?.role === 'ADMIN') {
      fetchAnalytics()
    }
  }, [status, session, router])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/analytics/referral')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch (err) {
      setError('Failed to load referral bonus analytics')
    } finally {
      setIsLoading(false)
    }
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/reports" className="text-purple-600 hover:text-purple-700">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Referral Bonus Analytics</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-gray-600">Loading analytics...</div>
      ) : analytics ? (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="text-sm font-medium text-purple-700 uppercase">Total Referral Bonus Given</div>
              <div className="text-4xl font-bold text-purple-900 mt-3">${analytics.total.amount.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="text-sm font-medium text-blue-700 uppercase">Total Referrals Rewarded</div>
              <div className="text-4xl font-bold text-blue-900 mt-3">{analytics.total.count}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('yearly')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'yearly'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'monthly'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setActiveTab('daily')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'daily'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Daily
              </button>
            </div>

            {/* Yearly Tab */}
            {activeTab === 'yearly' && (
              <div className="space-y-3">
                {analytics.byYear.length === 0 ? (
                  <div className="text-center text-gray-600 py-8">No referral bonus data yet</div>
                ) : (
                  analytics.byYear.map((year) => (
                    <div key={year.year} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <div className="font-semibold text-gray-900">Year {year.year}</div>
                        <div className="text-sm text-gray-600">{year.count} referrals rewarded</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">${year.amount.toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Monthly Tab */}
            {activeTab === 'monthly' && (
              <div className="space-y-3">
                {analytics.byMonth.length === 0 ? (
                  <div className="text-center text-gray-600 py-8">No referral bonus data yet</div>
                ) : (
                  analytics.byMonth.reverse().map((month) => (
                    <div key={month.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <div className="font-semibold text-gray-900">{formatMonth(month.month)}</div>
                        <div className="text-sm text-gray-600">{month.count} referrals rewarded</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">${month.amount.toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Daily Tab */}
            {activeTab === 'daily' && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analytics.byDay.length === 0 ? (
                  <div className="text-center text-gray-600 py-8">No referral bonus data yet</div>
                ) : (
                  analytics.byDay.reverse().map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <div className="font-semibold text-gray-900">{formatDate(day.date)}</div>
                        <div className="text-sm text-gray-600">{day.count} referrals rewarded</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">${day.amount.toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <div className="flex justify-center">
            <button
              onClick={fetchAnalytics}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Refresh Analytics
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatMonth(monthString: string): string {
  const [year, month] = monthString.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })
}

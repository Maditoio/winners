'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface WithdrawalRequest {
  id: string
  amount: string
  fee: string
  netAmount: string
  cryptoAddress: string
  status: string
  requestedAt: string
  reviewedAt?: string
  adminNotes?: string
  user: {
    id: string
    email: string
    name?: string
  }
}

export default function AdminWithdrawalsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [actionStatus, setActionStatus] = useState<'UNDER_REVIEW' | 'COMPLETED' | 'REJECTED'>('UNDER_REVIEW')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session && session.user.role !== 'ADMIN') {
      router.push('/draws')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchWithdrawals()
    }
  }, [session])

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals')
      if (!res.ok) throw new Error('Failed to fetch withdrawals')
      const data = await res.json()
      setWithdrawals(data)
    } catch (err) {
      setError('Failed to load withdrawal requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (withdrawalId: string, newStatus: string, notes: string) => {
    setProcessingId(withdrawalId)
    setError('')

    try {
      const res = await fetch('/api/admin/withdrawals/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          status: newStatus,
          adminNotes: notes
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update status')
      }

      await fetchWithdrawals()
      setSelectedWithdrawal(null)
      setAdminNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setProcessingId(null)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const filteredWithdrawals = filterStatus === 'ALL' 
    ? withdrawals 
    : withdrawals.filter(w => w.status === filterStatus)

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'PENDING').length,
    underReview: withdrawals.filter(w => w.status === 'UNDER_REVIEW').length,
    completed: withdrawals.filter(w => w.status === 'COMPLETED').length,
    rejected: withdrawals.filter(w => w.status === 'REJECTED').length,
    totalAmount: withdrawals
      .filter(w => w.status === 'COMPLETED')
      .reduce((sum, w) => sum + parseFloat(w.netAmount), 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-purple-600 hover:text-purple-700 font-semibold"
          >
            ← Back to Dashboard
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdrawal Management</h1>
        <p className="text-gray-600 mb-8">Review and process user withdrawal requests</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600 mb-1">Total Requests</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-md p-4 border border-yellow-200">
            <div className="text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-md p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Under Review</div>
            <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-md p-4 border border-green-200">
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow-md p-4 border border-red-200">
            <div className="text-sm text-gray-600 mb-1">Rejected</div>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'UNDER_REVIEW', 'COMPLETED', 'REJECTED'].map((statusFilter) => (
              <button
                key={statusFilter}
                onClick={() => setFilterStatus(statusFilter)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                  filterStatus === statusFilter
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {statusFilter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No withdrawal requests found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-semibold text-gray-900 mb-1">
                        {withdrawal.user.name || 'User'}
                      </div>
                      <div className="text-sm text-gray-600">{withdrawal.user.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Requested: {new Date(withdrawal.requestedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Amount</div>
                      <div className="font-bold text-lg text-gray-900">
                        {parseFloat(withdrawal.amount).toFixed(2)} USDT
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Fee (18%)</div>
                      <div className="font-semibold text-red-600">
                        {parseFloat(withdrawal.fee).toFixed(2)} USDT
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Net Amount</div>
                      <div className="font-semibold text-green-600">
                        {parseFloat(withdrawal.netAmount).toFixed(2)} USDT
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Status</div>
                      <div className="font-semibold text-gray-900">
                        {withdrawal.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Crypto Address:</div>
                    <div className="text-xs text-gray-900 break-all font-mono">
                      {withdrawal.cryptoAddress}
                    </div>
                  </div>

                  {withdrawal.adminNotes && (
                    <div className="bg-yellow-50 rounded-lg p-3 mb-4 border border-yellow-200">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Admin Notes:</div>
                      <div className="text-sm text-gray-900">{withdrawal.adminNotes}</div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {withdrawal.status !== 'COMPLETED' && withdrawal.status !== 'REJECTED' && (
                    <div className="mt-4">
                      {selectedWithdrawal === withdrawal.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Action
                            </label>
                            <select
                              value={actionStatus}
                              onChange={(e) => setActionStatus(e.target.value as any)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                            >
                              <option value="UNDER_REVIEW">Move to Under Review</option>
                              <option value="COMPLETED">Mark as Completed</option>
                              <option value="REJECTED">Reject Request</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Admin Notes (Optional)
                            </label>
                            <textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                              rows={3}
                              placeholder="Add notes about this action..."
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateStatus(withdrawal.id, actionStatus, adminNotes)}
                              disabled={processingId === withdrawal.id}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                              {processingId === withdrawal.id ? 'Processing...' : 'Confirm Action'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(null)
                                setAdminNotes('')
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedWithdrawal(withdrawal.id)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Process Request
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

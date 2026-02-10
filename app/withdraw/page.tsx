'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Profile {
  wallet: {
    balance: string
    cryptoAddress: string
  }
}

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
}

export default function WithdrawalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [amount, setAmount] = useState('')
  const [cryptoAddress, setCryptoAddress] = useState('')
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isLoading, setIsLoading] = useState(true)

  const WITHDRAWAL_FEE_PERCENT = 18

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchProfile()
      fetchWithdrawalRequests()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setProfile(data)
      setCryptoAddress(data.wallet.cryptoAddress)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWithdrawalRequests = async () => {
    try {
      const res = await fetch('/api/user/withdrawals')
      if (res.ok) {
        const data = await res.json()
        setWithdrawalRequests(data)
      }
    } catch (err) {
      console.error('Failed to fetch withdrawal requests')
    }
  }

  const isWeekday = () => {
    const day = new Date().getDay()
    return day >= 1 && day <= 5 // Monday (1) to Friday (5)
  }

  const calculateFee = (withdrawAmount: number) => {
    return withdrawAmount * (WITHDRAWAL_FEE_PERCENT / 100)
  }

  const calculateNetAmount = (withdrawAmount: number) => {
    return withdrawAmount - calculateFee(withdrawAmount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!isWeekday()) {
      setMessageType('error')
      setMessage('Withdrawals are only allowed Monday to Friday')
      return
    }

    const withdrawAmount = parseFloat(amount)
    
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setMessageType('error')
      setMessage('Please enter a valid amount')
      return
    }

    if (!profile || withdrawAmount > parseFloat(profile.wallet.balance)) {
      setMessageType('error')
      setMessage('Insufficient balance')
      return
    }

    if (withdrawAmount < 10) {
      setMessageType('error')
      setMessage('Minimum withdrawal amount is 10 USDT')
      return
    }

    if (!cryptoAddress || cryptoAddress.length < 10) {
      setMessageType('error')
      setMessage('Please enter a valid crypto address')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/user/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawAmount,
          cryptoAddress
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessageType('error')
        setMessage(data.error || 'Failed to submit withdrawal request')
      } else {
        setMessageType('success')
        setMessage('Withdrawal request submitted successfully! It will be reviewed shortly.')
        setAmount('')
        await fetchProfile()
        await fetchWithdrawalRequests()
      }
    } catch (err) {
      setMessageType('error')
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!session || !profile) {
    return null
  }

  const withdrawAmount = parseFloat(amount) || 0
  const fee = calculateFee(withdrawAmount)
  const netAmount = calculateNetAmount(withdrawAmount)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdraw Funds</h1>
        <p className="text-gray-600 mb-8">Request a withdrawal from your wallet (Monday - Friday only)</p>

        {!isWeekday() && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-semibold">
              ⚠️ Withdrawals are only available Monday to Friday. Please come back on a weekday.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Withdrawal Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">💸 New Withdrawal Request</h2>
            
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-1">Available Balance</div>
              <div className="text-2xl font-bold text-purple-600">
                {parseFloat(profile.wallet.balance).toFixed(2)} USDT
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount (USDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Minimum 10 USDT"
                  disabled={isSubmitting || !isWeekday()}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: 10 USDT</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crypto Address (USDT)
                </label>
                <input
                  type="text"
                  value={cryptoAddress}
                  onChange={(e) => setCryptoAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Enter your USDT wallet address"
                  disabled={isSubmitting || !isWeekday()}
                  required
                />
              </div>

              {withdrawAmount > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Withdrawal Amount:</span>
                    <span className="font-semibold text-gray-900">{withdrawAmount.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fee ({WITHDRAWAL_FEE_PERCENT}%):</span>
                    <span className="font-semibold text-red-600">-{fee.toFixed(2)} USDT</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">You will receive:</span>
                    <span className="font-bold text-green-600 text-lg">{netAmount.toFixed(2)} USDT</span>
                  </div>
                </div>
              )}

              {message && (
                <div className={`px-4 py-3 rounded-lg border ${
                  messageType === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !isWeekday()}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting Request...' : 'Submit Withdrawal Request'}
              </button>
            </form>
          </div>

          {/* Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ℹ️ Important Information</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-gray-700">
                  <strong>Availability:</strong> Withdrawals can only be requested Monday to Friday
                </p>
              </div>
              
              <div className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-gray-700">
                  <strong>Fee:</strong> All withdrawals incur an {WITHDRAWAL_FEE_PERCENT}% processing fee
                </p>
              </div>
              
              <div className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-gray-700">
                  <strong>Minimum:</strong> Minimum withdrawal amount is 10 USDT
                </p>
              </div>
              
              <div className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-gray-700">
                  <strong>Review Process:</strong> All requests go through manual review by our team
                </p>
              </div>
              
              <div className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-gray-700">
                  <strong>Processing Time:</strong> Requests are typically processed within 24-48 hours
                </p>
              </div>
              
              <div className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-gray-700">
                  <strong>Status Updates:</strong> Check the status of your requests below
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Withdrawal History</h2>
          
          {withdrawalRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No withdrawal requests yet
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawalRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {parseFloat(request.amount).toFixed(2)} USDT
                      </div>
                      <div className="text-xs text-gray-500">
                        Requested: {new Date(request.requestedAt).toLocaleString()}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div>
                      <span className="text-gray-600">Fee:</span>
                      <span className="ml-2 font-semibold text-red-600">
                        {parseFloat(request.fee).toFixed(2)} USDT
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Net Amount:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        {parseFloat(request.netAmount).toFixed(2)} USDT
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600 break-all">
                    To: {request.cryptoAddress}
                  </div>
                  
                  {request.adminNotes && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Admin Notes:</div>
                      <div className="text-xs text-gray-600">{request.adminNotes}</div>
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

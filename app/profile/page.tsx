'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'

interface Profile {
  id: string
  email: string
  name?: string
  role: string
  referralCode: string
  referralCount: number
  wallet: {
    balance: string
    cryptoAddress: string
  }
}

interface ReferralInfo {
  referralCode: string
  referralCount: number
  totalBonus: string
  referralBonus: string
  referralLink: string
  referrals: Array<{
    id: string
    email: string
    name?: string
    createdAt: string
  }>
}

interface TransactionItem {
  id: string
  type: string
  amount: string
  status: string
  description?: string
  txHash?: string
  fromAddress?: string
  toAddress?: string
  createdAt: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [txPage, setTxPage] = useState(1)
  const [txTotalPages, setTxTotalPages] = useState(1)
  const [txLoading, setTxLoading] = useState(false)
  const [isSimulatingDeposit, setIsSimulatingDeposit] = useState(false)
  const [depositMessage, setDepositMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchProfile()
      fetchReferralInfo()
      fetchTransactions(1)
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setProfile(data)
      
      // Generate QR code for crypto address
      if (data.wallet?.cryptoAddress) {
        const qr = await QRCode.toDataURL(data.wallet.cryptoAddress)
        setQrCodeUrl(qr)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReferralInfo = async () => {
    try {
      const res = await fetch('/api/user/referrals')
      if (!res.ok) throw new Error('Failed to fetch referrals')
      const data = await res.json()
      setReferralInfo(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchTransactions = async (page = 1) => {
    setTxLoading(true)
    try {
      const res = await fetch(`/api/user/transactions?page=${page}&limit=20`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      const data = await res.json()
      setTransactions(data.transactions)
      setTxPage(data.pagination.page)
      setTxTotalPages(data.pagination.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setTxLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const simulateDeposit = async () => {
    if (!profile?.wallet?.cryptoAddress) return
    setDepositMessage('')
    setIsSimulatingDeposit(true)
    try {
      const payload = {
        txHash: `test_${Date.now()}`,
        toAddress: profile.wallet.cryptoAddress,
        amount: '15',
        status: 'confirmed'
      }
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) {
        setDepositMessage(data.error || 'Failed to simulate deposit')
      } else {
        setDepositMessage('Test deposit processed: 15 USDT')
        await fetchProfile()
        await fetchTransactions(1)
      }
    } catch (err) {
      setDepositMessage('Failed to simulate deposit')
    } finally {
      setIsSimulatingDeposit(false)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Wallet Info */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💰 Wallet</h2>
          
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-lg p-6 mb-4">
            <div className="text-sm mb-2">Balance</div>
            <div className="text-4xl font-bold">{parseFloat(profile.wallet.balance).toFixed(2)} USDT</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Crypto Deposit Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={profile.wallet.cryptoAddress}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                />
                <button
                  onClick={() => copyToClipboard(profile.wallet.cryptoAddress)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
            </div>

            {qrCodeUrl && (
              <div className="text-center">
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto w-48 h-48" />
                <p className="text-sm text-gray-600 mt-2">
                  Scan to deposit USDT
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Send only USDT to this address. Deposits typically reflect within 5-10 minutes. Minimum deposit is 3 USDT.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={simulateDeposit}
                disabled={isSimulatingDeposit}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {isSimulatingDeposit ? 'Simulating...' : 'Simulate 15 USDT Deposit'}
              </button>
              {depositMessage && (
                <span className="text-sm text-gray-900">{depositMessage}</span>
              )}
            </div>
          </div>
        </div>

        {/* Referral Info */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🎁 Referral Program</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Referrals</div>
              <div className="text-2xl font-bold text-purple-600">{referralInfo?.referralCount || 0}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Earned</div>
              <div className="text-2xl font-bold text-blue-600">
                {parseFloat(referralInfo?.totalBonus || '0').toFixed(2)} USDT
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Referral Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralInfo?.referralLink || ''}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                />
                <button
                  onClick={() => copyToClipboard(referralInfo?.referralLink || '')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Earn {parseFloat(referralInfo?.referralBonus || '0.25').toFixed(2)} USDT</strong> for every friend who signs up and makes their first deposit.
              </p>
            </div>

            {referralInfo && referralInfo.referrals.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Your Referrals</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {referralInfo.referrals.map((ref) => (
                    <div key={ref.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <div>
                        <div className="font-medium text-sm">{ref.name || 'User'}</div>
                        <div className="text-xs text-gray-600">{ref.email}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📜 Transaction History</h2>

          {txLoading ? (
            <div className="text-center text-gray-600">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-gray-600">No transactions yet.</div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-900">{tx.type.replace('_', ' ')}</div>
                      <div className="text-sm text-gray-600">
                        {tx.description || 'Transaction'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{parseFloat(tx.amount).toFixed(2)} USDT</div>
                      <div className={`text-xs font-semibold ${
                        tx.status === 'COMPLETED'
                          ? 'text-green-600'
                          : tx.status === 'PENDING'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(tx.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => fetchTransactions(Math.max(1, txPage - 1))}
                  disabled={txPage <= 1}
                  className="px-3 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {txPage} of {txTotalPages}
                </span>
                <button
                  onClick={() => fetchTransactions(Math.min(txTotalPages, txPage + 1))}
                  disabled={txPage >= txTotalPages}
                  className="px-3 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">👤 Account Details</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 text-gray-900">{profile.email}</div>
            </div>
            {profile.name && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <div className="mt-1 text-gray-900">{profile.name}</div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <div className="mt-1">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
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
    withdrawalAddress?: string
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
  const [copiedCrypto, setCopiedCrypto] = useState(false)
  const [copiedReferral, setCopiedReferral] = useState(false)
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [txPage, setTxPage] = useState(1)
  const [txTotalPages, setTxTotalPages] = useState(1)
  const [txLoading, setTxLoading] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositAddress, setDepositAddress] = useState('')
  const [depositPaymentId, setDepositPaymentId] = useState('')
  const [depositError, setDepositError] = useState('')
  const [isCreatingDeposit, setIsCreatingDeposit] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [withdrawalAddress, setWithdrawalAddress] = useState('')
  const [isUpdatingWithdrawalAddress, setIsUpdatingWithdrawalAddress] = useState(false)
  const [withdrawalAddressMessage, setWithdrawalAddressMessage] = useState('')
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)

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
      setWithdrawalAddress(data.wallet?.withdrawalAddress || '')
      // Don't auto-load old deposit address - user must generate new one
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

  const copyToClipboard = async (text: string, type: 'crypto' | 'referral') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'crypto') {
        setCopiedCrypto(true)
        setTimeout(() => setCopiedCrypto(false), 2000)
      } else {
        setCopiedReferral(true)
        setTimeout(() => setCopiedReferral(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCreateDepositAddress = async () => {
    setDepositError('')
    setDepositPaymentId('')

    const amount = Number(depositAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setDepositError('Please enter a valid deposit amount')
      return
    }

    setIsCreatingDeposit(true)
    console.log('[PROFILE] Starting deposit address creation:', { amount })

    try {
      const res = await fetch('/api/wallet/deposit/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })
      console.log('[PROFILE] Deposit request response status:', res.status)

      const data = await res.json()
      console.log('[PROFILE] Response data:', data)
      
      if (!res.ok) {
        const errorMsg = data.error || data.details || 'Failed to create deposit address'
        console.error('[PROFILE] Deposit creation failed:', errorMsg)
        setDepositError(errorMsg)
        return
      }

      console.log('[PROFILE] Deposit successful, address:', data.payAddress ? '***' : 'missing')
      setDepositAddress(data.payAddress)
      setDepositPaymentId(data.paymentId)
      if (data.payAddress) {
        const qr = await QRCode.toDataURL(data.payAddress)
        setQrCodeUrl(qr)
      }

      setProfile((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          wallet: {
            ...prev.wallet,
            cryptoAddress: data.payAddress
          }
        }
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error('[PROFILE] Deposit creation exception:', errorMsg)
      setDepositError('Failed to create deposit address: ' + errorMsg)
    } finally {
      setIsCreatingDeposit(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordChangeMessage('')

    if (newPassword !== confirmPassword) {
      setPasswordChangeMessage('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordChangeMessage('Password must be at least 8 characters long')
      return
    }

    setIsChangingPassword(true)

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        setPasswordChangeMessage(data.error || 'Failed to change password')
      } else {
        setPasswordChangeMessage('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordChangeMessage(''), 5000)
      }
    } catch (err) {
      setPasswordChangeMessage('An error occurred. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }
const handleUpdateWithdrawalAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawalAddressMessage('')

    if (!withdrawalAddress || withdrawalAddress.length < 10) {
      setWithdrawalAddressMessage('Please enter a valid withdrawal address')
      return
    }

    setIsUpdatingWithdrawalAddress(true)

    try {
      const res = await fetch('/api/user/withdrawal-address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalAddress })
      })

      const data = await res.json()

      if (!res.ok) {
        setWithdrawalAddressMessage(data.error || 'Failed to set withdrawal address')
      } else {
        setWithdrawalAddressMessage('✓ Withdrawal address set successfully! This cannot be changed.')
        setWithdrawalAddress('')
        await fetchProfile() // Refresh to show locked state
        setTimeout(() => setWithdrawalAddressMessage(''), 5000)
      }
    } catch (err) {
      setWithdrawalAddressMessage('An error occurred. Please try again.')
    } finally {
      setIsUpdatingWithdrawalAddress(false)
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

  const activeDepositAddress = depositAddress || ''
  const isPendingAddress = !activeDepositAddress || activeDepositAddress.startsWith('np_pending_')
  const displayDepositAddress = isPendingAddress ? '' : activeDepositAddress

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-black mb-8">My Profile</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Wallet Info */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💰 Wallet</h2>
          
          <div className="bg-linear-to-br from-purple-500 to-blue-500 text-white rounded-lg p-6 mb-4">
            <div className="text-sm mb-2">Balance</div>
            <div className="text-4xl font-bold">{parseFloat(profile.wallet.balance).toFixed(2)} USDT</div>
          </div>

          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create Deposit Address (USDT on Polygon)
              </label>
              <div className="flex flex-col gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Enter amount (min 10 USDT)"
                />
                <button
                  type="button"
                  onClick={handleCreateDepositAddress}
                  disabled={isCreatingDeposit}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {isCreatingDeposit ? 'Creating Address...' : 'Generate Deposit Address'}
                </button>
                {depositPaymentId && (
                  <div className="text-xs text-gray-600">
                    Payment ID: <span className="font-mono">{depositPaymentId}</span>
                  </div>
                )}
                {depositError && (
                  <div className="text-xs text-red-600">
                    {depositError}
                  </div>
                )}
              </div>
            </div>

            {!isPendingAddress && (
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Crypto Deposit Address
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={displayDepositAddress}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                  {qrCodeUrl && (
                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="group relative shrink-0"
                      type="button"
                      title="Click to view QR code"
                    >
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code" 
                        className="w-10 h-10 border-2 border-purple-200 rounded-lg hover:border-purple-400 transition-colors cursor-pointer" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(activeDepositAddress, 'crypto')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shrink-0"
                  >
                    {copiedCrypto ? '✓' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">USDT on Polygon network</p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏦 USDT (Polygon / MATIC network) Withdrawal Address
              </label>
              
              {profile.wallet?.withdrawalAddress ? (
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 text-lg">✓</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900 mb-1">Withdrawal Address Set</p>
                        <code className="text-xs text-green-800 bg-green-100 px-2 py-1 rounded break-all">
                          {profile.wallet.withdrawalAddress}
                        </code>
                        <p className="text-xs text-green-700 mt-2">
                          🔒 This address is locked and cannot be changed for security reasons.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateWithdrawalAddress} className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 font-medium mb-1">⚠️ Important</p>
                    <p className="text-xs text-yellow-700">
                      Once you set your withdrawal address, it <strong>cannot be changed</strong> for security reasons. 
                      Please double-check before saving.
                    </p>
                  </div>
                  
                  <input
                    type="text"
                    value={withdrawalAddress}
                    onChange={(e) => setWithdrawalAddress(e.target.value)}
                    placeholder="Enter your USDT (Polygon/MATIC) wallet address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm"
                    required
                  />

                  {withdrawalAddressMessage && (
                    <div className={`px-3 py-2 rounded-lg text-sm ${
                      withdrawalAddressMessage.includes('successfully')
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {withdrawalAddressMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUpdatingWithdrawalAddress || !withdrawalAddress}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                  >
                    {isUpdatingWithdrawalAddress ? 'Setting Address...' : 'Set Withdrawal Address (Cannot be changed later)'}
                  </button>
                </form>
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
                  onClick={() => copyToClipboard(referralInfo?.referralLink || '', 'referral')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {copiedReferral ? '✓' : 'Copy'}
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
                        <div className="font-medium text-sm text-gray-900">{ref.name || 'User'}</div>
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
                      <div className={`font-semibold ${
                        tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFERRAL_BONUS'
                          ? 'text-green-600'
                          : tx.type === 'ENTRY_PURCHASE' || tx.type === 'WITHDRAWAL'
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFERRAL_BONUS' ? '+' : '-'}{parseFloat(tx.amount).toFixed(2)} USDT
                      </div>
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

        {/* Account Info & Security */}
        <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Account Details */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">👤 Account Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="text-gray-900 font-medium">{profile.email}</div>
                </div>
                {profile.name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <div className="text-gray-900 font-medium">{profile.name}</div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {profile.role}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code</label>
                  <div className="text-gray-900 font-mono font-semibold">{profile.referralCode}</div>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="border-l border-gray-200 pl-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🔒 Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                minLength={8}
                required
              />
              <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                minLength={8}
                required
              />
            </div>

            {passwordChangeMessage && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                passwordChangeMessage.includes('successfully')
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {passwordChangeMessage}
              </div>
            )}

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {isQrModalOpen && qrCodeUrl && !isPendingAddress && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Deposit QR Code</h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex flex-col items-center">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-64 h-64 border-2 border-gray-200 rounded-lg" 
              />
              <p className="text-sm text-gray-600 mt-4 text-center">
                Scan this QR code to deposit USDT to your wallet
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full">
                <p className="text-xs text-gray-600 mb-1">Address:</p>
                <code className="text-xs text-gray-900 break-all font-mono">
                  {displayDepositAddress}
                </code>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 md:hidden">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg font-semibold"
        >
          Log Out
        </button>
      </div>
      <div className="mt-8 hidden md:block">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold"
        >
          Log Out
        </button>
      </div>
      </div>
    </div>
  )
}

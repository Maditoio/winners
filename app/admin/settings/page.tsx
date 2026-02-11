'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ReferralTier {
  referralThreshold: number
  maxTickets: number
}

interface GlobalSettings {
  referralBonus: string
  maxTicketsWithoutReferrals: string
  referralTiers: ReferralTier[]
}

export default function SettingsAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<GlobalSettings>({
    referralBonus: '0.25',
    maxTicketsWithoutReferrals: '10',
    referralTiers: [
      { referralThreshold: 10, maxTickets: 25 },
      { referralThreshold: 25, maxTickets: 50 },
      { referralThreshold: 50, maxTickets: 75 },
      { referralThreshold: 75, maxTickets: 150 },
      { referralThreshold: 150, maxTickets: 300 }
    ]
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session && session.user.role !== 'ADMIN') {
      router.push('/draws')
    } else if (session?.user?.role === 'ADMIN') {
      fetchSettings()
    }
  }, [status, session, router])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/global')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      // Sort tiers when loading
      const sortedData = {
        ...data,
        referralTiers: [...data.referralTiers].sort((a: ReferralTier, b: ReferralTier) => a.referralThreshold - b.referralThreshold)
      }
      setSettings(sortedData)
    } catch (err) {
      setMessage('Failed to load settings')
    }
  }

  const saveSettings = async () => {
    setMessage('')
    setIsSaving(true)
    try {
      // Sort tiers before saving
      const sortedSettings = {
        ...settings,
        referralTiers: [...settings.referralTiers].sort((a, b) => a.referralThreshold - b.referralThreshold)
      }
      
      const res = await fetch('/api/admin/settings/global', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sortedSettings)
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || 'Failed to update settings')
      } else {
        setSettings(data)
        setMessage('All settings updated successfully!')
      }
    } catch (err) {
      setMessage('Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  const updateTier = (index: number, field: 'referralThreshold' | 'maxTickets', value: number) => {
    const newTiers = [...settings.referralTiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    setSettings({ ...settings, referralTiers: newTiers })
  }

  const addTier = () => {
    const newTiers = [...settings.referralTiers, { referralThreshold: 200, maxTickets: 500 }]
    setSettings({ ...settings, referralTiers: newTiers.sort((a, b) => a.referralThreshold - b.referralThreshold) })
  }

  const removeTier = (index: number) => {
    const newTiers = settings.referralTiers.filter((_, i) => i !== index)
    setSettings({ ...settings, referralTiers: newTiers })
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-purple-600 hover:text-purple-700">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-black">Settings</h1>
      </div>

      <div className="space-y-8">
        {/* Referral Program Settings */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Referral Program</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Bonus per Referral (USDT)
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Amount awarded to users when their referred friend makes their first deposit.
              </p>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.referralBonus}
                onChange={(e) => setSettings({ ...settings, referralBonus: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Ticket Limit Settings */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Ticket Purchase Limits</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Max Tickets Without Referrals
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Maximum number of tickets users can purchase with no referrals.
              </p>
              <input
                type="number"
                min="1"
                value={settings.maxTicketsWithoutReferrals}
                onChange={(e) => setSettings({ ...settings, maxTicketsWithoutReferrals: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Referral Tiers */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-900">
                  Referral Tiers
                </label>
                <button
                  onClick={addTier}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Tier
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Configure ticket limits for different referral level tiers. Users get the highest limit they qualify for.
              </p>
              
              <div className="space-y-4">
                {settings.referralTiers.map((tier, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Referral Threshold
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tier.referralThreshold}
                        onChange={(e) => updateTier(index, 'referralThreshold', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Max Tickets
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tier.maxTickets}
                        onChange={(e) => updateTier(index, 'maxTickets', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    {settings.referralTiers.length > 1 && (
                      <button
                        onClick={() => removeTier(index)}
                        className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 mb-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('successfully')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How These Settings Work</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li><strong>Referral Bonus:</strong> Users earn this amount when a referred friend deposits for the first time</li>
          <li><strong>Max Tickets Without Referrals:</strong> New users can only buy this many tickets per draw</li>
          <li><strong>Referral Tiers:</strong> Users with N+ referrals get M max tickets per draw</li>
          <li className="pt-2"><strong>Example:</strong> If a user has 50 referrals and the tier is set to &quot;50 referrals → 75 tickets&quot;, they can buy up to 75 tickets per draw</li>
          <li className="text-xs pt-2">Users always qualify for the highest tier they meet the referral requirement for</li>
        </ul>
      </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import CountdownTimer from './CountdownTimer'

interface Draw {
  id: string
  title: string
  description?: string
  entryPrice: string
  maxEntries?: number
  currentEntries: number
  status: string
  startDate: string
  endDate: string
  drawDate: string
  firstPrizeImage?: string
  isOpen?: boolean
  prizes: Array<{
    position: number
    name: string
    prizeAmount?: string
    imageUrl?: string
  }>
}

interface DrawCardProps {
  draw: Draw
  onEnter?: (drawId: string, quantity: number) => void
  lastTickets?: string[]
}

interface UserLimits {
  referralBonus: string
  maxTicketsWithoutReferrals: number
  userReferrals: number
  maxTickets: number
  tiers: Array<{
    referralThreshold: number
    maxTickets: number
  }>
}

export default function DrawCard({ draw, onEnter, lastTickets }: DrawCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [isEntering, setIsEntering] = useState(false)
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null)
  const [isLoadingLimits, setIsLoadingLimits] = useState(true)
  const isOpen = draw.isOpen ?? draw.status === 'ACTIVE'

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const res = await fetch('/api/user/ticket-limits')
        if (res.ok) {
          const data = await res.json()
          setUserLimits(data)
        }
      } catch (err) {
        console.error('Failed to fetch ticket limits')
      } finally {
        setIsLoadingLimits(false)
      }
    }
    
    if (onEnter) {
      fetchLimits()
    }
  }, [onEnter])

  const handleEnter = async () => {
    if (!onEnter) return
    setIsEntering(true)
    try {
      await onEnter(draw.id, quantity)
      setQuantity(1)
    } finally {
      setIsEntering(false)
    }
  }

  const remainingEntries = draw.maxEntries 
    ? draw.maxEntries - draw.currentEntries 
    : null

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {draw.firstPrizeImage && (
        <div className="relative h-48 bg-gray-200">
          <Image
            src={draw.firstPrizeImage}
            alt={draw.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{draw.title}</h3>
        {draw.description && (
          <p className="text-gray-600 mb-4">{draw.description}</p>
        )}

        <div className="mb-4">
          <CountdownTimer targetDate={draw.drawDate} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-purple-50 rounded p-3">
            <div className="text-sm text-gray-600">Entry Price</div>
            <div className="text-xl font-bold text-purple-600">{draw.entryPrice} USDT</div>
          </div>
          <div className="bg-blue-50 rounded p-3">
            <div className="text-sm text-gray-600">Participants</div>
            <div className="text-xl font-bold text-blue-600">{draw.currentEntries}</div>
          </div>
        </div>

        {remainingEntries !== null && (
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-1">
              Remaining Entries: {remainingEntries}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: `${(draw.currentEntries / (draw.maxEntries || 1)) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {draw.prizes.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Prizes:</div>
            <div className="space-y-1">
              {draw.prizes.slice(0, 3).map((prize) => (
                <div key={prize.position} className="flex justify-between text-sm">
                  <span className="text-gray-600">{prize.position}. {prize.name}</span>
                  {prize.prizeAmount && (
                    <span className="font-semibold text-purple-600">{prize.prizeAmount} USDT</span>
                  )}
                </div>
              ))}
              {draw.prizes.length > 3 && (
                <div className="text-xs text-gray-500">+{draw.prizes.length - 3} more prizes</div>
              )}
            </div>
          </div>
        )}

        {onEnter && (
          <div className="space-y-3">
            {!isLoadingLimits && userLimits && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <div className="font-semibold text-blue-900 mb-2">Your Ticket Limit</div>
                <div className="text-blue-800 mb-2">
                  You can buy up to <strong>{userLimits.maxTickets}</strong> tickets per draw.
                </div>
                <div className="text-blue-700 text-xs">
                  Referrals: {userLimits.userReferrals}
                </div>
                {userLimits.userReferrals < Math.max(...userLimits.tiers.map(t => t.referralThreshold)) && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="text-blue-700 text-xs mb-2">Next tier:</div>
                    {userLimits.tiers
                      .filter(t => t.referralThreshold > userLimits.userReferrals)
                      .sort((a, b) => a.referralThreshold - b.referralThreshold)
                      .slice(0, 1)
                      .map(tier => (
                        <div key={tier.referralThreshold} className="text-blue-600 text-xs">
                          {tier.referralThreshold - userLimits.userReferrals} more referrals → {tier.maxTickets} tickets
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-900 font-medium">Quantity:</label>
              <input
                type="number"
                min="1"
                max={remainingEntries || undefined}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="border border-gray-300 rounded px-3 py-1 w-20 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                disabled={!isOpen}
              />
              <span className="text-sm text-gray-900 font-medium">
                Total: {(parseFloat(draw.entryPrice) * quantity).toFixed(2)} USDT
              </span>
            </div>
            <button
              onClick={handleEnter}
              disabled={!isOpen || isEntering || (remainingEntries !== null && remainingEntries < quantity)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOpen
                ? (isEntering ? 'Entering...' : draw.status === 'UPCOMING' ? 'Buy Ticket (Pre-sale)' : 'Enter Draw')
                : 'Draw Closed'}
            </button>
            {lastTickets && lastTickets.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                <div className="font-semibold text-gray-800 mb-1">Your ticket numbers</div>
                <div className="flex flex-wrap gap-2">
                  {lastTickets.map((ticket) => (
                    <span
                      key={ticket}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-gray-700"
                    >
                      {ticket}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isOpen && (
          <div className="text-center py-2 text-gray-500 text-sm">
            {draw.status === 'UPCOMING' && (
              <>Pre-sale closed • Starts on {new Date(draw.startDate).toLocaleString()}</>
            )}
            {draw.status === 'COMPLETED' && 'Draw Completed'}
            {draw.status === 'DRAWING' && 'Drawing in Progress'}
            {draw.status === 'ACTIVE' && 'Draw closed'}
          </div>
        )}
      </div>
    </div>
  )
}

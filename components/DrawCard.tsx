'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
    <Link href={`/draws/${draw.id}`} className="block h-full">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow h-full cursor-pointer">
        <div className="relative h-40 bg-gradient-to-br from-purple-100 to-blue-100">
          {draw.firstPrizeImage ? (
            <Image
              src={draw.firstPrizeImage}
              alt={draw.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={65}
              priority={false}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-5xl mb-2">🎁</div>
                <div className="text-sm font-bold text-gray-600">Prize Draw</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{draw.title}</h3>
          {draw.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{draw.description}</p>
          )}

          <div className="mb-4">
            <CountdownTimer targetDate={draw.drawDate} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-purple-50 rounded p-3">
              <div className="text-xs text-gray-600">Entry Price</div>
              <div className="text-lg font-bold text-purple-600">{draw.entryPrice} USDT</div>
            </div>
            <div className="bg-blue-50 rounded p-3">
              <div className="text-xs text-gray-600">Participants</div>
              <div className="text-lg font-bold text-blue-600">{draw.currentEntries}</div>
            </div>
          </div>

          {remainingEntries !== null && (
            <div className="mb-4">
              <div className="text-xs text-gray-600 mb-1">
                Remaining: {remainingEntries}
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
              <div className="text-xs font-semibold text-gray-700 mb-2">Prizes:</div>
              <div className="space-y-1">
                {draw.prizes.slice(0, 2).map((prize) => (
                  <div key={prize.position} className="flex justify-between text-xs">
                    <span className="text-gray-600">{prize.position}. {prize.name}</span>
                    {prize.prizeAmount && (
                      <span className="font-semibold text-purple-600">{prize.prizeAmount} USDT</span>
                    )}
                  </div>
                ))}
                {draw.prizes.length > 2 && (
                  <div className="text-xs text-gray-500">+{draw.prizes.length - 2} more</div>
                )}
              </div>
            </div>
          )}

          <div className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 text-sm text-center">
            {isOpen ? 'View & Participate' : 'View Details'}
          </div>

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
    </Link>
  )
}

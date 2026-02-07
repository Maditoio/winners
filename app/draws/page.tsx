'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DrawCard from '@/components/DrawCard'

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

export default function DrawsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [draws, setDraws] = useState<Draw[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [ticketsByDraw, setTicketsByDraw] = useState<Record<string, string[]>>({})
  const [insufficientBalance, setInsufficientBalance] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchDraws()
    }
  }, [session])

  const fetchDraws = async () => {
    try {
      const res = await fetch('/api/draws')
      if (!res.ok) throw new Error('Failed to fetch draws')
      const data = await res.json()
      setDraws(data)
    } catch (err) {
      setError('Failed to load draws')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnter = async (drawId: string, quantity: number) => {
    try {
      const res = await fetch(`/api/draws/${drawId}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })

      const data = await res.json()

      if (!res.ok) {
        const message = data.error || 'Failed to enter draw'
        if (message.toLowerCase().includes('insufficient')) {
          setInsufficientBalance('Insufficient balance. Please deposit USDT to join this draw.')
        }
        if (data.referralLimit) {
          alert(`${message}\n\nYou have ${data.userReferrals} referral(s). You need ${data.referralsNeeded} more to unlock unlimited tickets.`)
        } else {
          alert(message)
        }
      } else {
        alert(`Successfully purchased ${quantity} entry(s)!`)
        setInsufficientBalance('')
        setTicketsByDraw((prev) => ({
          ...prev,
          [drawId]: (data.entries || []).map((e: { ticketNumber: string }) => e.ticketNumber)
        }))
        fetchDraws()
      }
    } catch (err) {
      alert('An error occurred. Please try again.')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Active Draws</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {insufficientBalance && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6 flex flex-wrap items-center justify-between gap-3">
          <span>{insufficientBalance}</span>
          <Link
            href="/profile"
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            Go to Deposit
          </Link>
        </div>
      )}

      {draws.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No active draws at the moment. Check back soon!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {draws.map((draw) => (
            <DrawCard
              key={draw.id}
              draw={draw}
              onEnter={handleEnter}
              lastTickets={ticketsByDraw[draw.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

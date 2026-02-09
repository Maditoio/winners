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

interface Winner {
  position: number
  ticketNumber: string
  prizeAmount?: string
  createdAt: string
}

interface DrawResults {
  drawId: string
  drawTitle: string
  totalParticipants: number
  winners: Winner[]
  totalWinners: number
  drawnAt: string
}

export default function DrawsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [draws, setDraws] = useState<Draw[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [ticketsByDraw, setTicketsByDraw] = useState<Record<string, string[]>>({})
  const [insufficientBalance, setInsufficientBalance] = useState('')
  const [drawResults, setDrawResults] = useState<Record<string, DrawResults>>({})
  const [userTickets, setUserTickets] = useState<Record<string, string[]>>({})

  const fetchDraws = async () => {
    try {
      const res = await fetch('/api/draws')
      if (!res.ok) throw new Error('Failed to fetch draws')
      const data = await res.json()
      setDraws(data)

      // Fetch results for completed draws
      for (const draw of data) {
        if (draw.status === 'COMPLETED') {
          await fetchDrawResults(draw.id)
        }
      }
    } catch {
      setError('Failed to load draws')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserTickets = async () => {
    try {
      const res = await fetch('/api/user/tickets')
      if (res.ok) {
        const data = await res.json()
        setUserTickets(data)
      }
    } catch {
      console.error('Failed to fetch user tickets')
    }
  }

  const fetchDrawResults = async (drawId: string) => {
    try {
      const res = await fetch(`/api/draws/${drawId}/winners`)
      if (res.ok) {
        const data = await res.json()
        setDrawResults((prev) => ({ ...prev, [drawId]: data }))
      }
    } catch {
      console.error(`Failed to fetch results for draw ${drawId}`)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchDraws()
      fetchUserTickets()
    }
  }, [session])

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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Draws</h1>

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

      {/* Active Draws Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Active & Upcoming Draws</h2>
        {draws.filter((d) => d.status !== 'COMPLETED').length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No active draws at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draws
              .filter((d) => d.status !== 'COMPLETED')
              .map((draw) => (
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

      {/* Completed Draws Section */}
      {draws.filter((d) => d.status === 'COMPLETED').length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Draws & Results</h2>
          <div className="space-y-6">
            {draws
              .filter((d) => d.status === 'COMPLETED')
              .map((draw) => {
                const results = drawResults[draw.id]
                const myTickets = userTickets[draw.id] || []
                const myWinningTickets = results
                  ? results.winners.filter((w) => myTickets.includes(w.ticketNumber))
                  : []

                return (
                  <div key={draw.id} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{draw.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{draw.description}</p>
                    </div>

                    {results && (
                      <>
                        <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                          <div>
                            <div className="text-sm text-gray-600">Total Participants</div>
                            <div className="text-2xl font-bold text-gray-900">{results.totalParticipants}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Winners Selected</div>
                            <div className="text-2xl font-bold text-purple-600">{results.totalWinners}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Drew At</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {new Date(results.drawnAt).toLocaleDateString()} {new Date(results.drawnAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        {/* Winning Tickets */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3">🏆 Winning Numbers</h4>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {results.winners.map((winner, idx) => {
                              const isMyWin = myTickets.includes(winner.ticketNumber)
                              return (
                                <div
                                  key={idx}
                                  className={`flex justify-between items-center p-3 rounded-lg ${
                                    isMyWin
                                      ? 'bg-green-100 border-2 border-green-500'
                                      : 'bg-gray-50 border border-gray-200'
                                  }`}
                                >
                                  <div>
                                    <div className={`font-semibold ${isMyWin ? 'text-green-700' : 'text-gray-900'}`}>
                                      #{winner.position} {isMyWin && '⭐ YOU WON!'}
                                    </div>
                                    <div className={`text-sm ${isMyWin ? 'text-green-600' : 'text-gray-600'}`}>
                                      Ticket: {winner.ticketNumber}
                                    </div>
                                  </div>
                                  {winner.prizeAmount && (
                                    <div className={`text-right font-bold ${isMyWin ? 'text-green-700' : 'text-gray-900'}`}>
                                      {Number(winner.prizeAmount).toFixed(2)} USDT
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {myWinningTickets.length > 0 && (
                          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                            <p className="text-green-800 font-semibold">
                              🎉 Congratulations! You have {myWinningTickets.length} winning ticket(s)!
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Ticket {
  id: string
  ticketNumber: string
  purchasedAt: string
  draw: {
    id: string
    title: string
    entryPrice: string
    status: string
    drawDate: string
    firstPrizeImage?: string
  }
}

export default function TicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchTickets()
    }
  }, [session])

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/user/tickets')
      if (!res.ok) throw new Error('Failed to fetch tickets')
      const data = await res.json()
      setTickets(data)
    } catch (err) {
      setError('Failed to load tickets')
    } finally {
      setIsLoading(false)
    }
  }

  const groupedTickets = useMemo(() => {
    const grouped: Record<string, Ticket[]> = {}
    tickets.forEach((ticket) => {
      if (!grouped[ticket.draw.id]) grouped[ticket.draw.id] = []
      grouped[ticket.draw.id].push(ticket)
    })
    return grouped
  }, [tickets])

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">My Tickets</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">You have no tickets yet. Join a draw to get started!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedTickets).map((group) => {
            const draw = group[0].draw
            return (
              <div key={draw.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6 p-6">
                  {draw.firstPrizeImage && (
                    <div className="relative h-40 w-full md:w-56 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={draw.firstPrizeImage}
                        alt={draw.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{draw.title}</h2>
                        <p className="text-sm text-gray-600">
                          Draw Date: {new Date(draw.drawDate).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        draw.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : draw.status === 'COMPLETED'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {draw.status}
                      </span>
                    </div>

                    <div className="mt-4 text-sm text-gray-700">
                      Entry Price: <span className="font-semibold">{draw.entryPrice} USDT</span>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-semibold text-gray-800 mb-2">Your Tickets</div>
                      <div className="flex flex-wrap gap-2">
                        {group.map((ticket) => (
                          <div key={ticket.id} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded">
                            <div className="text-xs text-gray-500">Ticket</div>
                            <div className="font-mono text-sm text-gray-800">{ticket.ticketNumber}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(ticket.purchasedAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}

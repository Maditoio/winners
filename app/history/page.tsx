'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface HistoryDraw {
  id: string
  title: string
  drawDate: string
  firstPrizeImage?: string
  winners: Array<{
    id: string
    position: number
    userId: string
    prizeAmount?: string
    ticketNumber: string
  }>
  prizes: Array<{
    position: number
    name: string
    prizeAmount?: string
    imageUrl?: string
  }>
}

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [history, setHistory] = useState<HistoryDraw[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchHistory()
    }
  }, [session])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/draws/history')
      if (!res.ok) throw new Error('Failed to fetch history')
      const data = await res.json()
      setHistory(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">Draw History</h1>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No completed draws yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((draw) => (
            <div key={draw.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{draw.title}</h2>
                    <p className="text-sm text-gray-600">
                      Drawn on {new Date(draw.drawDate).toLocaleDateString()}
                    </p>
                  </div>
                  {draw.firstPrizeImage && (
                    <div className="w-24 h-24 relative rounded-lg overflow-hidden">
                      <Image
                        src={draw.firstPrizeImage}
                        alt={draw.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                {draw.winners.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Winners:</h3>
                    {draw.winners.map((winner) => {
                      const prize = draw.prizes.find(p => p.position === winner.position)
                      return (
                        <div
                          key={winner.id}
                          className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                              {winner.position}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {prize?.name || `Position ${winner.position}`}
                              </div>
                              <div className="text-sm text-gray-600">
                                Ticket: {winner.ticketNumber}
                              </div>
                            </div>
                          </div>
                          {winner.prizeAmount && (
                            <div className="text-lg font-bold text-purple-600">
                              {winner.prizeAmount} USDT
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600">No winners announced yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

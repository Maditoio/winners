'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import CountdownTimer from '@/components/CountdownTimer'

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
  prizes: Array<{
    position: number
    name: string
    description?: string
    prizeAmount?: string
    imageUrl?: string
  }>
}

interface UserTickets {
  [drawId: string]: string[]
}

export default function DrawDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const drawId = params.id as string

  const [draw, setDraw] = useState<Draw | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isEntering, setIsEntering] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userTickets, setUserTickets] = useState<string[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchDraw()
      fetchUserTickets()
    }
  }, [session, drawId])

  const fetchDraw = async () => {
    try {
      const res = await fetch(`/api/draws/${drawId}`)
      if (!res.ok) throw new Error('Failed to fetch draw')
      const data = await res.json()
      setDraw(data)
    } catch (err) {
      setError('Failed to load draw details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserTickets = async () => {
    try {
      const res = await fetch('/api/user/tickets')
      if (res.ok) {
        const data: UserTickets = await res.json()
        setUserTickets(data[drawId] || [])
      }
    } catch (err) {
      console.error('Failed to fetch tickets')
    }
  }

  const handleEnter = async () => {
    if (!draw || quantity < 1) return
    
    setError('')
    setSuccess('')
    setIsEntering(true)

    try {
      const res = await fetch(`/api/draws/${drawId}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      })

      const data = await res.json()

      if (!res.ok) {
        const message = data.error || 'Failed to enter draw'
        if (message.toLowerCase().includes('insufficient')) {
          setError('Insufficient balance. Please deposit USDT.')
        } else {
          setError(message)
        }
      } else {
        setSuccess(`Successfully purchased ${quantity} entry(ies)!`)
        setQuantity(1)
        await fetchDraw()
        await fetchUserTickets()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsEntering(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading draw details...</div>
      </div>
    )
  }

  if (!draw) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">{error || 'Draw not found'}</div>
      </div>
    )
  }

  const now = new Date()
  const startDate = new Date(draw.startDate)
  const endDate = new Date(draw.endDate)
  // Draw is open for participation as soon as startDate is reached, regardless of status
  const isOpen = now >= startDate && now < endDate
  const remainingEntries = draw.maxEntries ? draw.maxEntries - draw.currentEntries : null
  const participationPercentage = draw.maxEntries ? (draw.currentEntries / draw.maxEntries) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 px-4 py-2 text-purple-600 hover:text-purple-700 font-semibold"
      >
        ← Back
      </button>

      {/* Promotion Image */}
      <div className="mb-8">
        <div className="relative w-full h-64 md:h-96 bg-linear-to-br from-purple-100 to-blue-100 rounded-lg overflow-hidden shadow-md">
          {draw.firstPrizeImage ? (
            <Image
              src={draw.firstPrizeImage}
              alt={draw.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 1200px"
              quality={75}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🎁</div>
                <div className="text-xl font-bold text-gray-700">{draw.title}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Title and Description */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{draw.title}</h1>
            {draw.description && (
              <p className="text-lg text-gray-700 mb-4">{draw.description}</p>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 font-semibold">
                Status: <span className={`${
                  draw.status === 'ACTIVE' ? 'text-green-600' :
                  draw.status === 'UPCOMING' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>{draw.status}</span>
              </p>
            </div>
          </div>

          {/* Draw Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Draw Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-linear-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                <div className="text-sm text-gray-600 mb-1">Draw Date</div>
                <div className="font-semibold text-gray-900">
                  {new Date(draw.drawDate).toLocaleDateString()} {new Date(draw.drawDate).toLocaleTimeString()}
                </div>
              </div>
              <div className="bg-linear-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                <div className="text-sm text-gray-600 mb-1">Entry Price</div>
                <div className="font-semibold text-purple-600 text-lg">{draw.entryPrice} USDT</div>
              </div>
            </div>
          </div>

          {/* Participation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">👥 Participation</h2>
            <div className="bg-linear-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Current Participants</span>
                  <span className="font-bold text-gray-900">{draw.currentEntries}</span>
                </div>
                {draw.maxEntries && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(participationPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>{draw.currentEntries} entries</span>
                      <span>{draw.maxEntries} max</span>
                    </div>
                    {remainingEntries !== null && remainingEntries > 0 && (
                      <div className="mt-2 text-sm font-semibold text-green-600">
                        {remainingEntries} spots remaining
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Prizes Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🏆 Prizes</h2>
            <div className="grid gap-4">
              {draw.prizes.map((prize) => (
                <div key={prize.position} className="bg-linear-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow">
                  <div className="grid md:grid-cols-3 gap-4 items-start">
                    <div className="relative h-32 md:h-40 bg-linear-to-br from-yellow-100 to-orange-100 rounded-lg overflow-hidden border-2 border-yellow-200">
                      {prize.imageUrl ? (
                        <Image
                          src={prize.imageUrl}
                          alt={prize.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                          quality={70}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🏆</div>
                            <div className="text-xs font-bold text-yellow-700">#{prize.position}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-linear-to-br from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          #{prize.position}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{prize.name}</h3>
                      </div>
                      {prize.description && (
                        <p className="text-gray-600 mb-3">{prize.description}</p>
                      )}
                      {prize.prizeAmount && (
                        <div className="text-2xl font-bold text-purple-600">
                          {prize.prizeAmount} USDT
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Participation Rules */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Participation Rules</h2>
            <div className="bg-linear-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg p-6 space-y-3">
              <div className="flex gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Minimum Balance</h4>
                  <p className="text-sm text-gray-700">You must have at least {draw.entryPrice} USDT in your wallet to participate</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">One Entry = One Ticket</h4>
                  <p className="text-sm text-gray-700">Each entry purchases one ticket with a unique number</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Entry Limits</h4>
                  <p className="text-sm text-gray-700">Ticket purchase limits are based on your referral tier. More referrals = more tickets you can buy</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Fair Winner Selection</h4>
                  <p className="text-sm text-gray-700">Winners are selected using the Fisher-Yates cryptographic shuffle algorithm. One ticket per user maximum can win</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Instant Prize Award</h4>
                  <p className="text-sm text-gray-700">Prizes are awarded immediately after the draw and appear in your wallet</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Participation Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-20 space-y-4">
            <div>
              <CountdownTimer targetDate={draw.drawDate} />
            </div>

            {/* Your Tickets */}
            {userTickets.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">✅ Your Tickets</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {userTickets.map((ticket) => (
                    <div key={ticket} className="text-xs font-mono bg-white rounded px-2 py-1 text-green-700">
                      {ticket}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isOpen ? (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Entries
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total Cost</div>
                      <div className="font-bold text-purple-600">
                        {(parseFloat(draw.entryPrice) * quantity).toFixed(2)} USDT
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleEnter}
                  disabled={isEntering}
                  className="w-full px-4 py-3 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                >
                  {isEntering ? 'Purchasing...' : 'Buy Entries'}
                </button>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
                    {success}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-semibold">
                  This draw is not currently open for participation. Please check the start and end dates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

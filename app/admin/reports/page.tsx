'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AdminDraw {
  id: string
  title: string
  status: string
  startDate: string
  endDate: string
  drawDate: string
  entryPrice: string
  currentEntries: number
  winnersCount: number
  prizeCount: number
  isReadyToDraw: boolean
  revenue?: number
}

export default function ReportsAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [adminDraws, setAdminDraws] = useState<AdminDraw[]>([])
  const [isLoadingDraws, setIsLoadingDraws] = useState(false)
  const [drawError, setDrawError] = useState('')
  const [drawSuccess, setDrawSuccess] = useState('')
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session && session.user.role !== 'ADMIN') {
      router.push('/draws')
    } else if (session?.user?.role === 'ADMIN') {
      fetchAdminDraws()
    }
  }, [status, session, router])

  const fetchAdminDraws = async () => {
    setIsLoadingDraws(true)
    try {
      const res = await fetch('/api/admin/draws')
      if (!res.ok) throw new Error('Failed to fetch draws')
      const data = await res.json()
      const drawsWithRevenue = data.map((draw: AdminDraw) => ({
        ...draw,
        revenue: draw.currentEntries * parseFloat(draw.entryPrice)
      }))
      setAdminDraws(drawsWithRevenue)
      const total = drawsWithRevenue.reduce((sum: number, draw: AdminDraw) => sum + (draw.revenue || 0), 0)
      setTotalRevenue(total)
    } catch (err) {
      setDrawError('Failed to load draws')
    } finally {
      setIsLoadingDraws(false)
    }
  }

  const handleRunDraw = async (drawId: string) => {
    setDrawError('')
    setDrawSuccess('')
    try {
      const res = await fetch(`/api/draws/${drawId}/draw`, {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) {
        setDrawError(data.error || 'Failed to run draw')
      } else {
        setDrawSuccess('Draw completed and winners selected!')
        fetchAdminDraws()
      }
    } catch (err) {
      setDrawError('Failed to run draw')
    }
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-purple-600 hover:text-purple-700">
              ← Back
            </Link>
            <h1 className="text-3xl font-bold text-black">Financial Reports</h1>
        </div>
        <Link href="/admin/analytics/referral" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
          Referral Analytics →
        </Link>
      </div>

      {drawError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {drawError}
        </div>
      )}

      {drawSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {drawSuccess}
        </div>
      )}

      {/* Financial Summary */}
      {adminDraws.length > 0 && (
        <div className="mb-8 grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="text-sm font-medium text-purple-700 uppercase">Total Revenue (All Draws)</div>
            <div className="text-3xl font-bold text-purple-900 mt-3">${totalRevenue.toFixed(2)}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="text-sm font-medium text-blue-700 uppercase">Active Draws</div>
            <div className="text-3xl font-bold text-blue-900 mt-3">{adminDraws.filter(d => d.status === 'ACTIVE').length}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="text-sm font-medium text-green-700 uppercase">Completed Draws</div>
            <div className="text-3xl font-bold text-green-900 mt-3">{adminDraws.filter(d => d.status === 'COMPLETED').length}</div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={fetchAdminDraws}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Refresh Reports
        </button>
      </div>

      {/* Draw Reports */}
      {isLoadingDraws ? (
        <div className="text-center text-gray-600">Loading draws...</div>
      ) : adminDraws.length === 0 ? (
        <div className="text-center text-gray-600">No draws found.</div>
      ) : (
        <div className="space-y-4">
          {adminDraws.map((draw) => (
            <div key={draw.id} className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-900">{draw.title}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    Draw Date: {new Date(draw.drawDate).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Entries: {draw.currentEntries} • Prizes: {draw.prizeCount} • Entry Price: ${parseFloat(draw.entryPrice).toFixed(2)}
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end gap-3">
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-500 uppercase">Revenue</div>
                    <div className="text-3xl font-bold text-purple-600">${(draw.revenue || 0).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      draw.status === 'COMPLETED'
                        ? 'bg-gray-100 text-gray-700'
                        : draw.status === 'DRAWING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {draw.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRunDraw(draw.id)}
                      disabled={!draw.isReadyToDraw || draw.status === 'COMPLETED'}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {draw.isReadyToDraw ? 'Run Draw' : 'Not Ready'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

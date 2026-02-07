'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Prize {
  position: number
  name: string
  description: string
  prizeAmount: string
  imageUrl: string
}

export default function DrawsAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    entryPrice: '',
    maxEntries: '',
    startDate: '',
    endDate: '',
    drawDate: '',
    firstPrizeImage: '',
  })

  const [prizes, setPrizes] = useState<Prize[]>([
    { position: 1, name: 'First Prize', description: '', prizeAmount: '', imageUrl: '' },
    { position: 2, name: 'Second Prize', description: '', prizeAmount: '', imageUrl: '' },
    { position: 3, name: 'Third Prize', description: '', prizeAmount: '', imageUrl: '' },
  ])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session && session.user.role !== 'ADMIN') {
      router.push('/draws')
    }
  }, [status, session, router])

  const handleFirstPrizeImageFile = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setFormData({ ...formData, firstPrizeImage: String(reader.result || '') })
    }
    reader.readAsDataURL(file)
  }

  const handlePrizeImageFile = (index: number, file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updatePrize(index, 'imageUrl', String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

  const addPrize = () => {
    setPrizes([
      ...prizes,
      { position: prizes.length + 1, name: '', description: '', prizeAmount: '', imageUrl: '' }
    ])
  }

  const removePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index).map((p, i) => ({ ...p, position: i + 1 })))
  }

  const updatePrize = (index: number, field: keyof Prize, value: string) => {
    const updated = [...prizes]
    updated[index] = { ...updated[index], [field]: value }
    setPrizes(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxEntries: formData.maxEntries ? parseInt(formData.maxEntries) : null,
          prizes: prizes.filter(p => p.name.trim() !== '')
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create draw')
      } else {
        setSuccess('Draw created successfully!')
        setFormData({
          title: '',
          description: '',
          entryPrice: '',
          maxEntries: '',
          startDate: '',
          endDate: '',
          drawDate: '',
          firstPrizeImage: '',
        })
        setPrizes([
          { position: 1, name: 'First Prize', description: '', prizeAmount: '', imageUrl: '' },
          { position: 2, name: 'Second Prize', description: '', prizeAmount: '', imageUrl: '' },
          { position: 3, name: 'Third Prize', description: '', prizeAmount: '', imageUrl: '' },
        ])
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-purple-600 hover:text-purple-700">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create Draw</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Draw Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Entry Price (USDT) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="mt-2 text-sm text-gray-800">
                This is the amount required per entry to participate in the draw.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Max Entries (leave empty for unlimited)
            </label>
            <input
              type="number"
              value={formData.maxEntries}
              onChange={(e) => setFormData({ ...formData, maxEntries: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              First Prize Image
            </label>
            <input
              type="url"
              value={formData.firstPrizeImage}
              onChange={(e) => setFormData({ ...formData, firstPrizeImage: e.target.value })}
              placeholder="Paste image URL (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFirstPrizeImageFile(e.target.files?.[0] || null)}
              className="mt-2 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-200 file:text-gray-900 hover:file:bg-gray-300"
            />
            {formData.firstPrizeImage && (
              <img
                src={formData.firstPrizeImage}
                alt="First prize preview"
                className="mt-3 h-24 w-24 rounded-md object-cover border border-gray-200"
              />
            )}
          </div>
        </div>

        {/* Dates */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Start Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                End Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Draw Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.drawDate}
                onChange={(e) => setFormData({ ...formData, drawDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Prizes */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Prizes</h2>
            <button
              type="button"
              onClick={addPrize}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Add Prize
            </button>
          </div>

          <div className="space-y-4">
            {prizes.map((prize, index) => (
              <div key={index} className="border border-gray-300 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">Position {prize.position}</h3>
                  {prizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrize(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Prize Name *
                    </label>
                    <input
                      type="text"
                      value={prize.name}
                      onChange={(e) => updatePrize(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Prize Amount (USDT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={prize.prizeAmount}
                      onChange={(e) => updatePrize(index, 'prizeAmount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={prize.description}
                      onChange={(e) => updatePrize(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Prize Image
                    </label>
                    <input
                      type="url"
                      value={prize.imageUrl}
                      onChange={(e) => updatePrize(index, 'imageUrl', e.target.value)}
                      placeholder="Paste image URL (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePrizeImageFile(index, e.target.files?.[0] || null)}
                      className="mt-2 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-200 file:text-gray-900 hover:file:bg-gray-300"
                    />
                    {prize.imageUrl && (
                      <img
                        src={prize.imageUrl}
                        alt={`Prize ${prize.position} preview`}
                        className="mt-2 h-20 w-20 rounded-md object-cover border border-gray-200"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Draw'}
          </button>
        </div>
      </form>
    </div>
  )
}

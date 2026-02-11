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

interface Draw {
  id: string
  title: string
  description?: string
  entryPrice: string
  maxEntries?: number
  currentEntries: number
  status: string
  drawDate: string
  createdAt: string
  firstPrizeImage?: string
  prizes: Prize[]
}

export default function DrawsAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [draws, setDraws] = useState<Draw[]>([])
  const [editingDraw, setEditingDraw] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    entryPrice: '',
    maxEntries: '',
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
    } else if (session?.user?.role === 'ADMIN') {
      fetchDraws()
    }
  }, [status, session, router])

  const fetchDraws = async () => {
    try {
      const res = await fetch('/api/admin/draws')
      if (res.ok) {
        const data = await res.json()
        setDraws(data)
      }
    } catch (err) {
      console.error('Failed to fetch draws')
    }
  }

  const handleFirstPrizeImageFile = (file: File | null) => {
    if (!file) return
    
    // Check file size (1MB max)
    if (file.size > 1024 * 1024) {
      setError('First prize image must be less than 1MB')
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      setFormData({ ...formData, firstPrizeImage: String(reader.result || '') })
    }
    reader.readAsDataURL(file)
  }

  const handlePrizeImageFile = (index: number, file: File | null) => {
    if (!file) return
    
    // Check file size (1MB max)
    if (file.size > 1024 * 1024) {
      setError(`Prize image must be less than 1MB`)
      return
    }
    
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
      const url = editingDraw ? `/api/draws/${editingDraw}` : '/api/draws'
      const method = editingDraw ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxEntries: formData.maxEntries ? parseInt(formData.maxEntries) : null,
          prizes: prizes
            .filter(p => p.name.trim() !== '')
            .map((p, index) => ({ ...p, position: index + 1 }))
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || `Failed to ${editingDraw ? 'update' : 'create'} draw`)
      } else {
        setSuccess(`Draw ${editingDraw ? 'updated' : 'created'} successfully!`)
        setFormData({
          title: '',
          description: '',
          entryPrice: '',
          maxEntries: '',
          drawDate: '',
          firstPrizeImage: '',
        })
        setPrizes([
          { position: 1, name: 'First Prize', description: '', prizeAmount: '', imageUrl: '' },
          { position: 2, name: 'Second Prize', description: '', prizeAmount: '', imageUrl: '' },
          { position: 3, name: 'Third Prize', description: '', prizeAmount: '', imageUrl: '' },
        ])
        setEditingDraw(null)
        fetchDraws()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (drawId: string) => {
    if (!confirm('Are you sure you want to delete this draw?')) return
    
    setError('')
    setSuccess('')
    
    try {
      const res = await fetch(`/api/draws/${drawId}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Failed to delete draw')
      } else {
        setSuccess('Draw deleted successfully!')
        fetchDraws()
      }
    } catch (err) {
      setError('Failed to delete draw')
    }
  }

  const handleExecuteDraw = async (drawId: string, numberOfWinners: number = 10) => {
    if (!confirm(`Execute draw and select ${numberOfWinners} winners? This cannot be undone.`)) return
    
    setError('')
    setSuccess('')
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/admin/draws/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawId, numberOfWinners })
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Failed to execute draw')
      } else {
        setSuccess(`Draw executed! ${data.totalWinners} winners selected.`)
        fetchDraws()
      }
    } catch (err) {
      setError('Failed to execute draw')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (draw: Draw) => {
    setEditingDraw(draw.id)
    setFormData({
      title: draw.title,
      description: draw.description || '',
      entryPrice: draw.entryPrice,
      maxEntries: draw.maxEntries?.toString() || '',
      drawDate: new Date(draw.drawDate).toISOString().slice(0, 16),
      firstPrizeImage: draw.firstPrizeImage || '',
    })
    setPrizes(draw.prizes.length > 0 ? draw.prizes : [
      { position: 1, name: 'First Prize', description: '', prizeAmount: '', imageUrl: '' },
    ])
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingDraw(null)
    setFormData({
      title: '',
      description: '',
      entryPrice: '',
      maxEntries: '',
      drawDate: '',
      firstPrizeImage: '',
    })
    setPrizes([
      { position: 1, name: 'First Prize', description: '', prizeAmount: '', imageUrl: '' },
      { position: 2, name: 'Second Prize', description: '', prizeAmount: '', imageUrl: '' },
      { position: 3, name: 'Third Prize', description: '', prizeAmount: '', imageUrl: '' },
    ])
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-purple-600 hover:text-purple-700">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-black">{editingDraw ? 'Edit Draw' : 'Create Draw'}</h1>
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

        {/* Draw Date */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule</h2>
          <div className="grid md:grid-cols-1 gap-4">
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
              <p className="text-xs text-gray-600 mt-1">When the draw will take place. Participants can enter immediately after creation until this date.</p>
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

        <div className="flex justify-end gap-3">
          {editingDraw && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
          >
            {isLoading ? (editingDraw ? 'Updating...' : 'Creating...') : (editingDraw ? 'Update Draw' : 'Create Draw')}
          </button>
        </div>
      </form>

      {/* Existing Draws List */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Existing Draws</h2>
        
        {draws.length === 0 ? (
          <div className="text-center text-gray-600 py-8">No draws created yet</div>
        ) : (
          <div className="space-y-4">
            {draws.map((draw) => (
              <div key={draw.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{draw.title}</h3>
                    <p className="text-gray-600 mb-4">{draw.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-600">Entry Price:</span>
                        <div className="font-semibold text-purple-600">{draw.entryPrice} USDT</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Entries:</span>
                        <div className="font-semibold">{draw.currentEntries}{draw.maxEntries ? `/${draw.maxEntries}` : ''}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        <div className={`font-semibold ${
                          draw.status === 'ACTIVE' ? 'text-green-600' :
                          draw.status === 'UPCOMING' ? 'text-blue-600' :
                          draw.status === 'COMPLETED' ? 'text-gray-600' : 'text-yellow-600'
                        }`}>{draw.status}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Draw Date:</span>
                        <div className="font-semibold text-sm">{new Date(draw.drawDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    {draw.prizes.length > 0 && (
                      <div className="mb-4">
                        <span className="text-sm text-gray-600 font-semibold">Prizes:</span>
                        <div className="space-y-1 mt-2">
                          {draw.prizes.slice(0, 3).map((prize) => (
                            <div key={prize.position} className="text-sm">
                              {prize.position}. {prize.name} - {prize.prizeAmount ? `${prize.prizeAmount} USDT` : 'No amount'}
                            </div>
                          ))}
                          {draw.prizes.length > 3 && (
                            <div className="text-xs text-gray-500">+{draw.prizes.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {draw.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleExecuteDraw(draw.id)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                      >
                        Execute Draw
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(draw)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(draw.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
  )
}

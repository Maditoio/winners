'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session && session.user.role !== 'ADMIN') {
      router.push('/draws')
    }
  }, [status, session, router])

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
        <h1 className="text-4xl font-bold text-black mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-12">Manage your draw platform</p>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Draw Management Card */}
        <Link href="/admin/draws">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="text-3xl mb-3">🎯</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Draw Management</h2>
            <p className="text-gray-600 text-sm mb-4">Create new draws and manage entries</p>
            <div className="text-purple-600 font-medium text-sm">Go to Draws →</div>
          </div>
        </Link>

        {/* User Management Card */}
        <Link href="/admin/users">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="text-3xl mb-3">👥</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">User Management</h2>
            <p className="text-gray-600 text-sm mb-4">Manage users and reset passwords</p>
            <div className="text-purple-600 font-medium text-sm">Manage Users →</div>
          </div>
        </Link>

        {/* Withdrawal Management Card */}
        <Link href="/admin/withdrawals">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="text-3xl mb-3">💸</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Withdrawals</h2>
            <p className="text-gray-600 text-sm mb-4">Review and process withdrawal requests</p>
            <div className="text-purple-600 font-medium text-sm">Manage Withdrawals →</div>
          </div>
        </Link>

        {/* Finance Dashboard Card */}
        <Link href="/admin/finance">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-green-200">
            <div className="text-3xl mb-3">💰</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Finance Dashboard</h2>
            <p className="text-gray-600 text-sm mb-4">Income, expenses, withdrawal fees & audits</p>
            <div className="text-green-600 font-medium text-sm">View Finances →</div>
          </div>
        </Link>

        {/* Financial Reports Card */}
        <Link href="/admin/reports">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="text-3xl mb-3">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Draw Reports</h2>
            <p className="text-gray-600 text-sm mb-4">View draw revenue and statistics</p>
            <div className="text-purple-600 font-medium text-sm">View Reports →</div>
          </div>
        </Link>

        {/* Settings Card */}
        <Link href="/admin/settings">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="text-3xl mb-3">⚙️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings</h2>
            <p className="text-gray-600 text-sm mb-4">Configure referral bonus and other settings</p>
            <div className="text-purple-600 font-medium text-sm">Go to Settings →</div>
          </div>
        </Link>
      </div>
      </div>
    </div>
  )
}

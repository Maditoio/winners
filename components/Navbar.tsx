'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isAuthPage = pathname.startsWith('/auth')

  return (
    <>
      {/* Mobile Top Header */}
      {session && !isAuthPage && (
        <div className="md:hidden sticky top-0 z-50 bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg h-14 flex items-center px-4">
          <Link href="/draws" className="flex items-center">
            <span className="text-xl font-bold text-white">🎯 Winner</span>
          </Link>
        </div>
      )}

      {/* Desktop Navbar */}
      <nav className="hidden md:block bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href={session ? "/draws" : "/"} className="flex items-center">
                <span className="text-2xl font-bold text-white">🎯 Winner</span>
              </Link>
              {session && (
                <div className="ml-10 flex space-x-4">
                  <Link
                    href="/draws"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/draws'
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Draws
                  </Link>
                  <Link
                    href="/history"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/history'
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    History
                  </Link>
                  <Link
                    href="/tickets"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/tickets'
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Tickets
                  </Link>
                  <Link
                    href="/profile"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/profile'
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Profile
                  </Link>
                  {session.user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        pathname.startsWith('/admin')
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <span className="text-white text-sm">{session.user.email}</span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-white text-purple-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      {session && !isAuthPage && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg border-t border-white/10">
          <div className="flex justify-around items-center h-16 px-2">
            <Link
              href="/draws"
              className={`flex flex-col items-center justify-center w-full h-full ${
                pathname === '/draws'
                  ? 'bg-white/20 text-white'
                  : 'text-white/80'
              }`}
            >
              <span className="text-xl">🎯</span>
              <span className="text-xs font-medium mt-1">Draws</span>
            </Link>
            <Link
              href="/tickets"
              className={`flex flex-col items-center justify-center w-full h-full ${
                pathname === '/tickets'
                  ? 'bg-white/20 text-white'
                  : 'text-white/80'
              }`}
            >
              <span className="text-xl">🎟️</span>
              <span className="text-xs font-medium mt-1">Tickets</span>
            </Link>
            <Link
              href="/history"
              className={`flex flex-col items-center justify-center w-full h-full ${
                pathname === '/history'
                  ? 'bg-white/20 text-white'
                  : 'text-white/80'
              }`}
            >
              <span className="text-xl">📋</span>
              <span className="text-xs font-medium mt-1">History</span>
            </Link>
            <Link
              href="/profile"
              className={`flex flex-col items-center justify-center w-full h-full ${
                pathname === '/profile'
                  ? 'bg-white/20 text-white'
                  : 'text-white/80'
              }`}
            >
              <span className="text-xl">👤</span>
              <span className="text-xs font-medium mt-1">Profile</span>
            </Link>
            {session.user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className={`flex flex-col items-center justify-center w-full h-full ${
                  pathname.startsWith('/admin')
                    ? 'bg-white/20 text-white'
                    : 'text-white/80'
                }`}
              >
                <span className="text-xl">⚙️</span>
                <span className="text-xs font-medium mt-1">Admin</span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  )
}

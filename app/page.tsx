'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 md:mb-6">
              Win Big with Crypto Draws
            </h1>
            <p className="text-lg md:text-xl mb-6 md:mb-8 text-white/90">
              Enter draws with USDT, win amazing prizes, and refer friends to earn bonuses
            </p>
            {session ? (
              <Link
                href="/draws"
                className="bg-white text-purple-600 hover:bg-gray-100 px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold text-base md:text-lg transition-colors inline-block"
              >
                Go to Draws
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  href="/auth/signup"
                  className="bg-white text-purple-600 hover:bg-gray-100 px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold text-base md:text-lg transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  href="/draws"
                  className="bg-white/20 hover:bg-white/30 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold text-base md:text-lg transition-colors"
                >
                  View Draws
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-900">
            Why Choose Winner?
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Multiple Draws</h3>
              <p className="text-sm md:text-base text-gray-600">
                Participate in various draws with different prize pools and entry prices
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Crypto Payments</h3>
              <p className="text-sm md:text-base text-gray-600">
                Easy deposits with USDT to your unique crypto wallet address
              </p>
            </div>
            <div className="text-center p-6 sm:col-span-2 md:col-span-1">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎁</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Referral Rewards</h3>
              <p className="text-sm md:text-base text-gray-600">
                Earn bonuses when your friends sign up and start playing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-900">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2 text-sm md:text-base">Sign Up</h3>
              <p className="text-xs md:text-sm text-gray-600">Create your account and get your unique crypto wallet</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2 text-sm md:text-base">Deposit USDT</h3>
              <p className="text-xs md:text-sm text-gray-600">Send USDT to your wallet address to fund your account</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2 text-sm md:text-base">Enter Draws</h3>
              <p className="text-xs md:text-sm text-gray-600">Choose draws and purchase entries with your balance</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2 text-sm md:text-base">Win Prizes</h3>
              <p className="text-xs md:text-sm text-gray-600">Wait for the draw and check if you're a winner!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Algorithm Section */}
      <div className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-900">
            🔐 Fair & Secure Draws
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-12">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Fisher-Yates Shuffle Algorithm</h3>
              <p className="text-sm md:text-base text-gray-700 mb-4">
                Every draw on Winner uses the <span className="font-semibold">Fisher-Yates Shuffle Algorithm</span>, the industry-standard cryptographic randomization method trusted by lotteries worldwide.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                  <span className="text-2xl shrink-0">🔒</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">Cryptographically Secure</h4>
                    <p className="text-xs md:text-sm text-gray-600">Uses crypto.randomBytes for unpredictable random number generation</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <span className="text-2xl shrink-0">⚖️</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">One Winner Per User</h4>
                    <p className="text-xs md:text-sm text-gray-600">Even if you have multiple tickets, only 1 can win per draw</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <span className="text-2xl shrink-0">⏰</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">Timestamped Results</h4>
                    <p className="text-xs md:text-sm text-gray-600">All draws record exact timestamp of execution for full transparency</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <span className="text-2xl shrink-0">✅</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">Publicly Verifiable</h4>
                    <p className="text-xs md:text-sm text-gray-600">Winners list is published immediately with full ticket numbers and prizes</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 md:p-8">
              <h4 className="font-bold text-base md:text-lg text-gray-900 mb-4">How the Algorithm Works</h4>
              <div className="space-y-2 text-xs md:text-sm text-gray-700 font-mono bg-white rounded p-4 overflow-auto">
                <div><span className="text-purple-600">1.</span> Collect all participant tickets</div>
                <div><span className="text-purple-600">2.</span> Generate cryptographic random indices</div>
                <div><span className="text-purple-600">3.</span> Shuffle tickets using Fisher-Yates</div>
                <div><span className="text-purple-600">4.</span> Select top N unique winners</div>
                <div><span className="text-purple-600">5.</span> Award prizes instantly</div>
                <div><span className="text-purple-600">6.</span> Publish results with timestamp</div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-purple-200">
                <p className="text-xs text-gray-600 mb-2"><strong>Why This Method?</strong></p>
                <p className="text-xs text-gray-600">
                  The Fisher-Yates algorithm is used by professional lottery organizations because it provides:
                </p>
                <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>Uniform distribution (every ticket has equal chance)</li>
                  <li>Impossible to predict outcomes</li>
                  <li>Zero bias toward any participant</li>
                  <li>Auditable and transparent</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

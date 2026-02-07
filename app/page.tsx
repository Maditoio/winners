import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Win Big with Crypto Draws
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Enter draws with USDT, win amazing prizes, and refer friends to earn bonuses
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/draws"
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
              >
                View Draws
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Choose Winner?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple Draws</h3>
              <p className="text-gray-600">
                Participate in various draws with different prize pools and entry prices
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Crypto Payments</h3>
              <p className="text-gray-600">
                Easy deposits with USDT to your unique crypto wallet address
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎁</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Referral Rewards</h3>
              <p className="text-gray-600">
                Earn bonuses when your friends sign up and start playing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Sign Up</h3>
              <p className="text-sm text-gray-600">Create your account and get your unique crypto wallet</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Deposit USDT</h3>
              <p className="text-sm text-gray-600">Send USDT to your wallet address to fund your account</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Enter Draws</h3>
              <p className="text-sm text-gray-600">Choose draws and purchase entries with your balance</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Win Prizes</h3>
              <p className="text-sm text-gray-600">Wait for the draw and check if you're a winner!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

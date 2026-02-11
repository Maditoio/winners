'use client'

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link href="/" className="text-purple-600 hover:text-purple-700">
            ← Back to home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
          <p className="text-sm text-gray-600">Last updated: February 11, 2026</p>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">1. Eligibility</h2>
            <p className="text-gray-700">
              You must be at least 18 years old to create an account or use this service.
              By registering, you confirm that you meet this requirement.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">2. Account Responsibility</h2>
            <p className="text-gray-700">
              You are responsible for maintaining the confidentiality of your login credentials
              and for all activity that occurs under your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">3. Deposits and Withdrawals</h2>
            <p className="text-gray-700">
              Deposits and withdrawals are processed through supported crypto networks and providers.
              Transaction processing times depend on network conditions and third-party services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">4. Draw Participation</h2>
            <p className="text-gray-700">
              Participation in draws is subject to available balance, entry limits, and draw status.
              Entries are final once submitted and may not be reversed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">5. Prohibited Use</h2>
            <p className="text-gray-700">
              You agree not to misuse the service, attempt unauthorized access, or interfere with
              platform operations or security.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">6. Changes to Terms</h2>
            <p className="text-gray-700">
              We may update these terms from time to time. Continued use of the service after changes
              means you accept the updated terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">7. Contact</h2>
            <p className="text-gray-700">
              For questions about these terms, please contact support through the website.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

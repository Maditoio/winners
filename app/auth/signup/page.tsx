'use client'

import { Suspense } from 'react'
import SignUpForm from './signup-form'

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  )
}

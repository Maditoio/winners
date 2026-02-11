import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateCryptoAddress } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      )
    }

    const { email, password, name, referralCode, dateOfBirth, termsAccepted } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!dateOfBirth) {
      return NextResponse.json(
        { error: 'Date of birth is required' },
        { status: 400 }
      )
    }

    const dob = new Date(dateOfBirth)
    if (Number.isNaN(dob.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date of birth' },
        { status: 400 }
      )
    }

    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1
    }

    if (age < 18) {
      return NextResponse.json(
        { error: 'You must be at least 18 years old to register' },
        { status: 400 }
      )
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'Terms and Conditions must be accepted' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Find referrer if referral code provided
    let referrerId = null
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      })
      if (referrer) {
        referrerId = referrer.id
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        referredBy: referrerId,
        dateOfBirth: dob,
        termsAcceptedAt: new Date(),
      }
    })

    // Generate crypto address and create wallet
    const cryptoAddress = await generateCryptoAddress(user.id)
    await prisma.wallet.create({
      data: {
        userId: user.id,
        cryptoAddress,
        balance: 0
      }
    })

    // Referral bonus is awarded after the referred user makes a confirmed deposit

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        referralCode: user.referralCode
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

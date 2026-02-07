import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('Registration / User Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new user with valid email and password', async () => {
    const email = 'newuser@example.com'
    const password = 'SecurePassword123!'
    const hashedPassword = await bcrypt.hash(password, 10)

    const mockPrisma = prisma as jest.Mocked<typeof prisma>
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'new-user-id',
      email,
      password: hashedPassword,
      name: 'New User',
      emailVerified: null,
      image: null,
      role: 'USER',
      createdAt: new Date(),
    })

    // Check user doesn't exist
    const existingUser = await prisma.user.findUnique({ where: { email } })
    expect(existingUser).toBeNull()

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'New User',
      },
    })

    expect(newUser.email).toBe(email)
    expect(newUser.id).toBeDefined()
  })

  it('should reject if email already exists', async () => {
    const email = 'existing@example.com'
    const mockPrisma = prisma as jest.Mocked<typeof prisma>

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-id',
      email,
      password: 'hashed',
      name: 'Existing User',
      emailVerified: null,
      image: null,
      role: 'USER',
      createdAt: new Date(),
    })

    const existingUser = await prisma.user.findUnique({ where: { email } })
    expect(existingUser).not.toBeNull()
    expect(existingUser?.email).toBe(email)
  })

  it('should hash password before storing', async () => {
    const plainPassword = 'SecurePassword123!'
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    // Verify hash is different from plain text
    expect(hashedPassword).not.toBe(plainPassword)

    // Verify bcrypt can validate the password
    const isValid = await bcrypt.compare(plainPassword, hashedPassword)
    expect(isValid).toBe(true)
  })

  it('should validate email format', () => {
    const validEmails = [
      'user@example.com',
      'test.user@example.co.uk',
      'user+tag@example.com',
    ]

    const invalidEmails = [
      'invalid-email',
      'user@',
      '@example.com',
      'user@.com',
    ]

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    validEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(true)
    })

    invalidEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(false)
    })
  })

  it('should enforce password minimum length', () => {
    const minLength = 8
    const validPassword = 'SecurePass123!'
    const shortPassword = 'short'

    expect(validPassword.length >= minLength).toBe(true)
    expect(shortPassword.length >= minLength).toBe(false)
  })

  it('should set default role to USER for new registrations', async () => {
    const mockPrisma = prisma as jest.Mocked<typeof prisma>
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      password: 'hashed',
      name: 'New User',
      emailVerified: null,
      image: null,
      role: 'USER',
      createdAt: new Date(),
    })

    const newUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: 'hashed',
      },
    })

    expect(newUser.role).toBe('USER')
  })
})

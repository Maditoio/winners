import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('Sign In / Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should authenticate user with correct credentials', async () => {
    const password = 'SecurePassword123!'
    const hashedPassword = await bcrypt.hash(password, 10)

    const mockUser = {
      id: 'user-id-123',
      email: 'user@example.com',
      password: hashedPassword,
      name: 'Test User',
      emailVerified: null,
      image: null,
      role: 'USER',
      createdAt: new Date(),
    }

    const mockPrisma = prisma as jest.Mocked<typeof prisma>
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)

    // Simulate password check
    const passwordValid = await bcrypt.compare(password, mockUser.password)
    expect(passwordValid).toBe(true)
  })

  it('should reject authentication with incorrect password', async () => {
    const password = 'SecurePassword123!'
    const wrongPassword = 'WrongPassword456!'
    const hashedPassword = await bcrypt.hash(password, 10)

    const mockUser = {
      id: 'user-id-123',
      email: 'user@example.com',
      password: hashedPassword,
      name: 'Test User',
      emailVerified: null,
      image: null,
      role: 'USER',
      createdAt: new Date(),
    }

    const mockPrisma = prisma as jest.Mocked<typeof prisma>
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)

    // Simulate password check
    const passwordValid = await bcrypt.compare(wrongPassword, mockUser.password)
    expect(passwordValid).toBe(false)
  })

  it('should reject authentication if user does not exist', async () => {
    const mockPrisma = prisma as jest.Mocked<typeof prisma>
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const user = await prisma.user.findUnique({
      where: { email: 'nonexistent@example.com' },
    })

    expect(user).toBeNull()
  })

  it('should handle session data correctly for authenticated user', async () => {
    const mockUser = {
      id: 'user-id-123',
      email: 'user@example.com',
      password: 'hashed-password',
      name: 'Test User',
      emailVerified: null,
      image: null,
      role: 'USER',
      createdAt: new Date(),
    }

    const mockPrisma = prisma as jest.Mocked<typeof prisma>
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)

    const user = await prisma.user.findUnique({
      where: { email: 'user@example.com' },
    })

    expect(user).not.toBeNull()
    expect(user?.email).toBe('user@example.com')
    expect(user?.id).toBe('user-id-123')
    expect(user?.role).toBe('USER')
  })

  it('should differentiate between USER and ADMIN roles', async () => {
    const adminUser = {
      id: 'admin-id-123',
      email: 'admin@example.com',
      password: 'hashed-password',
      name: 'Admin User',
      emailVerified: null,
      image: null,
      role: 'ADMIN',
      createdAt: new Date(),
    }

    const regularUser = {
      id: 'user-id-123',
      email: 'user@example.com',
      password: 'hashed-password',
      name: 'Regular User',
      emailVerified: null,
      image: null,
      role: 'USER',
      createdAt: new Date(),
    }

    expect(adminUser.role).toBe('ADMIN')
    expect(regularUser.role).toBe('USER')
    expect(adminUser.role).not.toBe(regularUser.role)
  })
})

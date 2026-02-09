import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/auth/signin'
  }
})

export const config = {
  matcher: ['/draws/:path*', '/profile/:path*', '/admin/:path*', '/history/:path*']
}

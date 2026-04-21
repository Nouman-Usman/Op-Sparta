import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, supabase } = await updateSession(request)
  
  if (!supabase) return response

  const { data: { user } } = await supabase.auth.getUser()

  // Protect routes under (dashboard)
  // Since they are in a group, we check if they are NOT /login or /
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isLandingPage = request.nextUrl.pathname === '/'
  const isPublicFile = request.nextUrl.pathname.includes('.')

  if (!user && !isAuthPage && !isLandingPage && !isPublicFile) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

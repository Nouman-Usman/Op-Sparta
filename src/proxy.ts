import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { supabaseResponse, supabase } = await updateSession(request)
  
  if (!supabase) return supabaseResponse

  const { data: { user } } = await supabase.auth.getUser()

  // Protect routes under (dashboard)
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isLandingPage = request.nextUrl.pathname === '/'
  const isPublicFile = request.nextUrl.pathname.includes('.')

  if (!user && !isAuthPage && !isLandingPage && !isPublicFile) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

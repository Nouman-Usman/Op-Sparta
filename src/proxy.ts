import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { supabaseResponse, supabase } = await updateSession(request)
  
  if (!supabase) return supabaseResponse

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Define public (unauthenticated) routes mathematically
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/cron') ||
    pathname.includes('.')  // static files

  // If logged in and hitting login page, redirect to dashboard
  if (user && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/overview', request.url))
  }

  // If not logged in and hitting a protected route, redirect to login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

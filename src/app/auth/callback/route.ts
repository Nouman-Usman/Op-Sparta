import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { users } from '@/db/schema'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/overview'

  if (code) {
    const supabase = await createClient()
    if (!supabase) return NextResponse.redirect(`${origin}/auth/auth-code-error`)

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Read the username the user typed during signup — stored in user_metadata
      const chosenUsername = data.user.user_metadata?.full_name ?? null;

      // Upsert the user into our public users table with their chosen username
      await db.insert(users)
        .values({
          id: data.user.id,
          fullName: chosenUsername,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: { fullName: chosenUsername }
        });

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

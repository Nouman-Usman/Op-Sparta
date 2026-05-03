import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { users } from '@/db/schema'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? 'overview'
  
  // Ensure 'next' starts with a slash if it's a path
  const nextPath = next.startsWith('/') ? next : `/${next}`

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

      return NextResponse.redirect(`${origin}${nextPath}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

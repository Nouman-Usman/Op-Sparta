import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { getURL } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? 'overview'
  
  // Remove leading slash if present to avoid double slashes with getURL()
  if (next.startsWith('/')) {
    next = next.substring(1);
  }

  if (code) {
    const supabase = await createClient()
    if (!supabase) return NextResponse.redirect(`${getURL()}auth/auth-code-error`)

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

      return NextResponse.redirect(`${getURL()}${next}`)
    }
  }

  return NextResponse.redirect(`${getURL()}auth/auth-code-error`)
}

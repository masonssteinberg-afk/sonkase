import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(`${origin}/profile`)
  }

  if (token_hash && type) {
    return NextResponse.redirect(`${origin}/profile#token_hash=${token_hash}&type=${type}`)
  }

  return NextResponse.redirect(`${origin}/profile`)
}

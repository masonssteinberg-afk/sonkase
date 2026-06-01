import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type')
  const next       = searchParams.get('next') || '/profile'

  if (code) {
    // Pass code to the client page — browser-side exchangeCodeForSession stores session in localStorage
    return NextResponse.redirect(`${origin}${next}?code=${encodeURIComponent(code)}`)
  }

  if (token_hash && type) {
    return NextResponse.redirect(`${origin}${next}?token_hash=${encodeURIComponent(token_hash)}&type=${encodeURIComponent(type)}`)
  }

  return NextResponse.redirect(`${origin}/profile`)
}

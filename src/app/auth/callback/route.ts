import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') ?? '/mentor';

  // Simply redirect to the next page - let the client-side handle the session
  // Supabase will automatically handle the OAuth callback and session creation
  return NextResponse.redirect(`${origin}${next}`);
} 
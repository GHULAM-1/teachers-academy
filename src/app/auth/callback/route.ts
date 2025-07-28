import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/mentor';

  if (code) {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Code exchange error:', error);
        return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
      }

      if (data.session) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.redirect(`${origin}/auth?error=Authentication failed`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`);
} 
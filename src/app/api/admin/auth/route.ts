import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS and check admin table
    const adminClient = createAdminSupabaseClient();
    
    // Check if admin exists with provided credentials
    const { data: admin, error } = await adminClient
      .from('admin')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Only create Supabase session if admin credentials are verified
    try {
      // Check if admin user already exists in Supabase auth
      const { data: existingUser, error: userError } = await adminClient.auth.admin.listUsers();
      
      let adminUser = null;
      if (!userError && existingUser.users) {
        adminUser = existingUser.users.find(user => user.email === admin.email);
      }

      if (!adminUser) {
        // Create admin user in Supabase auth only if credentials are verified
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: admin.email,
          password: password, // Use the actual admin password
          email_confirm: true,
          user_metadata: {
            role: 'admin',
            admin_id: admin.id
          }
        });

        if (authError && !authError.message.includes('already registered')) {
          throw authError;
        }

        adminUser = authData.user;
      }

      // Sign in the admin user to create a proper Supabase session
      const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
        email: admin.email,
        password: password // Use the actual admin password
      });

      if (signInError) {
        // If sign in fails, try to create a session manually
        const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
          type: 'magiclink',
          email: admin.email,
          options: {
            redirectTo: `${request.nextUrl.origin}/auth/callback`
          }
        });

        if (sessionError) {
          throw sessionError;
        }

        return NextResponse.json({
          success: true,
          user: {
            id: `admin_${admin.id}`,
            email: admin.email,
            role: 'admin',
            admin_id: admin.id
          }
        });
      }

      return NextResponse.json({
        success: true,
        session: signInData.session,
        user: signInData.user
      });

    } catch (error: any) {
      console.error('Admin auth error:', error);
      return NextResponse.json(
        { error: 'Failed to create admin session' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
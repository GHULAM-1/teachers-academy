import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { generateId } from 'ai';

/**
 * Auto-redirect from /mentor to /mentor/chat/[chatId]
 * Creates a new chat and redirects immediately
 */
export default async function MentorPage() {
  // Get server-side authentication
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth');
    return;
  }

  // Create new chat with admin client (bypasses RLS)
  const id = generateId();
  const adminClient = createAdminSupabaseClient();
  
  const { data, error } = await adminClient
    .from('chats')
    .insert({
      id,
      user_id: user.id,
      title: null,
      saved: false, // New chats are not saved by default
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create chat:', error);
    // If creation fails, redirect to a fallback or show error
    redirect('/mentor/chat'); // This will handle the error case
    return;
  }
  
  // Redirect to the new chat
  redirect(`/mentor/chat/${id}`);
}

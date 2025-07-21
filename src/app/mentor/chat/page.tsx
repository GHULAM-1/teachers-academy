import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { generateId } from 'ai';

/**
 * Following AI SDK pattern: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
 * When user navigates to /mentor/chat without ID, create new chat and redirect
 */
export default async function Page() {
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create chat:', error);
    redirect('/mentor'); // Redirect back to mentor page on error
    return;
  }
  redirect(`/mentor/chat/${id}`); // redirect to new chat
} 
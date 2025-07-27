import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  let chatId;
  try {
    chatId = (await req.json()).chatId;
  } catch (error) {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!chatId) {
    return new Response('Chat ID is required', { status: 400 });
  }

  const adminClient = createAdminSupabaseClient();

  try {
    console.log(`💾 Marking career chat ${chatId} as saved for user ${user.id}`);
    
    // First, let's check if the chat exists and get its current state
    const { data: existingChat, error: checkError } = await adminClient
      .from('career_chats')
      .select('id, user_id, saved')
      .eq('id', chatId)
      .single();
    
    if (checkError) {
      console.error('Error checking career chat:', checkError);
      return new Response('Career chat not found', { status: 404 });
    }
    
    console.log(`🔍 Found career chat:`, existingChat);
    
    const { error } = await adminClient
      .from('career_chats')
      .update({
        saved: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking career chat as saved:', error);
      return new Response('Failed to mark career chat as saved', { status: 500 });
    }

    console.log(`✅ Successfully marked career chat ${chatId} as saved`);
    return new Response(JSON.stringify({ success: true, message: 'Career chat saved successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Unexpected error marking career chat as saved:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 
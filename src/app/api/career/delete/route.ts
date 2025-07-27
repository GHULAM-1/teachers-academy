import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function DELETE(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) { return new Response('Unauthorized', { status: 401 }); }

  let chatId;
  try { chatId = (await req.json()).chatId; } catch (error) { return new Response('Invalid JSON', { status: 400 }); }
  if (!chatId) { return new Response('Chat ID is required', { status: 400 }); }

  const adminClient = createAdminSupabaseClient();
  try {
    console.log(`🗑️ Deleting career chat ${chatId} for user ${user.id}`);
    const { error: messagesError } = await adminClient.from('career_messages').delete().eq('chat_id', chatId).eq('user_id', user.id);
    if (messagesError) { console.error('Error deleting career messages:', messagesError); return new Response('Failed to delete career messages', { status: 500 }); }
    const { error: chatError } = await adminClient.from('career_chats').delete().eq('id', chatId).eq('user_id', user.id);
    if (chatError) { console.error('Error deleting career chat:', chatError); return new Response('Failed to delete career chat', { status: 500 }); }
    console.log(`✅ Successfully deleted career chat ${chatId} and all its messages`);
    return new Response(JSON.stringify({ success: true, message: 'Career chat deleted successfully' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Unexpected error deleting career chat:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 
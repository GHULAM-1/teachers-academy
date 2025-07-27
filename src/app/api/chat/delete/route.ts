import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function DELETE(req: Request) {
  // Check authentication
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  let chatId;
  
  try {
    const body = await req.json();
    chatId = body.chatId;
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return new Response('Invalid JSON in request body', { status: 400 });
  }

  if (!chatId) {
    return new Response('Chat ID is required', { status: 400 });
  }

  const adminClient = createAdminSupabaseClient();

  try {
    console.log(`🗑️ Deleting chat ${chatId} for user ${user.id}`);

    // First delete all messages for this chat
    const { error: messagesError } = await adminClient
      .from('messages')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', user.id);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return new Response('Failed to delete messages', { status: 500 });
    }

    // Then delete the chat itself
    const { error: chatError } = await adminClient
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', user.id);

    if (chatError) {
      console.error('Error deleting chat:', chatError);
      return new Response('Failed to delete chat', { status: 500 });
    }

    console.log(`✅ Successfully deleted chat ${chatId} and all its messages`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Chat deleted successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error deleting chat:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 
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
    console.log(`💾 Marking chat ${chatId} as saved for user ${user.id}`);
    
    const { error } = await adminClient
      .from('chats')
      .update({ 
        saved: true,
        updated_at: new Date().toISOString() 
      })
      .eq('id', chatId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking chat as saved:', error);
      return new Response('Failed to mark chat as saved', { status: 500 });
    }

    console.log(`✅ Successfully marked chat ${chatId} as saved`);
    return new Response(JSON.stringify({ success: true, message: 'Chat saved successfully' }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Unexpected error marking chat as saved:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 
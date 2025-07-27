import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('Chat ID is required', { status: 400 });
  }

  try {
    const adminClient = createAdminSupabaseClient();
    
    // Get the last AI message from database to check its step
    const { data: lastAIMessage, error } = await adminClient
      .from('career_messages')
      .select('step, content, role')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching last AI message:', error);
      return new Response('Error fetching step information', { status: 500 });
    }

    const currentStep = lastAIMessage?.step || 'discover';
    
    console.log(`🔍 Check step API: chat ${chatId} current step is ${currentStep}`);
    
    return new Response(JSON.stringify({ currentStep }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in check-step API:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 
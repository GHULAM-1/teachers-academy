import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Message } from 'ai';
import Mentor from '@/components/mentor/mentor';

/**
 * Following AI SDK pattern: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
 * Loads existing chat and displays it at /mentor/chat/[chatid]
 */
export default async function Page(props: { 
  params: Promise<{ chatid: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { chatid } = await props.params; // get the chat ID from the URL
  const { mode } = await props.searchParams; // get the mode from URL params
  const stuckMode = mode === 'stuck';
  
  // Get server-side authentication
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth');
    return;
  }
  
  try {
    // Use admin client for database operations (bypasses RLS)
    const adminClient = createAdminSupabaseClient();
    
    // First check if the chat belongs to the current user
    const { data: chatData, error: chatError } = await adminClient
      .from('chats')
      .select('id')
      .eq('id', chatid)
      .eq('user_id', user.id)
      .single();

    if (chatError || !chatData) {
      throw new Error('Chat not found or access denied');
    }

    // Load messages for the chat
    const { data, error } = await adminClient
      .from('messages')
      .select('*')
      .eq('chat_id', chatid)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to load chat: ${error.message}`);
    }

    // Convert database format to AI SDK Message format
    const messages: Message[] = (data || []).map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      createdAt: new Date(msg.created_at)
    }));

    return <Mentor chatId={chatid} initialMessages={messages} stuckMode={stuckMode} />; // display the chat with smart resume
  } catch (error) {
    console.error('Error loading chat:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Chat Not Found</h1>
          <p className="text-gray-600 mb-4">The chat you're looking for doesn't exist.</p>
          <a 
            href="/mentor/chat" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Start New Chat
          </a>
        </div>
      </div>
    );
  }
} 
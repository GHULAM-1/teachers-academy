import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Message } from 'ai';
import { generateId } from 'ai';
import CareerChat from "@/components/career/career-chat";
import ApplyDashboard from "@/components/career/apply-dashboard";

const VALID_STEPS = ['discover', 'commit', 'create', 'apply']; // Include commit but handle it specially

/**
 * Career chat page that loads messages server-side like AI mentor
 */
export default async function CareerChatPage(props: { 
  params: Promise<{ step: string }>,
  searchParams: Promise<{ chatId?: string }>
}) {
  const { step } = await props.params;
  const { chatId } = await props.searchParams;
  
  // Validate step parameter
  if (!step || !VALID_STEPS.includes(step)) {
    redirect('/career-change');
    return;
  }
  
  // Get server-side authentication
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth');
    return;
  }
  
  try {
    // Use admin client for database operations
    const adminClient = createAdminSupabaseClient();
    
    let messages: Message[] = [];
    let currentStep = step;
    let finalChatId: string;
    
    if (chatId) {
      finalChatId = chatId;
      
      // Load existing chat messages
      const { data, error } = await adminClient
        .from('career_messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading career chat messages:', error);
        // Don't throw error if no messages found - chat might be new
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw new Error(`Failed to load career chat: ${error.message}`);
        }
      }

      // Convert to AI SDK format - load all messages, let frontend handle step filtering
      messages = (data || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        createdAt: new Date(msg.created_at),
        step: msg.step // Include step for frontend detection
      }));
      
      // Let frontend handle step detection and transitions
      // No server-side redirects needed
    } else {
      console.log("🔄 No chat ID provided, generating a new one");
      // Generate a new chat ID for new chats (but don't create the record yet)
      // The API route will create the record when the first message is sent
      finalChatId = generateId();
    }

    // Show Apply Dashboard for apply step, otherwise show Career Chat
    if (currentStep === 'apply') {
      return <ApplyDashboard />;
    }
    
    return <CareerChat chatId={finalChatId} initialStep={currentStep} initialMessages={messages} />;
    
  } catch (error) {
    console.error('Error loading career chat:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Career Chat Not Found</h1>
          <p className="text-gray-600 mb-4">The career chat you're looking for doesn't exist.</p>
          <a 
            href="/career-change" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Start New Career Journey
          </a>
        </div>
      </div>
    );
  }
} 
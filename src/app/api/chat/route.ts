import { openai } from '@ai-sdk/openai';
import { TransformStream } from 'stream/web';
import { streamText, appendResponseMessages } from 'ai';
import { Message } from 'ai';
import { saveChat, updateChatTitle, saveChatWithUser, updateChatTitleWithUser } from '@/lib/chat-store';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { MentorConfigService } from '@/lib/mentor-config';
import { cookies } from 'next/headers';
import dotenv from 'dotenv';

dotenv.config();

export async function POST(req: Request) {
  console.log('🚀 Chat API called at:', new Date().toISOString());
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    return new Response('OpenAI API key not configured', { status: 500 });
  }

  // Check authentication
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  let messages, id;
  
  try {
    const body = await req.json();
    messages = body.messages;
    id = body.id;
    console.log('📨 API received:', { 
      chatId: id?.substring(0, 8) + '...',
      messagesCount: messages?.length,
      firstMessage: messages?.[0]?.content?.substring(0, 30) + '...'
    });
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return new Response('Invalid JSON in request body', { status: 400 });
  }

  // Validate chat ID
  if (!id) {
    return new Response('Chat ID is required', { status: 400 });
  }

  // Validate messages
  if (!messages || !Array.isArray(messages)) {
    return new Response('Messages array is required', { status: 400 });
  }

  // Count user messages to help AI track progress
  const userMessageCount = messages.filter((m, i) => {
    if (m.role !== "user") return false;
    // Skip the initial trigger messages
    if (i === 0 && (!m.content || m.content.trim() === "" || m.content.trim() === "start" || m.content.trim() === "begin")) return false;
    return m.content && m.content.trim() !== "";
  }).length;

  console.log(`🔢 API user message count: ${userMessageCount}`);

  // Ensure chat exists before proceeding
  const adminClient = createAdminSupabaseClient();
  const { data: existingChat, error: chatCheckError } = await adminClient
    .from('chats')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (chatCheckError && chatCheckError.code === 'PGRST116') {
    // Chat doesn't exist, but don't create it here - let the frontend handle chat creation
    console.log(`🚫 Chat ${id} doesn't exist, but not creating it in API`);
    return new Response('Chat not found', { status: 404 });
  } else if (chatCheckError && chatCheckError.code !== 'PGRST116') {
    // Some other error occurred during chat check
    console.error('Error checking chat existence:', chatCheckError);
    return new Response('Error checking chat', { status: 500 });
  }

  // Fetch user profile information (simplified)
  const { data: profile } = await adminClient
    .from('profiles')
    .select('preferred_name, role_title, career_goals, biggest_obstacle')
    .eq('id', user.id)
    .single();

  try {
    // Get config from SheetDB
    const configService = MentorConfigService.getInstance();
    const config = await configService.getConfig();

    // Replace placeholders in the prompt
    const systemPrompt = config.mainFlowPrompt
      .replace(/{{preferred_name}}/g, profile?.preferred_name || 'there')
      .replace(/{{role_title}}/g, profile?.role_title || 'Not specified')
      .replace(/{{career_goals}}/g, profile?.career_goals || 'Not specified')
      .replace(/{{biggest_obstacle}}/g, profile?.biggest_obstacle || 'Not specified')
      .replace(/{{user_message_count}}/g, userMessageCount.toString());

    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
      system: systemPrompt,
    async onFinish({ response }) {
      try {
        // Get the latest timestamp from existing messages to ensure proper sequencing
        const latestTimestamp = messages.length > 0 
          ? Math.max(...messages.map(m => m.createdAt ? new Date(m.createdAt).getTime() : 0))
          : Date.now();
        
        // Create new messages with sequential timestamps and extract plain text
        const newMessages = response.messages.map((msg, index) => {
          // Extract plain text from message content
          let plainText = msg.content;
          
          // Handle array format: [{"type": "text", "text": "..."}]
          if (Array.isArray(msg.content)) {
            plainText = msg.content
              .filter(item => item.type === 'text')
              .map(item => item.text)
              .join('');
          }
          // Handle string format that might be JSON
          else if (typeof msg.content === 'string' && msg.content.startsWith('[')) {
            try {
              const parsed = JSON.parse(msg.content);
              if (Array.isArray(parsed)) {
                plainText = parsed
                  .filter(item => item.type === 'text')
                  .map(item => item.text)
                  .join('');
              }
            } catch (e) {
              // If parsing fails, keep original content
              plainText = msg.content;
            }
          }
          
          return {
            ...msg,
            content: plainText, // Use extracted plain text
            createdAt: new Date(latestTimestamp + (index + 1) * 1000) // Each new message gets a timestamp 1 second later
          };
        });
        
        // Get the user's message (the last message in the input array)
        const userMessage = messages[messages.length - 1];
        
        // Create proper sequential timestamps for chronological order
        const baseTime = Date.now();
        let messageIndex = 0;
        
        // Convert response messages to the correct Message format with proper timestamps
        const aiMessagesToSave = newMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(baseTime + (messageIndex++ * 1000)) // Each message gets a timestamp 1 second later
        })) as Message[];
        
        // Only save user message if it's not a trigger message
        const messagesToSave = [];
        
        // Add user message if it's not a trigger message (with timestamp BEFORE AI response)
        if (userMessage && 
            userMessage.role === 'user' && 
            userMessage.content && 
            userMessage.content.trim() !== '' && 
            userMessage.content.trim() !== 'begin' && 
            userMessage.content.trim() !== 'start') {
          messagesToSave.push({
            id: userMessage.id,
            role: userMessage.role,
            content: userMessage.content,
            createdAt: new Date(baseTime - 1000) // User message comes 1 second BEFORE AI response
          });
        }
        
        // Add AI messages
        messagesToSave.push(...aiMessagesToSave);
        
        const allMessagesToSave = messagesToSave as Message[];
        
        await saveChatWithUser({
          id,
          userId: user.id,
          messages: allMessagesToSave,
            supabaseClient: adminClient,
        });

        if (messages.length === 1 && messages[0].role === 'user') {
            const title = "AI Mentor Session";
            console.log("Setting title:", title);
          await updateChatTitleWithUser(id, title, user.id, adminClient);
        }
      } catch (error) {
        console.error('Error saving chat:', error);
      }
    },
  });

    console.log("Stream result created successfully");
  return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('🚨 StreamText error:', error);
    return new Response(JSON.stringify({
      error: 'StreamText failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

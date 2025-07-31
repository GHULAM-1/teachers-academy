import { openai } from '@ai-sdk/openai';
import { TransformStream } from 'stream/web';
import { streamText, appendResponseMessages } from 'ai';
import { saveChat, updateChatTitle, saveChatWithUser, updateChatTitleWithUser } from '@/lib/chat-store';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import dotenv from 'dotenv';

dotenv.config();

export async function POST(req: Request) {
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

  // Count user messages to determine if it's the initial stuck message
  const userMessageCount = messages.filter(msg => msg.role === 'user').length;
  console.log(`🔢 API user message count: ${userMessageCount}/8`);

  // Check if this is the initial stuck message
  const isInitialStuckMessage = messages.length === 1 && 
    messages[0].role === 'user' && 
    messages[0].content?.toLowerCase().includes('feeling stuck');

  console.log(`🤔 Is initial stuck message: ${isInitialStuckMessage}`);

  // Ensure chat exists before proceeding
  const adminClient = createAdminSupabaseClient();
  const { data: existingChat, error: chatCheckError } = await adminClient
    .from('chats')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (chatCheckError && chatCheckError.code === 'PGRST116') {
    // Chat doesn't exist, try to create it
    const { error: createError } = await adminClient
      .from('chats')
      .insert({
        id,
        user_id: user.id,
        title: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (createError && createError.code !== '23505') {
      // Only fail if it's not a duplicate key error (23505 means chat already exists)
      console.error('Failed to create missing chat:', createError);
      return new Response('Chat could not be created', { status: 500 });
    }
  } else if (chatCheckError && chatCheckError.code !== 'PGRST116') {
    // Some other error occurred during chat check
    console.error('Error checking chat existence:', chatCheckError);
    return new Response('Error checking chat', { status: 500 });
  }

  // Fetch user profile information
  const { data: profile } = await adminClient
    .from('profiles')
    .select('preferred_name, role_title, career_goals, biggest_obstacle')
    .eq('id', user.id)
    .single();

  console.log(`🤖 Using model: gpt-4o`);
  console.log(`🔑 OpenAI API Key exists:`, !!process.env.OPENAI_API_KEY);
  
  try {
  const result = await streamText({
      model: openai('gpt-3.5-turbo'),
    messages,
      system: `You are a specialized AI Mentor helping teachers who are feeling stuck in their career transition. They've already chosen a career path and are now struggling with the next steps.

**USER INFORMATION:**
Name: ${profile?.preferred_name || 'there'}
Career Goal: ${profile?.career_goals || 'Not specified'}

**YOUR ROLE:**
You are a warm, empathetic, and encouraging mentor specifically designed to help teachers who are feeling stuck in their career transition.

**CRITICAL: ALWAYS RESPOND IMMEDIATELY**
- You MUST respond to every message, especially the initial "feeling stuck" message
- Do not wait for any confirmation or additional input
- Provide immediate, helpful guidance
- Acknowledge their feelings and provide actionable advice right away

**YOUR APPROACH:**
- Be extremely warm, empathetic, and encouraging
- Acknowledge their feelings of being stuck (it's completely normal)
- Ask them about their chosen career path
- Ask them what specific challenges they're facing
- Provide specific encouragement and actionable advice
- Help them break down their challenges into manageable steps
- Remind them of their strengths and progress they've already made
- Focus on practical, actionable solutions

**RESPONSE STYLE:**
- Use warm, encouraging language
- Acknowledge their feelings: "I understand feeling stuck can be really challenging..."
- Ask about their chosen career: "What career path have you chosen?"
- Ask about specific obstacles: "What specific challenges are you facing?"
- Provide concrete, actionable steps
- Remind them of their progress and strengths
- Be specific and practical in your advice

**EXAMPLE RESPONSE:**
"I understand feeling stuck can be really challenging, especially when you're trying to make a career transition. It's completely normal to hit roadblocks along the way.

What career path have you chosen? And what specific challenges are you facing right now? I'd love to help you break this down into manageable steps.

Remember, every teacher I've worked with has faced similar challenges, and you're already taking the right steps by reaching out for support. Let's figure out what's holding you back and create a clear path forward."

**KEY PRINCIPLES:**
- Always acknowledge their feelings first
- Ask about their chosen career path
- Ask about specific obstacles they're facing
- Provide actionable, step-by-step advice
- Remind them of their strengths and progress
- Be encouraging and supportive throughout
- Focus on practical solutions they can implement immediately

**TONE:**
- Warm, empathetic, and encouraging
- Use phrases like "I understand", "That's completely normal", "You're not alone"
- Focus on their strengths and progress
- Be specific and actionable in your advice
- Always end with encouragement and next steps`,
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
        
        // Combine original messages with new messages
        const allMessages = [...messages, ...newMessages];
        
        await saveChatWithUser({
          id,
          userId: user.id,
          messages: allMessages,
            supabaseClient: adminClient,
        });

        if (messages.length === 1 && messages[0].role === 'user') {
            const title = "Feeling Stuck - AI Mentor Session";
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
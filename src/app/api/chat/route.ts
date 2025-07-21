import { openai } from '@ai-sdk/openai';
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

  // Count user messages to help AI track progress
  const userMessageCount = messages.filter((m, i) => {
    if (m.role !== "user") return false;
    // Skip the initial empty message inserted by the client to trigger the first AI question
    // (this placeholder is always the very first user message at index 0)
    if (i === 0 && (!m.content || m.content.trim() === "")) return false;
    return m.content && m.content.trim() !== "";
  }).length;
  
  console.log(`🔢 API user message count: ${userMessageCount}/8`);
  console.log(`📝 All messages: ${messages.map(m => `${m.role}: "${m.content?.substring(0, 20)}..."`).join(', ')}`);

  // Ensure chat exists before proceeding
  const adminClient = createAdminSupabaseClient();
  const { data: existingChat, error: chatCheckError } = await adminClient
    .from('chats')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (chatCheckError || !existingChat) {
    // Try to create the chat if it doesn't exist
    const { error: createError } = await adminClient
      .from('chats')
      .insert({
        id,
        user_id: user.id,
        title: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (createError) {
      console.error('Failed to create missing chat:', createError);
      return new Response('Chat could not be created', { status: 500 });
    }
  }

  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    system: `You are an expert career advisor for teachers at the Teachers Academy.

**YOUR PRIMARY JOB:** Determine which of these three paths best fits the user:
1. KNOWLEDGE MONETIZATION – for teachers who want to create and sell educational content, courses, or resources.
2. CAREER ADVANCEMENT - for teachers who want to move up within the education system (admin, leadership, specialized roles).
3. GOING INDEPENDENT – for teachers who want to start their own educational business or consultancy.

**CURRENT STATUS: User has provided ${userMessageCount} out of 8 required responses.**

**PHASE 1: ASSESSMENT (Exactly 8 questions and 8 responses required)**
CRITICAL INSTRUCTION:
- If user responses = 0-7: Ask your next question ONLY (questions 1-8)
- If user responses = 8: Give final recommendation ONLY

Current user response count: ${userMessageCount}/8

${userMessageCount < 8 ? `INSTRUCTION: User has answered ${userMessageCount} questions. Ask question ${userMessageCount + 1} now. Do NOT give any recommendation yet.` : 'INSTRUCTION: User has completed all 8 responses. Give final recommendation now.'}

If fewer than 8 responses received:

**Assessment Rules:**
- Ask only ONE question at a time
- You MUST ask exactly 8 questions total before giving any recommendation
- Each question must be a single, direct, clear sentence ending with "?"
- Do NOT include greetings, appreciation, or extra commentary
- Do NOT ask multiple questions in one message
- Do NOT explain why you are asking
- Do NOT summarize or reflect on previous answers
- Do NOT use phrases like "Thank you", "Great", "Awesome"
- Do NOT use introductory or closing statements
- Only ask the next question needed to determine the best path
- NEVER give recommendations until you have received exactly 8 user responses
**When giving final recommendation (only after 8 responses), use this EXACT format:**

[CTA_BUTTON:button_text_here]

Based on your responses, the best path for you is [PATH NAME]. [Your detailed recommendation and next steps here...]

**CTA Button Options:**
- If recommending KNOWLEDGE MONETIZATION: [CTA_BUTTON:Build Your Course]
- If recommending CAREER ADVANCEMENT: [CTA_BUTTON:Chart Your Career Path]  
- If recommending GOING INDEPENDENT: [CTA_BUTTON:Go Independent]

**PHASE 2: FOLLOW-UP CONVERSATION (After recommendation given)**
Once you have provided a recommendation with [CTA_BUTTON:], switch to conversational mode:

**Follow-up Rules:**
- Provide helpful, detailed responses to user questions
- Stay focused on the three career domains above
- Be conversational and supportive
- Offer practical advice and actionable steps
- You can ask clarifying questions to better help them
- Reference their assessment and recommendation when relevant
- Do NOT restart the assessment
- Do NOT ask them to take another assessment

**Response Style for Follow-up:**
- Be warm, encouraging, and professional
- Provide concise, actionable advice (avoid overwhelming responses)
- Use examples and specific recommendations
- Break down complex topics into manageable steps

**CRITICAL:** Always count user responses to determine which phase you're in. Assessment phase = 8 questions only. Follow-up phase = after recommendation given.`,
    // Following AI SDK pattern: save messages after completion
    async onFinish({ response }) {
      try {
        // Save all messages (user + AI response) to database
        await saveChatWithUser({
          id,
          userId: user.id,
          messages: appendResponseMessages({
            messages,
            responseMessages: response.messages,
          }),
          supabaseClient: adminClient, // Use admin client to bypass RLS
        });

        // Auto-generate chat title from first user message (if this is the first exchange)
        if (messages.length === 1 && messages[0].role === 'user') {
          const firstMessage = messages[0].content;
          const title = firstMessage.length > 50 
            ? firstMessage.substring(0, 50) + '...' 
            : firstMessage;
          await updateChatTitleWithUser(id, title, user.id, adminClient);
        }
      } catch (error) {
        console.error('Error saving chat:', error);
        // Don't throw - we don't want to break the response stream
      }
    },
  });

  return result.toDataStreamResponse();
}
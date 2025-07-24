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

  // Count user messages to help AI track progress
  const userMessageCount = messages.filter((m, i) => {
    if (m.role !== "user") return false;
    // Skip the initial trigger messages
    if (i === 0 && (!m.content || m.content.trim() === "" || m.content.trim() === "start" || m.content.trim() === "begin")) return false;
    return m.content && m.content.trim() !== "";
  }).length;

  console.log(`🔢 API user message count: ${userMessageCount}/8`);

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

  // Fetch user profile information (simplified)
  const { data: profile } = await adminClient
    .from('profiles')
    .select('preferred_name, role_title, career_goals, biggest_obstacle')
    .eq('id', user.id)
    .single();

  const isAssessmentPhase = userMessageCount < 8;

  // Simplified transform that's more robust
  const assessmentTransform = (): any => {
    let foundQuestionMark = false;
    let buffer = '';
    
    return new TransformStream({
      transform(chunk: any, controller) {
        try {
          if (foundQuestionMark) {
            // Still process other chunk types, just not text-delta
            if (chunk?.type !== 'text-delta') {
              controller.enqueue(chunk);
            }
            return;
          }

          if (chunk?.type === 'text-delta' && typeof chunk.textDelta === 'string') {
            buffer += chunk.textDelta;
            const qmIndex = buffer.indexOf('?');
            
            if (qmIndex === -1) {
              controller.enqueue(chunk);
            } else {
              // Send up to and including the question mark
              const allowedText = buffer.slice(0, qmIndex + 1);
              const remainingText = chunk.textDelta.slice(0, qmIndex + 1 - (buffer.length - chunk.textDelta.length));
              
              if (remainingText.length > 0) {
                controller.enqueue({ ...chunk, textDelta: remainingText });
              }
              foundQuestionMark = true;
            }
          } else {
            controller.enqueue(chunk);
          }
        } catch (error) {
          console.error('Transform error:', error);
          controller.enqueue(chunk); // Fallback: pass through
        }
      },
      flush(controller) {
        // Ensure stream is properly closed
        try {
          controller.terminate();
        } catch (error) {
          console.error('Transform flush error:', error);
        }
      }
    });
  };
  
  console.log(`🤖 Using model: gpt-4o`);
  console.log(`🔑 OpenAI API Key exists:`, !!process.env.OPENAI_API_KEY);
  
  try {
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
      system: `You are an AI Mentor at Teachers Academy, designed to help teachers find their ideal career path.

**USER PROFILE:**
Name: ${profile?.preferred_name || 'there'}
Current Role: ${profile?.role_title || 'Not specified'}
Career Goals: ${profile?.career_goals || 'Not specified'}
Biggest Obstacle: ${profile?.biggest_obstacle || 'Not specified'}

**YOUR MISSION:** Guide users through exactly 8 questions to determine their best path among:

**THE THREE PATHS:**
1. **Teaching Business** – Build your own student base, market yourself, earn independently.
2. **Passive Income** – Create and sell digital products like courses, materials, or memberships.
3. **Career Change** – Transition to a new job in/outside education using your existing strengths.

**CURRENT STATUS:** User has provided ${userMessageCount} out of 8 required responses.

${userMessageCount < 8 ? `
**ASSESSMENT PHASE (Questions 1-8):**

You MUST ask these exact 8 questions in order, one at a time:

1. "Thanks for sharing your background, ${profile?.preferred_name || 'there'} - just to get a sense of what you're most focused on right now, what's one thing you'd love to change or improve in your teaching or career?"

2. "What would success look like for you in 6 months — financially, professionally, or personally?"

3. "Are you open to exploring new ways to grow — even if it's outside what you've tried before?"

4. "When you think about your biggest frustrations in your current situation, what comes to mind first?"

5. "If you could wave a magic wand and change one thing about how you earn income from your teaching skills, what would it be?"

6. "What part of teaching energizes you most — working directly with students, creating materials, or something else?"

7. "How do you feel about the idea of marketing yourself or your services to attract students or customers?"

8. "If you had to choose right now, would you rather: build something of your own, improve your current situation, or explore a completely different direction?"

**CRITICAL RULES:**
- Ask ONLY question ${userMessageCount + 1}
- Use simple, friendly tone
- ONE question per response ending with "?"
- NO greetings, summaries, or extra text
- NO recommendations until all 8 questions answered
` : `
**RECOMMENDATION PHASE:**

User has completed all 8 questions. Now provide your recommendation using this EXACT format:

Based on your responses and your background in ${profile?.role_title || 'education'}, the path that seems like the best fit for you is: **[PATH NAME]**

[Brief explanation of why this path fits them]

Here's what this path looks like:
• [Next step 1]
• [Next step 2] 
• [Next step 3]

Ready to get started? [CTA_BUTTON:Start Your Journey]

**Path Options:**
- **Teaching Business**
- **Passive Income**
- **Career Change**
`}

**FOLLOW-UP CONVERSATION (After recommendation):**
Once recommendation is given, switch to conversational mode:
- Answer questions about their chosen path
- Provide practical next steps
- Be encouraging and supportive`,
      // TEMPORARILY REMOVE TRANSFORM TO TEST
      // experimental_transform: isAssessmentPhase ? assessmentTransform : undefined,
      async onFinish({ response }) {
        try {
          await saveChatWithUser({
            id,
            userId: user.id,
            messages: appendResponseMessages({
              messages,
              responseMessages: response.messages,
            }),
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
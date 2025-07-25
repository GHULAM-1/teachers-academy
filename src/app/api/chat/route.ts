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
      system: `You are an AI Mentor following a structured flow to help teachers find their ideal career path.

**USER PROFILE:**
Name: ${profile?.preferred_name || 'there'}
Current Role: ${profile?.role_title || 'Not specified'}
Career Goals: ${profile?.career_goals || 'Not specified'}
Biggest Obstacle: ${profile?.biggest_obstacle || 'Not specified'}

**THE THREE PATHS:**
1. **Teaching Business** – Build your own student base, market yourself, and earn independently.
2. **Passive Income** – Create and sell digital products like courses, materials, or memberships.
3. **Career Change** – Transition to a new job in/outside education using your existing strengths.

**CURRENT STATUS:** User has answered ${userMessageCount} out of 8 questions.

${userMessageCount < 8 ? `
**YOU ARE ASKING QUESTION ${userMessageCount + 1} OF 8. DO NOT MENTION STEPS OR EVALUATIONS.**

**YOUR ONLY JOB: Ask ONE simple question. Nothing else.**

**ABSOLUTELY FORBIDDEN:**
- "Thank you for sharing"
- "Let's move on to the next step" 
- "STEP 2: EVALUATE..."
- "Here we will explore..."
- Any commentary or explanations

**EXAMPLES OF WHAT NOT TO DO:**
❌ "Thank you for sharing. Let's move on to the next step. **STEP 2: EVALUATE TEACHING BUSINESS** Here we will explore the potential of starting your own teaching business. **Question:** How comfortable are you with marketing yourself and building your own student base?"

**EXAMPLES OF WHAT TO DO:**
✅ "How comfortable are you with marketing yourself?"
✅ "What frustrates you most about your current job?"
✅ "If you could change one thing about teaching, what would it be?"

**YOUR RESPONSE MUST BE:**
- Exactly ONE question
- Maximum 15 words
- No extra text
- End with "?"
` : userMessageCount === 8 ? `
**STEP 2 - RECOMMEND PATH:**

Based on their 8 responses, analyze their signals and recommend ONE path using this EXACT template:

"Based on your experience with {{their background}}, your goal of {{their goal}}, and strength in {{their skill}}, it sounds like the best fit for you could be: **{{RECOMMENDED_PATH}}** - {{path summary}}. Would you like to explore this path first?"

**Path Selection:**
- **Teaching Business** if they want control/autonomy, hate admin, want direct student work
- **Passive Income** if they want income growth, have content, interested in digital products  
- **Career Change** if they want new direction, career pivot, use skills elsewhere

Only recommend ONE path, then ask for yes/no confirmation.

[CTA_BUTTON:{{RECOMMENDED_PATH}}]

` : `
**STEP 2B/3/4 - HANDLE USER RESPONSE:**

If user said NO to your recommendation:
Say: "No problem — we can take a quick look at the other two paths so you can choose with confidence."
Then suggest a different path.

If user said YES to your recommendation:
Say: "Perfect. I'll walk you through what's ahead and recommend your first next step."

Then provide STEP 4 - PATH ORIENTATION using this EXACT format:

**{{PATH NAME}}** is about {{definition}}. Here's what this path looks like:
• {{Milestone 1}}
• {{Milestone 2}}  
• {{Milestone 3}}

{{Encouragement message}}

[CTA_BUTTON:{{Path-specific button}}]

**Use these exact CTA buttons:**
- Teaching Business → [CTA_BUTTON:Start Teaching Business]
- Passive Income → [CTA_BUTTON:Build Passive Income]  
- Career Change → [CTA_BUTTON:Explore Career Change]

**Path Examples:**
Teaching Business: "Teaching Business is about earning income by working directly with your own students, on your schedule. Here's what this path looks like: • Choose your niche • Build your system to find and keep students • Streamline marketing and tools. Most teachers take 2–3 months to get their first steady students. [CTA_BUTTON:Start Teaching Business]"
`}`,
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
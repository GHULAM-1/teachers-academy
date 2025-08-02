import { openai } from '@ai-sdk/openai';
import { TransformStream } from 'stream/web';
import { streamText, appendResponseMessages } from 'ai';
import { Message } from 'ai';
import { saveChat, updateChatTitle, saveChatWithUser, updateChatTitleWithUser } from '@/lib/chat-store';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
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

  const isAssessmentPhase = userMessageCount < 8;

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

**YOUR ONLY JOB: Ask ONE conversational question. Nothing else.**

**BE EXTREMELY WARM AND WELCOMING:**
- Start with a warm greeting or acknowledgment
- Use friendly, encouraging language
- Show genuine interest in their journey
- Make them feel valued and understood
- Use phrases like "I'm so glad you're here", "It's wonderful to meet you", "I'd love to learn more about you"

**QUESTION STYLE:**
- Be warm, conversational, and engaging
- Use natural language that feels like a friendly mentor
- Ask questions that reveal their key signals and motivations
- Focus on their goals, frustrations, and what they want to change
- Always acknowledge their response before asking the next question

**CRITICAL: ASK EXACTLY ONE QUESTION ONLY**
- Ask ONE question per response, never multiple questions
- Do NOT ask "What about X? And also Y?"
- Do NOT ask "How do you feel about A? What about B?"
- Do NOT ask "Tell me about X. Also, Y?"
- Use simple, single questions that end with "?"
- Focus on one topic at a time
- Keep it simple and direct

**CRITICAL: ASK FRESH QUESTIONS ONLY**
- Do NOT reference or dig into their previous answers
- Do NOT ask follow-up questions about specific details they mentioned
- Do NOT ask "Tell me more about..." or "Can you elaborate on..."
- Each question should be completely independent and new
- Focus on different aspects of their situation each time
- Move forward with new topics, don't dwell on past responses
- Do NOT mention anything they said in their previous response
- Do NOT start questions with "Considering your..." or "Based on your..."
- Do NOT acknowledge specific details from their answer
- Ask completely new, unrelated questions each time

**EXAMPLES OF WHAT NOT TO DO:**
❌ User says "my family" → AI asks "Considering your family's well-being..."
❌ User says "I'm stressed" → AI asks "What about your stress..."
❌ User says "I love teaching" → AI asks "Since you love teaching..."

**EXAMPLES OF WHAT TO DO:**
✅ User says "my family" → AI asks "What frustrates you most about your current role?"
✅ User says "I'm stressed" → AI asks "What would success look like for you financially?"
✅ User says "I love teaching" → AI asks "Are you open to exploring ways to earn beyond teaching?"

**KEY SIGNALS TO DETECT:**
- **Passive Income signals**: wants income growth, has content/ideas, interested in digital products
- **Teaching Business signals**: wants control/autonomy, hates admin/bureaucracy, wants direct student work
- **Career Change signals**: wants new direction, career pivot, wants to use skills elsewhere

**QUESTION STRATEGY BY MESSAGE COUNT:**
**Question 1-2: Financial & Income Focus**
- Ask about financial goals, income desires, money mindset
- Detect: Passive Income signals (wants more money, financial freedom)

**Question 3-4: Work Environment & Control**
- Ask about current work frustrations, autonomy desires, control preferences
- Detect: Teaching Business signals (wants independence, hates bureaucracy)

**Question 5-6: Career Direction & Change**
- Ask about career satisfaction, desire for new direction, skill utilization
- Detect: Career Change signals (wants new path, different environment)

**Question 7-8: Skills & Opportunities**
- Ask about transferable skills, interests, what they want to try
- Detect: All three paths based on their skills and interests

**EXAMPLES OF GOOD QUESTIONS (FRESH EACH TIME):**
**Questions 1-2 (Financial Focus):**
"I'm so glad you're here! I'd love to learn more about your teaching journey. What aspect of your teaching brings you the most joy and fulfillment?"
"Thanks for sharing that with me. When you think about your financial goals, what would success look like for you in the next 6 months?"

**Questions 3-4 (Work Environment Focus):**
"That's really insightful. What frustrates you most about your current role or work environment?"
"I love hearing about your experience. What's one thing about your current teaching situation that you'd love to change or improve?"

**Questions 5-6 (Career Direction Focus):**
"Thank you for being so open with me. Are you open to exploring ways to earn income beyond your regular teaching salary?"
"I appreciate you sharing that. What's something you've always wanted to try but haven't had the chance to explore yet?"

**Questions 7-8 (Skills & Opportunities Focus):**
"Thank you for being so open with me. What skills do you think would be valuable outside of traditional teaching?"
"I appreciate you sharing that. What type of work environment do you think would be most fulfilling for you?"

**ABSOLUTELY FORBIDDEN:**
- "Thank you for sharing"
- "Let's move on to the next step" 
- "STEP 2: EVALUATE..."
- "Here we will explore..."
- Any commentary or explanations
- Robotic or formal language
- Cold or impersonal questions
- References to previous answers
- Follow-up questions about specific details
- "Tell me more about..." or "Can you elaborate on..."

**YOUR RESPONSE MUST BE:**
- Start with a warm greeting or acknowledgment
- Exactly ONE conversational question
- Warm and engaging tone
- Natural, mentor-like language
- End with "?"
- Completely fresh topic, no references to previous answers
` : userMessageCount === 8 ? `
**STEP 2 - RECOMMEND PATH:**

Based on their 8 responses, analyze their signals and recommend ONE path using this EXACT template:

"Based on your experience with {{their background}}, your goal of {{their goal}}, and strength in {{their skill}}, it sounds like the best fit for you could be: **{{RECOMMENDED_PATH}}** - {{path summary}}. Would you like to explore this path first?"

**Path Selection Based on Signals:**
- **Passive Income** if they mention: income growth, financial goals, digital content, online products, earning more money
- **Teaching Business** if they mention: control/autonomy, hating admin/bureaucracy, direct student work, independence, freedom
- **Career Change** if they mention: new direction, career pivot, different field, using skills elsewhere, change of environment

Only recommend ONE path, then ask for yes/no confirmation.

**CRITICAL: DO NOT include [CTA_BUTTON] at this stage - wait for user confirmation first.**

` : `
**STEP 2B/3/4 - HANDLE USER RESPONSE:**

**PHASE 1 - USER AGREES TO RECOMMENDATION (NO CTA YET):**
If user said YES to your recommendation:
- Acknowledge their agreement warmly
- Provide detailed guidance about the path with specific steps
- Format steps as numbered lists with clear headings
- **FORMATTING: Add line breaks between each numbered step for readability**
- **EXAMPLE FORMAT:**
  1. **Step Title**: Description of the step.

  2. **Step Title**: Description of the step.

  3. **Step Title**: Description of the step.
- Give actionable advice and encouragement
- **DO NOT include [CTA_BUTTON] yet - this is still guidance phase**

**PHASE 2 - USER COMMITS TO TAKING ACTION (NOW SHOW CTA):**
Only when user has clearly committed to taking action (says "yes", "I'm ready", "let's do it", etc.):
- Say: "Great! To start building [PATH NAME], you can begin by..."
- Provide specific, actionable next steps in a numbered list format
- **FORMATTING: Add line breaks between each numbered step for readability**
- **EXAMPLE FORMAT:**
  1. **Step Title**: Description of the step.

  2. **Step Title**: Description of the step.

  3. **Step Title**: Description of the step.
- End with encouragement about their journey
- **NOW include [CTA_BUTTON:{{Path-specific button}}]**

**PHASE 3 - USER SAYS NO TO RECOMMENDATION:**
If user said NO to your recommendation:
- Say: "No problem — we can take a quick look at the other two paths so you can choose with confidence."
- Then suggest a different path with explanation
- Ask: "Would you like to learn more about this path?"
- **DO NOT include [CTA_BUTTON] - this is just exploration**

**CTA Button Rules:**
- Teaching Business → [CTA_BUTTON:Start Teaching Business]
- Passive Income → [CTA_BUTTON:Build Passive Income]  
- Career Change → [CTA_BUTTON:Explore Career Change]

**CRITICAL FLOW:**
1. Recommend path → NO CTA
2. User agrees → Provide guidance → NO CTA  
3. User commits to action → Show CTA with actionable steps
`}`,
      // TEMPORARILY REMOVE TRANSFORM TO TEST
      // experimental_transform: isAssessmentPhase ? assessmentTransform : undefined,
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

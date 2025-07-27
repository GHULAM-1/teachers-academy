import { openai } from '@ai-sdk/openai';
import { streamText, appendResponseMessages, generateId } from 'ai';
import { saveCareerChatWithUser, updateCareerChatTitleWithUser } from '@/lib/career-chat-store';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { matchJobsToAnswers, DiscoveryAnswers, JobMatch } from '@/lib/job-matching';
import { detectMindsetTriggers, MINDSET_TOOLS, getMindsetToolById } from '@/lib/mindset-tools';
import { cookies } from 'next/headers';
import dotenv from 'dotenv';

dotenv.config();

const CAREER_STEPS = {
  'discover': 1,
  'commit': 2,
  'create': 3,
  'make': 4
} as const;

const DISCOVERY_QUESTIONS = [
  "What kind of work energizes you or feels meaningful to you?",
  "What type of environment do you thrive in? (structured/unstructured, independent/team, in-person/remote)",
  "What tasks or skills do others often praise you for?",
  "Are you more drawn to solving problems, helping others, organizing systems, or building things?",
  "What values matter most to you in your next role? (e.g., stability, creativity, impact)",
  "Are you open to additional training or would you prefer to transition with your existing skills?",
  "What income range do you hope to achieve in the next 1–2 years?",
  "Do you have any strong preferences or constraints (location, schedule, technology use)?"
];



const STEP_PROMPTS = {
  'discover': `You are guiding the user through a structured career discovery process. This involves 6 sub-phases:

SUB-STEP 1-8: Ask discovery questions (one at a time)
- Present exactly ONE question from the discovery list
- Wait for their answer before moving to the next question
- Allow them to skip or go back if needed
- Keep track of their responses for job matching

SUB-STEP 2: Job matching (internal processing)
- Use their collected responses to match against job roles
- This happens automatically after all questions are answered

SUB-STEP 3: Present top 3 job matches
- Show job cards with title, description, fit level, and actions
- Each card has "Start This Path" and "Learn More" buttons

SUB-STEP 4: Provide detailed job information when "Learn More" is clicked
- Show detailed description, salary, why they're a match, and resources

SUB-STEP 5: Ask which job they're most curious about
- Help them select one option to explore further

SUB-STEP 6: Ask about deeper reflection
- Offer to begin deeper exploration or bookmark for later

Focus on being conversational, supportive, and guiding them through this structured process one step at a time.`,

  'commit': `You are now serving as a Mindset Coach helping a teacher feel emotionally and mentally ready to pursue a new career path. Your role is to identify internal hesitations (e.g., fear, self-doubt, confusion), ask reflective questions, and offer tools or encouragement. Do not push. Let the user reflect and choose.

Focus on:
- Building confidence and addressing self-doubt
- Identifying and working through fears and concerns
- Validating excitement and motivation
- Offering mindset tools and techniques
- Supporting emotional preparation for transition
- Confirming readiness to move forward

Use a warm, supportive tone and let the user guide the pace.`,

  'create': `You are helping the user create professional materials for their career transition. Focus on:
- Crafting a compelling resume that highlights transferable teaching skills
- Writing targeted cover letters for specific roles/industries
- Creating a LinkedIn profile that positions them for their new career
- Developing a portfolio or work samples if relevant
- Preparing for interviews and common questions about career transitions
- Building a professional network in their target industry

Help them create polished, professional materials that tell their career transition story effectively.`,

  'make': `You are helping the user create an action plan for their career transition. Focus on:
- Creating a timeline with specific milestones and deadlines
- Identifying immediate next steps and quick wins
- Planning for skill development, networking, and job search activities
- Setting up tracking systems for applications and opportunities
- Preparing for potential obstacles and setbacks
- Building confidence and momentum for the transition

Help them create a concrete, actionable plan with clear steps they can start taking immediately.`
};





async function handleCommitFlow(messages: any[], chatId: string, userId: string, profile: any, supabaseClient: any) {
  // Create a comprehensive prompt that guides the AI through the exact process
  const commitPrompt = `You are a Mindset Coach helping a teacher feel emotionally and mentally ready to pursue a new career path.

FOLLOW THIS EXACT PROCESS:

STEP 2: Ask these 5 questions in sequence (one at a time):
1. "On a scale of 1–10, how confident do you feel about succeeding in this new path?"
2. "What excites you most about this direction?"
3. "What worries you the most?"
4. "Have you tried switching careers before? What happened?"
5. "What would make you feel more prepared to move forward?"

STEP 3: After all 5 questions are answered, detect mindset triggers and offer appropriate tools:

Available Mindset Tools:
1. Confidence Check - for "I'm not qualified", "Others are better"
2. Why Not Me? Journal Prompt - for "I'm scared", "What if I fail?"
3. Vision Forward - for "I'm stuck", "I don't know what I want"
4. Small Win Plan - for "It's overwhelming", "I don't know where to start"
5. Permission Slip - for "I feel guilty", "I'm afraid to disappoint others"
6. Impostor Check - for "I don't belong", "I'm not good enough"
7. Pep Talk Audio Clip - for "I want to give up", "This is too hard"

When you detect a trigger, offer the appropriate tool with its specific prompt and format.

STEP 4: After 1-2 mindset tools OR confidence score ≥ 7/10, ask:
"Thanks for being open. Based on our chat, do you feel ready to keep going with this new direction?"

SPECIAL HANDLING:

If user wants to give up or quit:
- Acknowledge their feelings: "I hear that this feels overwhelming right now."
- Offer options: "You have a few choices: 1) Take a break and come back later, 2) Go back to the discovery phase to explore different options, 3) Continue with a different approach. What feels right to you?"

If user requests voice recording or audio:
- Generate ONLY the motivational speech content (30-60 seconds) that addresses their specific concerns
- Do NOT include any introductory text like "Here's a motivational message" or "Absolutely!"
- Do NOT include any commentary or explanations
- Write ONLY the actual motivational words that someone would want to hear
- Make it warm, encouraging, and conversational
- At the very end of your response, add the word "AUDIO_MESSAGE" on a new line
- The AUDIO_MESSAGE word should be the very last thing in your response

CRITICAL RULES:
- Ask questions ONE AT A TIME in exact sequence
- Do NOT ask follow-up questions about previous answers
- Do NOT give generic advice about researching or networking
- Stick to the exact question text above
- Only move to next question after getting an answer
- Handle special requests gracefully without breaking the flow
- ALWAYS respond in natural, conversational language - NEVER use JSON formatting or structured responses
- Keep responses warm, supportive, and human-like`;

  try {
    // Use streamText but extract clean content before saving
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
      system: commitPrompt,
      
      async onFinish({ response }) {
        try {
          console.log(`🤖 Processing AI response for commit step`);
          console.log('🔍 Full response object:', JSON.stringify(response, null, 2));
          console.log('🔍 Response messages:', response.messages);
          
          // Get the raw text content from the response
          let cleanContent = '';
          
          // Try multiple ways to extract the content
          if (response.messages && response.messages.length > 0) {
            console.log('🔍 Number of messages:', response.messages.length);
            
            // Look for the assistant message (should be the last one)
            for (let i = response.messages.length - 1; i >= 0; i--) {
              const msg = response.messages[i];
              console.log(`🔍 Message ${i}:`, msg);
              
              if (msg.role === 'assistant' && msg.content) {
                if (typeof msg.content === 'string') {
                  cleanContent = msg.content;
                  console.log('🔍 Found assistant message with string content:', cleanContent);
                  break;
                } else if (Array.isArray(msg.content)) {
                  // Handle array format: [{"type": "text", "text": "..."}]
                  const textParts = msg.content
                    .filter(item => item.type === 'text')
                    .map(item => item.text)
                    .join('');
                  cleanContent = textParts;
                  console.log('🔍 Found assistant message with array content:', cleanContent);
                  break;
                }
              }
            }
          }
          
          // If still no content, try alternative approaches
          if (!cleanContent) {
            console.log('🔍 Trying alternative content extraction...');
            
            // Check if response has a text property
            if ((response as any).text) {
              cleanContent = (response as any).text;
              console.log('🔍 Found content in response.text:', cleanContent);
            }
            // Check if response has a content property
            else if ((response as any).content) {
              cleanContent = (response as any).content;
              console.log('🔍 Found content in response.content:', cleanContent);
            }
          }
          
          console.log('🔍 Final clean content:', cleanContent);
          
          if (!cleanContent) {
            console.log('⚠️ No clean content found, using fallback');
            cleanContent = 'I understand. Let me help you with that.';
          }
          
          // Extract only the motivational content (remove introductory text)
          let extractedContent = cleanContent;
          
          // Method 1: Extract content between quotes
          if (cleanContent.includes('"') && cleanContent.includes('"')) {
            const startQuote = cleanContent.indexOf('"');
            const endQuote = cleanContent.lastIndexOf('"');
            if (startQuote !== -1 && endQuote !== -1 && endQuote > startQuote) {
              const quotedContent = cleanContent.substring(startQuote + 1, endQuote);
              if (quotedContent.length > 20) {
                extractedContent = quotedContent;
                console.log('🔍 Extracted motivational content from quotes');
              }
            }
          }
          
          // Method 2: Remove common introductory phrases
          const introPhrases = [
            "here's a motivational message",
            "absolutely! here's a motivational message",
            "here's a motivational message to inspire you",
            "here's a motivational message for you",
            "here's a motivational speech",
            "here's a motivational message to help you"
          ];
          
          let cleanedContent = extractedContent.toLowerCase();
          for (const phrase of introPhrases) {
            if (cleanedContent.includes(phrase)) {
              const phraseIndex = cleanedContent.indexOf(phrase);
              const afterPhrase = extractedContent.substring(phraseIndex + phrase.length);
              if (afterPhrase.trim().length > 20) {
                extractedContent = afterPhrase.trim();
                console.log('🔍 Removed introductory phrase:', phrase);
                break;
              }
            }
          }
          
          // Method 3: Find the actual motivational content after colons or newlines
          if (extractedContent.includes(':')) {
            const colonIndex = extractedContent.lastIndexOf(':');
            const afterColon = extractedContent.substring(colonIndex + 1).trim();
            if (afterColon.length > 20 && afterColon.includes('remember') || afterColon.includes('you')) {
              extractedContent = afterColon;
              console.log('🔍 Extracted content after colon');
            }
          }
          
          cleanContent = extractedContent;
          
          // Remove the AUDIO_MESSAGE trigger from the final content
          if (cleanContent.includes('AUDIO_MESSAGE')) {
            cleanContent = cleanContent.replace('AUDIO_MESSAGE', '').trim();
            console.log('🔍 Content cleaned of AUDIO_MESSAGE trigger');
          }

          // Check if this is a voice recording request
          const isVoiceRecordingRequest = messages.some(msg => 
            msg.role === 'user' && 
            msg.content && 
            typeof msg.content === 'string' &&
            (msg.content.toLowerCase().includes('voice recording') ||
             msg.content.toLowerCase().includes('audio') ||
             msg.content.toLowerCase().includes('speech') ||
             msg.content.toLowerCase().includes('motivational message') ||
             msg.content.toLowerCase().includes('motivational') ||
             msg.content.toLowerCase().includes('pep talk'))
          );
          
          // Check for the hardcoded AUDIO_MESSAGE trigger
          const hasAudioMessageTrigger = cleanContent && 
            cleanContent.includes('AUDIO_MESSAGE');
          
          console.log('🔍 Content length:', cleanContent?.length);
          console.log('🔍 Content preview:', cleanContent?.substring(0, 100));
          console.log('🔍 Contains AUDIO_MESSAGE:', cleanContent?.includes('AUDIO_MESSAGE'));
          
          // Also check if the AI response looks like motivational content
          const isMotivationalContent = cleanContent && 
            cleanContent.length > 50 && 
            (cleanContent.toLowerCase().includes('you\'ve got this') ||
             cleanContent.toLowerCase().includes('remember') ||
             cleanContent.toLowerCase().includes('believe in') ||
             cleanContent.toLowerCase().includes('you are capable') ||
             cleanContent.toLowerCase().includes('keep moving') ||
             cleanContent.toLowerCase().includes('stay focused'));
          
          const shouldShowVoiceRecording = (isVoiceRecordingRequest || isMotivationalContent || hasAudioMessageTrigger) && 
            cleanContent && cleanContent.length > 20; // Only show for substantial content
          
          // Check for mindset triggers in the latest user message
          const latestUserMessage = messages.filter(msg => msg.role === 'user').pop();
          const triggeredTools = latestUserMessage && typeof latestUserMessage.content === 'string' 
            ? detectMindsetTriggers(latestUserMessage.content)
            : [];
          
          console.log('🔍 Voice recording request detected:', isVoiceRecordingRequest);
          console.log('🔍 AUDIO_MESSAGE trigger detected:', hasAudioMessageTrigger);
          console.log('🔍 Motivational content detected:', isMotivationalContent);
          console.log('🔍 Should show voice recording:', shouldShowVoiceRecording);
          console.log('🔍 Mindset triggers detected:', triggeredTools.map(t => t.name));
          console.log('🔍 User messages:', messages.filter(msg => msg.role === 'user').map(msg => msg.content));

          // Create clean message object
          const cleanMessage = {
            id: generateId(),
            role: 'assistant' as const,
            content: cleanContent,
            createdAt: new Date(),
            // Add metadata for voice recording
            ...(shouldShowVoiceRecording && { 
              hasVoiceRecording: true,
              voiceRecordingText: cleanContent 
            }),
            // Add metadata for mindset tools
            ...(triggeredTools.length > 0 && {
              hasMindsetTools: true,
              mindsetTools: triggeredTools.map(tool => ({
                id: tool.id,
                name: tool.name,
                description: tool.description,
                format: tool.format,
                prompt: tool.prompt
              }))
            })
          };
          
          console.log('🔍 Clean message with metadata:', cleanMessage);

          // Save the clean response
          console.log(`🤖 Saving clean AI response for commit step`);
          await saveCareerChatWithUser({
            id: chatId,
            userId,
            messages: [{ ...cleanMessage, step: 'commit' }],
            currentStep: 'commit',
            supabaseClient,
          });
          console.log(`✅ Clean AI response saved successfully`);

          if (messages.length === 1 && messages[0].role === 'user') {
            const title = `Career Commit Session`;
            await updateCareerChatTitleWithUser(chatId, title, userId, supabaseClient);
          }
        } catch (error) {
          console.error('Error saving clean response:', error);
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in commit flow:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process commit flow',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function createDirectResponse(content: string, messages: any[], chatId: string, userId: string, supabaseClient: any, step: string = 'discover') {
  try {
    // Create a direct response without using streamText to avoid JSON formatting
    const responseMessage = {
      id: generateId(),
      role: 'assistant' as const,
      content: content,
      createdAt: new Date()
    };

    // Save the response directly
    try {
      console.log(`🤖 Saving direct AI response for ${step} step`);
      await saveCareerChatWithUser({
        id: chatId,
        userId,
        messages: [{ ...responseMessage, step: step }],
        currentStep: step,
        supabaseClient,
      });
      console.log(`✅ Direct AI response saved successfully`);

      // Set title for the first interaction (when we have 0 or 1 message)
      if (messages.length <= 1) {
        const title = step === 'discover' ? `Career Discovery Session` : `Career ${step.charAt(0).toUpperCase() + step.slice(1)} Session`;
        await updateCareerChatTitleWithUser(chatId, title, userId, supabaseClient);
      }
    } catch (error) {
      console.error('Error saving direct response:', error);
    }

    // Return a streaming response that just outputs the content
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages: [...messages],
      system: `You are a helpful assistant. Respond with exactly this text and nothing else: ${content}`,
      
      async onFinish({ response }) {
        // Title is already set when we save the direct response above
        // No need to save anything here since we saved it directly
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error creating direct response:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create response',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleDiscoverFlow(messages: any[], chatId: string, userId: string, profile: any, supabaseClient: any) {
  // Analyze conversation to determine current sub-step
  const allUserMessages = messages.filter(m => m.role === 'user');
  const userMessages = messages.filter(m => 
    m.role === 'user' && 
    m.content && 
    m.content.trim() !== '' && 
    m.content.trim() !== 'start' &&
    m.content.trim() !== 'begin'
  );
  const currentQuestionIndex = userMessages.length;
  
  console.log(`🔍 Discovery Flow Debug:`, {
    totalMessages: messages.length,
    allUserMessages: allUserMessages.length,
    filteredUserMessages: userMessages.length,
    currentQuestionIndex,
    lastUserMessage: allUserMessages[allUserMessages.length - 1]?.content
  });
  
  // Collect user answers for job matching
  const answers: DiscoveryAnswers = {};
  userMessages.forEach((msg, index) => {
    switch (index) {
      case 0: answers.meaningfulWork = msg.content; break;
      case 1: answers.workEnvironment = msg.content; break;
      case 2: answers.praisedSkills = msg.content; break;
      case 3: answers.workType = msg.content; break;
      case 4: answers.values = msg.content; break;
      case 5: answers.trainingOpenness = msg.content; break;
      case 6: answers.salaryExpectation = msg.content; break;
      case 7: answers.constraints = msg.content; break;
    }
  });

  // Handle different phases of discovery
  if (currentQuestionIndex === 0) {
    // First interaction - ask first question directly
    const responseContent = DISCOVERY_QUESTIONS[0];
    
    return createDirectResponse(responseContent, messages, chatId, userId, supabaseClient);
    
  } else if (currentQuestionIndex > 0 && currentQuestionIndex < DISCOVERY_QUESTIONS.length) {
    // Continue asking questions directly
    const responseContent = DISCOVERY_QUESTIONS[currentQuestionIndex];
    
    return createDirectResponse(responseContent, messages, chatId, userId, supabaseClient);
    
  } else if (currentQuestionIndex === DISCOVERY_QUESTIONS.length) {
    // All questions answered - show job matches
    console.log(`🎯 Job Matching Debug:`, {
      answers,
      userMessagesContent: userMessages.map(m => m.content)
    });
    
    const jobMatches = matchJobsToAnswers(answers);
    
    console.log(`🎯 Job Matches Result:`, {
      matchCount: jobMatches.length,
      matches: jobMatches.map(m => ({ job: m.job.title, score: m.score, fitLevel: m.fitLevel }))
    });
    
    // Create serializable job matches (remove React components)
    const serializableJobMatches = jobMatches.map(match => ({
      job: {
        id: match.job.id,
        title: match.job.title,
        shortDescription: match.job.shortDescription,
        detailedDescription: match.job.detailedDescription,
        salaryRange: match.job.salaryRange,
        requirements: match.job.requirements,
        resources: match.job.resources,
      },
      score: match.score,
      fitLevel: match.fitLevel,
      reasons: match.reasons
    }));
    
    // Enhanced response that includes comparison suggestion
    const responseContent = `Excellent! I've analyzed your responses and found some great career matches for you. Based on your preferences, skills, and goals, here are your top 3 career paths. Each of these roles leverages your teaching background in different ways.`;
    
    // Simple approach: embed job matches as plain text in the response
    const jobMatchesText = serializableJobMatches.map((match, index) => `
**${index + 1}. ${match.job.title}** (${match.fitLevel} - ${match.score}% match)
${match.job.shortDescription}
Salary: ${match.job.salaryRange}
Why you're a match: ${match.reasons.join(', ')}
`).join('\n');

    const comparisonSuggestion = `

Would you like to move to the next step where we'll help you commit with confidence to your selected career path? This will help you prepare mentally and emotionally for the transition.`;

    const fullResponse = `${responseContent}

${jobMatchesText}${comparisonSuggestion}`;

    return createDirectResponse(fullResponse, messages, chatId, userId, supabaseClient);
    
  } else {
    // Check if user wants to move to next step FIRST (before asking more questions)
    const lastUserMessage = allUserMessages[allUserMessages.length - 1]?.content?.toLowerCase() || '';
    const wantsToMoveToNext = lastUserMessage.includes('next step') || 
                             lastUserMessage.includes('move to') || 
                             lastUserMessage.includes('continue to') ||
                             lastUserMessage.includes('commit') ||
                             lastUserMessage.includes('proceed') ||
                             lastUserMessage.includes('yes') ||
                             lastUserMessage.includes('ready');
    
    if (wantsToMoveToNext && allUserMessages.length > 0) {
      // User wants to move to next step - just save the response with the new step
      return createDirectResponse("Nice work picking a new direction!\n\nOn a scale of 1–10, how confident do you feel about succeeding in this new path?", messages, chatId, userId, supabaseClient, 'commit');
    } else if (currentQuestionIndex === DISCOVERY_QUESTIONS.length + 1) {
      // Sub-step 5: Ask which job they're most curious about (only if they didn't want to move to next step)
      const question = "Which of these career paths are you most curious to explore further?";
      return createDirectResponse(question, messages, chatId, userId, supabaseClient);
    } else {
      // Discovery complete - no more automatic questions
      console.log('🎯 Discovery flow complete. User can now engage in free conversation or move to next step.');
      return createDirectResponse("Great! Feel free to ask any questions about these career paths, or let me know when you're ready to move to the next step.", messages, chatId, userId, supabaseClient);
    }
  }
}







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

  let messages, id, step;
  
  try {
    const body = await req.json();
    messages = body.messages;
    id = body.id;
    step = body.step;
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return new Response('Invalid JSON in request body', { status: 400 });
  }

  // Validate required fields
  if (!id) {
    return new Response('Chat ID is required', { status: 400 });
  }

  if (!step || !STEP_PROMPTS[step as keyof typeof STEP_PROMPTS]) {
    return new Response('Valid step is required (discover, commit, create, make)', { status: 400 });
  }

  if (!messages || !Array.isArray(messages)) {
    return new Response('Messages array is required', { status: 400 });
  }

  // Ensure career chat exists
  const adminClient = createAdminSupabaseClient();
  const { data: existingChat, error: chatCheckError } = await adminClient
    .from('career_chats')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (chatCheckError && chatCheckError.code === 'PGRST116') {
    // Career chat doesn't exist, create it
    console.log(`🔧 Creating new career chat:`, { id, userId: user.id, userEmail: user.email });
    
    const { error: createError } = await adminClient
      .from('career_chats')
      .insert({
        id,
        user_id: user.id,
        title: null,
        saved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (createError && createError.code !== '23505') {
      console.error('Failed to create missing career chat:', createError);
      return new Response('Career chat could not be created', { status: 500 });
    }
    
    console.log(`✅ Successfully created career chat with user_id: ${user.id}`);
  } else if (chatCheckError && chatCheckError.code !== 'PGRST116') {
    console.error('Error checking career chat existence:', chatCheckError);
    return new Response('Error checking career chat', { status: 500 });
  }

  // Fetch user profile information
  const { data: profile } = await adminClient
    .from('profiles')
    .select('preferred_name, role_title, career_goals, biggest_obstacle, students_and_subjects, top_skills, exploring_opportunities, tools_used, commit_status')
    .eq('id', user.id)
    .single();

  // Get previous step context if available
  const { data: previousSteps } = await adminClient
    .from('career_messages')
    .select('step, content, role')
    .eq('chat_id', id)
    .eq('user_id', user.id)
    .neq('step', step) // Exclude current step messages
    .order('created_at', { ascending: true });

  const previousContext = previousSteps && previousSteps.length > 0 
    ? `\n\nPREVIOUS STEP CONTEXT:\n${previousSteps
        .map(msg => `${msg.step}: ${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n')}`
    : '';

  // Determine the current step based on the last AI message from database
  let currentStep = step;
  
  // Get the last AI message from database to check its step
  const { data: lastAIMessageFromDB } = await adminClient
    .from('career_messages')
    .select('step, content, role')
    .eq('chat_id', id)
    .eq('user_id', user.id)
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log(`🔍 Step Debug:`, {
    requestedStep: step,
    lastAIMessageStep: lastAIMessageFromDB?.step,
    currentStep: currentStep
  });

  if (lastAIMessageFromDB && lastAIMessageFromDB.step && lastAIMessageFromDB.step !== step) {
    currentStep = lastAIMessageFromDB.step;
    console.log(`🔄 Step transition detected: ${step} → ${currentStep} (from DB)`);
  }

  // Save the current user message first (if it's a user message)
  const currentMessage = messages[messages.length - 1];
  if (currentMessage && currentMessage.role === 'user') {
    console.log(`💾 Saving user message:`, { 
      content: currentMessage.content.substring(0, 50) + '...', 
      step: currentStep, 
      messageId: currentMessage.id 
    });
    try {
      await saveCareerChatWithUser({
        id,
        userId: user.id,
        messages: [{ ...currentMessage, step: currentStep, id: currentMessage.id || generateId() }],
        currentStep: currentStep,
        supabaseClient: adminClient,
      });
      console.log(`✅ User message saved successfully`);
    } catch (error) {
      console.error('Error saving user message:', error);
    }
  }

  // Handle discover step with structured flow
  if (currentStep === 'discover') {
    console.log(`🔍 Using handleDiscoverFlow for step: ${currentStep}`);
    return await handleDiscoverFlow(messages, id, user.id, profile, adminClient);
  }

  // Handle commit step with structured flow
  if (currentStep === 'commit') {
    console.log(`🧠 Using handleCommitFlow for step: ${currentStep}`);
    return await handleCommitFlow(messages, id, user.id, profile, adminClient);
  }

  console.log(`⚠️ Step ${currentStep} not handled by structured flow, using generic logic`);

  // Handle other steps with original logic
  const stepPrompt = STEP_PROMPTS[currentStep as keyof typeof STEP_PROMPTS];
  const stepNumber = CAREER_STEPS[currentStep as keyof typeof CAREER_STEPS];
  
  console.log(`🔄 Career Step ${stepNumber} (${currentStep}) - OpenAI API Key exists:`, !!process.env.OPENAI_API_KEY);
  
  try {
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
      system: `${stepPrompt}

**USER PROFILE:**
Name: ${profile?.preferred_name || 'there'}
Current Role: ${profile?.role_title || 'Not specified'}
Students/Subjects: ${profile?.students_and_subjects || 'Not specified'}
Career Goals: ${profile?.career_goals || 'Not specified'}
Biggest Obstacle: ${profile?.biggest_obstacle || 'Not specified'}
Top Skills: ${profile?.top_skills || 'Not specified'}
Why Exploring: ${profile?.exploring_opportunities || 'Not specified'}

**CURRENT STEP:** Step ${stepNumber} - ${currentStep.toUpperCase()}

${previousContext}

**INSTRUCTIONS:**
- You are specifically focused on the "${currentStep}" phase of career transition
- Reference their teaching background and profile information naturally
- Use previous step context if available to build upon earlier insights
- Be practical, encouraging, and action-oriented
- Keep responses conversational and supportive
- Provide specific, actionable advice relevant to this step
- If this is the first message in this step, acknowledge what step you're in and provide an overview`,
      
      async onFinish({ response }) {
        try {
          console.log(`🤖 Saving AI response for ${currentStep} step`);
          
          // Extract clean text content from AI responses
          const newResponseMessages = response.messages.map(msg => {
            let cleanContent = msg.content;
            
            // If content is a JSON array, extract the text
            if (typeof msg.content === 'string' && msg.content.startsWith('[')) {
              try {
                const parsed = JSON.parse(msg.content);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type === 'text') {
                  cleanContent = parsed[0].text;
                }
              } catch (e) {
                // If parsing fails, keep original content
                console.log('Failed to parse JSON content, keeping original');
              }
            }
            
            return {
            ...msg, 
              content: cleanContent,
            step: currentStep,
            id: msg.id || generateId()
            };
          });

          console.log(`💾 Saving ${newResponseMessages.length} AI response(s)`);
          await saveCareerChatWithUser({
            id,
            userId: user.id,
            messages: newResponseMessages, // Only the new response
            currentStep: currentStep,
            supabaseClient: adminClient,
          });
          console.log(`✅ AI response saved successfully`);

          // Update title if this is the first message
          if (messages.length === 1 && messages[0].role === 'user') {
            const title = `Career ${currentStep.charAt(0).toUpperCase() + currentStep.slice(1)} Session`;
            await updateCareerChatTitleWithUser(id, title, user.id, adminClient);
          }
        } catch (error) {
          console.error('Error saving career chat:', error);
        }
      },
    });

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
import { openai } from '@ai-sdk/openai';
import { streamText, appendResponseMessages, generateId } from 'ai';
import { saveCareerChatWithUser, updateCareerChatTitleWithUser } from '@/lib/career-chat-store';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { matchJobsToAnswers, DiscoveryAnswers, JobMatch } from '@/lib/job-matching';
import { cookies } from 'next/headers';
import dotenv from 'dotenv';

dotenv.config();

const CAREER_STEPS = {
  'discover': 1,
  'compare': 2,
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

  'compare': `You are helping the user compare different career options. Focus on:
- Side-by-side comparison of career paths they're considering
- Salary ranges, job market demand, and growth potential
- Required skills, education, or certifications needed
- How their teaching experience transfers to each option
- Work-life balance and culture differences
- Entry-level opportunities and career progression paths

Help them create a structured comparison of their top 2-3 career options with pros and cons for each.`,

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
    
    // Simple plain text response
    const responseContent = `Excellent! I've analyzed your responses and found some great career matches for you. Based on your preferences, skills, and goals, here are your top 3 career paths. Each of these roles leverages your teaching background in different ways.`;
    
    // Simple approach: embed job matches as plain text in the response
    const jobMatchesText = serializableJobMatches.map((match, index) => `
**${index + 1}. ${match.job.title}** (${match.fitLevel} - ${match.score}% match)
${match.job.shortDescription}
Salary: ${match.job.salaryRange}
Why you're a match: ${match.reasons.join(', ')}
`).join('\n');

    const fullResponse = `${responseContent}

${jobMatchesText}`;

    return createDirectResponse(fullResponse, messages, chatId, userId, supabaseClient);
    
  } else if (currentQuestionIndex === DISCOVERY_QUESTIONS.length + 1) {
    // Sub-step 5: Ask which job they're most curious about
    const question = "Which of these career paths are you most curious to explore further?";
    return createDirectResponse(question, messages, chatId, userId, supabaseClient);
    
  } else if (currentQuestionIndex === DISCOVERY_QUESTIONS.length + 2) {
    // Sub-step 6: Ask about next step
    const question = "Would you like to move to the next step to compare these career options in detail, or would you prefer to bookmark this conversation and continue exploring later?";
    return createDirectResponse(question, messages, chatId, userId, supabaseClient);
    
  } else {
    // Discovery complete - no more automatic questions
    console.log('🎯 Discovery flow complete. User can now engage in free conversation or move to next step.');
    return createDirectResponse("Great! Feel free to ask any questions about these career paths, or let me know when you're ready to move to the next step.", messages, chatId, userId, supabaseClient);
  }
}



async function createDirectResponse(content: string, messages: any[], chatId: string, userId: string, supabaseClient: any) {
  try {
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages: [...messages],
      system: `Respond with exactly this text and nothing else:

${content}`,
      
      async onFinish({ response }) {
        try {
          const messagesWithStep = appendResponseMessages({
            messages,
            responseMessages: response.messages,
          }).map(msg => ({ ...msg, step: 'discover' }));

          await saveCareerChatWithUser({
            id: chatId,
            userId,
            messages: messagesWithStep,
            currentStep: 'discover',
            supabaseClient,
          });

          if (messages.length === 0) {
            const title = `Career Discovery Session`;
            await updateCareerChatTitleWithUser(chatId, title, userId, supabaseClient);
          }
        } catch (error) {
          console.error('Error saving direct response chat:', error);
        }
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
    return new Response('Valid step is required (discover, compare, create, make)', { status: 400 });
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
    const { error: createError } = await adminClient
      .from('career_chats')
      .insert({
        id,
        user_id: user.id,
        title: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (createError && createError.code !== '23505') {
      console.error('Failed to create missing career chat:', createError);
      return new Response('Career chat could not be created', { status: 500 });
    }
  } else if (chatCheckError && chatCheckError.code !== 'PGRST116') {
    console.error('Error checking career chat existence:', chatCheckError);
    return new Response('Error checking career chat', { status: 500 });
  }

  // Fetch user profile information
  const { data: profile } = await adminClient
    .from('profiles')
    .select('preferred_name, role_title, career_goals, biggest_obstacle, students_and_subjects, top_skills, exploring_opportunities')
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

  // Handle discover step with structured flow
  if (step === 'discover') {
    return await handleDiscoverFlow(messages, id, user.id, profile, adminClient);
  }

  // Handle other steps with original logic
  const stepPrompt = STEP_PROMPTS[step as keyof typeof STEP_PROMPTS];
  const stepNumber = CAREER_STEPS[step as keyof typeof CAREER_STEPS];
  
  console.log(`🔄 Career Step ${stepNumber} (${step}) - OpenAI API Key exists:`, !!process.env.OPENAI_API_KEY);
  
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

**CURRENT STEP:** Step ${stepNumber} - ${step.toUpperCase()}

${previousContext}

**INSTRUCTIONS:**
- You are specifically focused on the "${step}" phase of career transition
- Reference their teaching background and profile information naturally
- Use previous step context if available to build upon earlier insights
- Be practical, encouraging, and action-oriented
- Keep responses conversational and supportive
- Provide specific, actionable advice relevant to this step
- If this is the first message in this step, acknowledge what step you're in and provide an overview`,
      
      async onFinish({ response }) {
        try {
          // Add step information to messages
          const messagesWithStep = appendResponseMessages({
            messages,
            responseMessages: response.messages,
          }).map(msg => ({ ...msg, step }));

          await saveCareerChatWithUser({
            id,
            userId: user.id,
            messages: messagesWithStep,
            currentStep: step,
            supabaseClient: adminClient,
          });

          // Update title if this is the first message
          if (messages.length === 1 && messages[0].role === 'user') {
            const title = `Career ${step.charAt(0).toUpperCase() + step.slice(1)} Session`;
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
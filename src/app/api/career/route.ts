import { openai } from '@ai-sdk/openai';
import { streamText, appendResponseMessages, generateId } from 'ai';
import { saveCareerChatWithUser, updateCareerChatTitleWithUser } from '@/lib/career-chat-store';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { matchJobsToAnswers, DiscoveryAnswers, JobMatch } from '@/lib/job-matching';
import { detectMindsetTriggers, MINDSET_TOOLS, getMindsetToolById } from '@/lib/mindset-tools';
import { saveCareerMaterialToProfile, MaterialType } from '@/lib/career-materials';
import { saveJobSearchTermsToCareerChat } from '@/lib/career-chat-store';
import { cookies } from 'next/headers';
import dotenv from 'dotenv';

dotenv.config();

const CAREER_STEPS = {
  'discover': 1,
  'commit': 2,
  'create': 3,
  'apply': 4
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

  'create': `You are helping the user prepare application materials for their career transition. Follow this EXACT flow:

**STAGE 1: MATERIAL SELECTION**
When user commits to a career path, show:
"🎉 Congratulations on choosing your new direction! Now let's prepare your application materials for [career path]. What would you like to start with?"

Offer these options:
- 📄 Resume Builder
- 📝 Cover Letter Assistant  
- 💼 LinkedIn Profile Rebrand
- 📧 Outreach Message Builder
- 🔍 Explore All Options

**STAGE 2: CONFIDENCE BOOST (Optional)**
Before launching each tool, prompt the user:
"Before we begin, would you like a quick tip to boost your confidence when writing your [resume/cover letter/etc.]?"

If user says "Yes," display a 2–3 sentence mindset tip relevant to the tool and job path.
Example (Resume + Instructional Designer):
"You've already designed learning every day in your classroom. Instructional designers do the same thing — just with adults and online."

If user selects "No thanks," skip tip and launch chat tool.

**STAGE 3: TOOL-SPECIFIC FLOWS**

**RESUME BUILDER - Step-by-Step Chat Prompts:**
1. "Let's start by summarizing your teaching background. What subjects or grade levels have you taught?"
2. "What's a standout achievement from your teaching career?"
3. "What tech tools or platforms are you confident using?"
4. "Would you like resume bullets written using the STAR method?"

**System Logic & Output:**
- AI maps teaching skills to target job (e.g., curriculum planning → instructional design).
- Outputs 3–5 tailored bullet points based on user input.
- **CRITICAL: When generating the final resume, ALWAYS start with "[RESUME]" on the first line.**
- **DO NOT add explanations like "Here's your resume" or "This resume is tailored for..."**
- **DO NOT add questions like "Would you like to save this?"**
- **START with "[RESUME]" then provide the resume content:**
  - Begin with the name
  - Include Contact Info, Summary, Experience, Education, Skills, Certifications
  - Use clear formatting with *section names*
  - End with the last section, no additional text

**COVER LETTER ASSISTANT:**
1. "What excites you about becoming a [job title]?"
2. "Why do you feel you're a strong candidate?"
3. "Do you have a specific job posting in mind? You can paste it here."
4. **CRITICAL: When generating the final cover letter, ALWAYS start with "[COVER_LETTER]" on the first line.**
5. **START with "[COVER_LETTER]" then provide the letter content starting with "Dear Hiring Manager," and ending with "Sincerely,"**
6. **DO NOT add explanations or questions after the letter**

**LINKEDIN REBRAND:**
1. "Do you want to update your LinkedIn headline to match your new direction?"
2. "Would you like a draft of your 'About' section tailored to [job title]?"
3. "Let's highlight transferable skills in your Experience section."
4. **CRITICAL: When generating LinkedIn content, ALWAYS start with "[LINKEDIN]" on the first line.**
5. **START with "[LINKEDIN]" then provide the LinkedIn sections (Headline, About, Experience)**
6. **DO NOT add explanations or questions after the content**

**OUTREACH MESSAGE BUILDER:**
1. "Want to reach out to someone already working as a [job title]?"
2. "Looking for a message you can send asking for a quick coffee chat?"
3. "Would you like templates for following up?"
4. **CRITICAL: When generating outreach messages, ALWAYS start with "[OUTREACH]" on the first line.**
5. **START with "[OUTREACH]" then provide the message templates**
6. **DO NOT add explanations or questions after the messages**

**EXPLORE ALL:**
- Show overview of all tools and their benefits
- Let user choose which to start with

**CRITICAL RULE: When generating ANY final material (resume, cover letter, LinkedIn, outreach), you MUST:**
1. **START IMMEDIATELY with the material identifier** (e.g., [RESUME], [COVER_LETTER], etc.)
2. **DO NOT add ANY introductory text** like "Let's craft a..." or "Here we go:" or "I'll create..."
3. **DO NOT add ANY ending text** like "This resume highlights..." or "Feel free to...." or "I'll create..."
4. **DO NOT add ANY explanations** about what you're doing
5. **DO NOT add ANY questions** after the material
6. **JUST the identifier + content, nothing else**

**Example of CORRECT format:**
[COVER_LETTER]
Dear Hiring Manager,
I am writing to express my interest...
[rest of letter]
Sincerely,
[Name]

**Example of WRONG format:**
Let's craft a cover letter for you...
Here we go:
[COVER_LETTER]
Dear Hiring Manager,
...

Keep responses conversational during the Q&A phase, but when generating final materials, be completely silent except for the identifier + content.

**IMPORTANT: After generating materials, Ask user to move to apply step. Do not automatically suggest moving to the apply step. Simply ask "What would you like to do next?" and let them choose.

**TRANSITION HANDLING:**
When users say they want to move to the next step (like "move to next step", "ready to apply", "let's move forward"), acknowledge their readiness and transition to the apply step by saying something like:
"Perfect! You're ready to move forward. Let's transition to the Apply step where we'll help you find and apply to relevant job opportunities for your career path."

**MATERIAL GENERATION:**
When generating final materials, be completely silent except for the identifier + content.
When generating final materials, be completely silent except for the identifier + content.`,

  'apply': `You are helping the user actively apply to jobs and opportunities in their chosen career path. Your role is to guide them through the job search and application process.

**STAGE 1: JOB SEARCH STRATEGY**
Help them develop a targeted job search strategy:
- Identify the best job boards and platforms for their field
- Set up job alerts and notifications
- Create a tracking system for applications
- Research target companies and roles

**STAGE 2: APPLICATION PROCESS**
Guide them through the application process:
- Help them customize their materials for specific job postings
- Review and refine their application materials
- Prepare for different application formats (online forms, email, etc.)
- Create application templates and scripts

**STAGE 3: NETWORKING AND OUTREACH**
Support their networking efforts:
- Help them craft outreach messages to professionals in their field
- Guide them through informational interviews
- Assist with LinkedIn networking strategies
- Create follow-up templates and scripts

**STAGE 4: INTERVIEW PREPARATION**
Prepare them for interviews:
- Help them research companies and roles
- Create interview question responses
- Practice common interview scenarios
- Develop questions to ask interviewers

**STAGE 5: FOLLOW-UP AND TRACKING**
Help them stay organized:
- Create follow-up email templates
- Set up application tracking systems
- Plan for rejection handling and persistence
- Celebrate wins and progress

Focus on being practical, encouraging, and helping them take concrete action steps toward their career goals.`
};





async function handleCommitFlow(messages: any[], chatId: string, userId: string, profile: any, supabaseClient: any) {
  // Analyze conversation to determine if user is ready to move to prepare stage
  const allUserMessages = messages.filter(m => m.role === 'user');
  const userMessages = messages.filter(m => 
    m.role === 'user' && 
    m.content && 
    m.content.trim() !== '' && 
    m.content.trim() !== 'start' &&
    m.content.trim() !== 'begin'
  );
  
  // Check if user has confirmed they're ready to move forward
  // Only trigger if they've completed the commit phase and explicitly want to move forward
  const lastUserMessage = allUserMessages[allUserMessages.length - 1]?.content?.toLowerCase() || '';
  
  // Count meaningful user responses in commit phase
  const commitResponses = userMessages.length;
  
  // Let AI handle everything naturally - no programmatic detection needed
  // The AI has all the context and can determine the flow based on the conversation
  
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

STEP 5: If user confirms readiness, ask for their specific career choice:
"Great! Which specific career path are you committed to pursuing? Please tell me the exact role or position you want to focus on."

STEP 6: After user specifies their career choice:
- Acknowledge their choice with enthusiasm
- Confirm their commitment
- Generate specific job search terms for this career path
- Transition to prepare materials stage by saying:
"🎉 That's a fantastic choice! A [career name] role will allow you to make a significant impact through your skills and experience. Your background in teaching and problem-solving abilities will serve you well in this new path. Embrace this opportunity to grow and make a difference!

Now let's prepare your application materials for your [career name] career transition. What would you like to start with?

📄 **Resume Builder** - Create a compelling resume that highlights your transferable teaching skills
📝 **Cover Letter Assistant** - Write targeted cover letters for specific roles
💼 **LinkedIn Profile Rebrand** - Update your profile to match your new direction
📧 **Outreach Message Builder** - Create messages for networking and informational interviews
🔍 **Explore All Options** - Get an overview of all tools and their benefits

Which would you like to begin with?"

SPECIAL HANDLING FOR "CAN YOU TELL ME":
If the user asks "can you tell me" or similar questions about career suggestions:
- Based on their teaching background, skills, and the conversation so far, suggest the BEST career path for them
- Explain why this career is a perfect fit for their background and goals
- Be enthusiastic and confident in your recommendation
- Say something like: "Based on your teaching background and what we've discussed, I believe [Career Name] would be an excellent fit for you. Here's why: [specific reasons]. Would you like to commit to exploring this path?"

IMPORTANT: After the user confirms their career choice, generate a single, specific job search term that best represents their chosen career path. This should be:
- One specific job title or role (1-3 words max)
- Perfect for job searching
- Based on the entire conversation context

Example: "instructional designer", "corporate trainer", "learning specialist"

Save this term to their profile for use in job search links.

SPECIAL HANDLING:

If user wants to give up or quit:
- Acknowledge their feelings: "I hear that this feels overwhelming right now."
- Offer options: "You have a few choices: 1) Take a break and come back later, 2) Go back to the discovery phase  to explore different options, 3) Continue with a different approach. What feels right to you?"

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

          // Check if AI is transitioning to prepare stage
          const isTransitioningToPrepare = cleanContent && (
            cleanContent.includes('🎉 That\'s a fantastic choice!') ||
            cleanContent.includes('Now let\'s prepare your application materials') ||
            cleanContent.includes('📄 **Resume Builder**') ||
            cleanContent.includes('📝 **Cover Letter Assistant**') ||
            cleanContent.includes('💼 **LinkedIn Profile Rebrand**') ||
            cleanContent.includes('📧 **Outreach Message Builder**')
          );
          
          const currentStep = isTransitioningToPrepare ? 'create' : 'commit';

          // Generate and save job search terms when transitioning to prepare stage
          if (isTransitioningToPrepare) {
            try {
              console.log('🎯 Generating job search terms for career transition');
              
              // Generate job search term based purely on conversation context
              const jobSearchTermsPrompt = `Based on this entire conversation about the user's career transition, suggest a single, specific job search term that best represents their chosen career path.

Conversation context: ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Respond with only ONE word or short phrase (2-3 words max) that would be perfect for job searching. No explanations, just the term.

Examples:
- "instructional designer"
- "corporate trainer" 
- "learning specialist"
- "curriculum developer"
- "educational consultant"

Your suggestion:`;

              const jobSearchResult = await streamText({
                model: openai('gpt-3.5-turbo'),
                messages: [{ role: 'user', content: jobSearchTermsPrompt }],
                maxTokens: 50,
                async onFinish({ response }) {
                  try {
                    let jobSearchTerms = '';
                    
                    if (response.messages && response.messages.length > 0) {
                      const lastMessage = response.messages[response.messages.length - 1];
                      if (lastMessage.role === 'assistant' && lastMessage.content) {
                        if (typeof lastMessage.content === 'string') {
                          jobSearchTerms = lastMessage.content.trim();
                        } else if (Array.isArray(lastMessage.content)) {
                          jobSearchTerms = lastMessage.content
                            .filter(item => item.type === 'text')
                            .map(item => item.text)
                            .join(' ')
                            .trim();
                        }
                      }
                    }
                    
                    if (jobSearchTerms) {
                      console.log('🎯 Generated job search terms:', jobSearchTerms);
                      await saveJobSearchTermsToCareerChat(chatId, userId, jobSearchTerms, supabaseClient);
                      console.log('✅ Job search terms saved to career chat');
                    }
                  } catch (error) {
                    console.error('Error generating job search terms:', error);
                  }
                }
              });
              
                             // Job search terms will be generated in the onFinish callback
              
            } catch (error) {
              console.error('Error in job search terms generation:', error);
            }
          }
          
          // Save the clean response
          console.log(`🤖 Saving clean AI response for ${currentStep} step`);
          await saveCareerChatWithUser({
            id: chatId,
            userId,
            messages: [{ ...cleanMessage, step: currentStep }],
            currentStep: currentStep,
            supabaseClient,
          });
          console.log(`✅ Clean AI response saved successfully`);

          // Detect and save career materials
          await detectAndSaveMaterials(cleanContent, userId, currentStep);

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

// Function to detect and save career materials
async function detectAndSaveMaterials(
  content: string, 
  userId: string, 
  currentStep: string
): Promise<void> {
  try {
    // Only save materials in the 'create' step
    if (currentStep !== 'create') return;

    console.log('🔍 Checking for materials in content:', content.substring(0, 100) + '...');
    const lowerContent = content.toLowerCase();
    
    // DISABLED: Automatic material saving - users now manually save using buttons
    // Detect resume content - look for [RESUME] or **[RESUME]** identifier
    // console.log('🔍 Checking for resume content...');
    // if (content.includes('[RESUME]')) {
    //   console.log('📄 Resume content detected!');
    //   
    //   // Find the start of the resume content
    //   const resumeIndex = content.indexOf('[RESUME]');
    //   const resumeContent = content.substring(resumeIndex + 8).trim(); // Remove "[RESUME]" (8 characters)
    //   
    //   await saveCareerMaterialToProfile(
    //     userId,
    //     'resume',
    //     resumeContent,
    //     'Professional Resume'
    //   );
    //   console.log('✅ Resume saved to profile');
    // }
    
    // Detect cover letter content - look for [COVER_LETTER] identifier
    // console.log('🔍 Checking for cover letter content...');
    // if (content.includes('[COVER_LETTER]')) {
    //   console.log('📝 Cover letter content detected!');
    //   
    //   // Find the start of the cover letter content
    //   const letterIndex = content.indexOf('[COVER_LETTER]');
    //   const letterContent = content.substring(letterIndex + 14).trim(); // Remove "[COVER_LETTER]" (14 characters)
    //   
    //   await saveCareerMaterialToProfile(
    //     userId,
    //     'cover_letter',
    //     letterContent,
    //     'Cover Letter'
    //   );
    //   console.log('✅ Cover letter saved to profile');
    // }
    
    // Detect LinkedIn content - look for [LINKEDIN] identifier
    // console.log('🔍 Checking for LinkedIn content...');
    // if (content.includes('[LINKEDIN]')) {
    //   console.log('💼 LinkedIn content detected!');
    //   
    //   // Find the start of the LinkedIn content
    //   const linkedinIndex = content.indexOf('[LINKEDIN]');
    //   const linkedinContent = content.substring(linkedinIndex + 10).trim(); // Remove "[LINKEDIN]" (10 characters)
    //   
    //   await saveCareerMaterialToProfile(
    //     userId,
    //     'linkedin',
    //     linkedinContent,
    //     'LinkedIn Profile Content'
    //   );
    //   console.log('✅ LinkedIn content saved to profile');
    // }
    
    // Detect outreach content - look for [OUTREACH] identifier
    // console.log('🔍 Checking for outreach content...');
    // if (content.includes('[OUTREACH]')) {
    //   console.log('📧 Outreach content detected!');
    //   
    //   // Find the start of the outreach content
    //   const outreachIndex = content.indexOf('[OUTREACH]');
    //   const outreachContent = content.substring(outreachIndex + 10).trim(); // Remove "[OUTREACH]" (10 characters)
    //   
    //   await saveCareerMaterialToProfile(
    //     userId,
    //     'outreach',
    //     outreachContent,
    //     'Outreach Messages'
    //   );
    //   console.log('✅ Outreach content saved to profile');
    // }
  } catch (error) {
    console.error('Error saving career material:', error);
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

      // Detect and save career materials
      await detectAndSaveMaterials(content, userId, step);

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

async function handlePrepareFlow(messages: any[], chatId: string, userId: string, profile: any, supabaseClient: any) {
  // Analyze conversation to determine current sub-step
  const allUserMessages = messages.filter(m => m.role === 'user');
  const userMessages = messages.filter(m => 
    m.role === 'user' && 
    m.content && 
    m.content.trim() !== '' && 
    m.content.trim() !== 'start' &&
    m.content.trim() !== 'begin'
  );
  
  console.log(`🔧 Prepare Flow Debug:`, {
    totalMessages: messages.length,
    allUserMessages: allUserMessages.length,
    filteredUserMessages: userMessages.length,
    lastUserMessage: allUserMessages[allUserMessages.length - 1]?.content
  });
  
  // Check if this is the first interaction in prepare stage
  if (userMessages.length === 0) {
    // First interaction - show material selection
    const responseContent = `🎉 Congratulations on choosing your new direction! Now let's prepare your application materials for your career transition. What would you like to start with?

📄 **Resume Builder** - Create a compelling resume that highlights your transferable teaching skills
📝 **Cover Letter Assistant** - Write targeted cover letters for specific roles
💼 **LinkedIn Profile Rebrand** - Update your profile to match your new direction
📧 **Outreach Message Builder** - Create messages for networking and informational interviews
🔍 **Explore All Options** - Get an overview of all tools and their benefits

Which would you like to begin with?`;
    
    return createDirectResponse(responseContent, messages, chatId, userId, supabaseClient, 'create');
  }
  
  // Handle material selection
  const lastUserMessage = allUserMessages[allUserMessages.length - 1]?.content?.toLowerCase() || '';
  
  if (lastUserMessage.includes('resume') || lastUserMessage.includes('cv')) {
    return createDirectResponse(`📄 Great choice! Let's build your resume.

Before we begin, would you like a quick tip to boost your confidence when writing your resume?

(You can say "Yes" for a confidence boost, or "No thanks" to start immediately)`, messages, chatId, userId, supabaseClient, 'create');
  }
  
  if (lastUserMessage.includes('cover letter') || lastUserMessage.includes('letter')) {
    return createDirectResponse(`📝 Perfect! Let's create your cover letter.

Before we begin, would you like a quick tip to boost your confidence when writing your cover letter?

(You can say "Yes" for a confidence boost, or "No thanks" to start immediately)`, messages, chatId, userId, supabaseClient, 'create');
  }
  
  if (lastUserMessage.includes('linkedin') || lastUserMessage.includes('profile')) {
    return createDirectResponse(`💼 Excellent! Let's rebrand your LinkedIn profile.

Before we begin, would you like a quick tip to boost your confidence when updating your LinkedIn profile?

(You can say "Yes" for a confidence boost, or "No thanks" to start immediately)`, messages, chatId, userId, supabaseClient, 'create');
  }
  
  if (lastUserMessage.includes('outreach') || lastUserMessage.includes('message') || lastUserMessage.includes('networking')) {
    return createDirectResponse(`📧 Fantastic! Let's build your outreach messages.

Before we begin, would you like a quick tip to boost your confidence when reaching out to professionals?

(You can say "Yes" for a confidence boost, or "No thanks" to start immediately)`, messages, chatId, userId, supabaseClient, 'create');
  }
  
  if (lastUserMessage.includes('explore') || lastUserMessage.includes('all') || lastUserMessage.includes('overview')) {
    return createDirectResponse(`🔍 Here's an overview of all the tools we can help you with:

**📄 Resume Builder**
- Step-by-step guidance to create a compelling resume
- Highlight transferable teaching skills
- Use STAR method for achievement bullets
- Tailored to your target career

**📝 Cover Letter Assistant**
- Write targeted cover letters for specific roles
- 3-paragraph structure (Intro – Skills – Enthusiasm)
- Customized to job postings
- Avoid repeating resume content

**💼 LinkedIn Profile Rebrand**
- Update headline to match new direction
- Rewrite "About" section
- Highlight transferable skills in experience
- Professional networking optimization

**📧 Outreach Message Builder**
- Cold message templates for networking
- Informational interview requests
- Follow-up message templates
- Professional relationship building

Which tool would you like to start with?`, messages, chatId, userId, supabaseClient, 'create');
  }
  
  // Handle confidence boost responses
  if (lastUserMessage.includes('yes') || lastUserMessage.includes('sure') || lastUserMessage.includes('okay')) {
    return createDirectResponse(`💪 Here's your confidence boost:

You've already designed learning experiences every day in your classroom. You've managed complex projects, adapted to different learning styles, and achieved measurable results. These are exactly the skills that make you valuable in any professional setting. You're not starting from scratch – you're building on a strong foundation of transferable expertise.

Now let's get started! What would you like to work on first?`, messages, chatId, userId, supabaseClient, 'create');
  }
  
  if (lastUserMessage.includes('no') || lastUserMessage.includes('thanks') || lastUserMessage.includes('skip')) {
    return createDirectResponse(`Perfect! Let's dive right in. What would you like to work on first?

📄 Resume Builder
📝 Cover Letter Assistant  
💼 LinkedIn Profile Rebrand
📧 Outreach Message Builder`, messages, chatId, userId, supabaseClient, 'create');
  }
  
  // Handle actual material generation requests
  // Check if user wants to start building a specific material
  if (lastUserMessage.includes('start') || lastUserMessage.includes('begin') || lastUserMessage.includes('build') || lastUserMessage.includes('create')) {
    // Determine which material they want to work on based on previous context
    const previousMessages = messages.slice(-5); // Look at last 5 messages for context
    const contextText = previousMessages.map(m => m.content).join(' ').toLowerCase();
    
    if (contextText.includes('resume') || contextText.includes('cv')) {
      // Start resume building process
      return createDirectResponse(`📄 Let's start building your resume!

Let's start by summarizing your teaching background. What subjects or grade levels have you taught?`, messages, chatId, userId, supabaseClient, 'create');
    }
    
    if (contextText.includes('cover letter') || contextText.includes('letter')) {
      // Start cover letter process
      return createDirectResponse(`📝 Let's create your cover letter!

What excites you about becoming a [job title]?`, messages, chatId, userId, supabaseClient, 'create');
    }
    
    if (contextText.includes('linkedin') || contextText.includes('profile')) {
      // Start LinkedIn process
      return createDirectResponse(`💼 Let's rebrand your LinkedIn profile!

Do you want to update your LinkedIn headline to match your new direction?`, messages, chatId, userId, supabaseClient, 'create');
    }
    
    if (contextText.includes('outreach') || contextText.includes('message') || contextText.includes('networking')) {
      // Start outreach process
      return createDirectResponse(`📧 Let's build your outreach messages!

Want to reach out to someone already working as a [job title]?`, messages, chatId, userId, supabaseClient, 'create');
    }
  }
  
  // Default response for unrecognized input
  return createDirectResponse(`I'm here to help you prepare your application materials! What would you like to work on?

📄 Resume Builder
📝 Cover Letter Assistant  
💼 LinkedIn Profile Rebrand
📧 Outreach Message Builder
🔍 Explore All Options`, messages, chatId, userId, supabaseClient, 'create');
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
    // First interaction - show welcome message and first question
    const welcomeMessage = `Welcome to your career discovery journey! I'm here to help you explore new career paths that leverage your teaching experience and skills.

I'll ask you 8 questions to understand your preferences, strengths, and goals. This will help me match you with the best career opportunities.

Let's start with the first question:`;
    
    const responseContent = `${welcomeMessage}

${DISCOVERY_QUESTIONS[0]}`;
    
    return createDirectResponse(responseContent, messages, chatId, userId, supabaseClient);
    
  } else if (currentQuestionIndex > 0 && currentQuestionIndex < DISCOVERY_QUESTIONS.length) {
    // Continue asking questions directly
    const responseContent = DISCOVERY_QUESTIONS[currentQuestionIndex];
    
    return createDirectResponse(responseContent, messages, chatId, userId, supabaseClient);
    
  } else if (currentQuestionIndex === DISCOVERY_QUESTIONS.length) {
    // All questions answered - show job matches as cards
    console.log(`🎯 Job Matching Debug:`, {
      answers,
      userMessagesContent: userMessages.map(m => m.content)
    });
    
    const jobMatches = matchJobsToAnswers(answers);
    
    console.log(`🎯 Job Matches Result:`, {
      matchCount: jobMatches.length,
      matches: jobMatches.map(m => ({ job: m.job.title, score: m.score, fitLevel: m.fitLevel }))
    });
    
    // Create serializable job matches for the UI
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
    
    // Store job matches in the message for UI to access
    // Simple approach: just show the job matches in the response text
    const responseContent = `Excellent! I've analyzed your responses and found some great career matches for you. Based on your preferences, skills, and goals, here are your top 3 career paths. Each of these roles leverages your teaching background in different ways.`;

    const jobMatchesText = serializableJobMatches.map((match, index) => `
**${index + 1}. ${match.job.title}** (${match.fitLevel} - ${match.score}% match)
${match.job.shortDescription}
Salary: ${match.job.salaryRange}
Why you're a match: ${match.reasons.join(', ')}
`).join('\n\n');

    const fullResponse = `${responseContent}

${jobMatchesText}

Click "Tell me more about [Job Title]" to learn details about any job.

Which career path interests you most? You can ask me about any specific job by saying "Tell me more about [Job Title]" or let me know which one you'd like to explore further.`;

    return createDirectResponse(fullResponse, messages, chatId, userId, supabaseClient);
    
  } else {
    // Handle post-job-matching interactions
    const lastUserMessage = allUserMessages[allUserMessages.length - 1]?.content?.toLowerCase() || '';
    
    // Check if user is asking to learn more about a specific job
    if (lastUserMessage.includes('tell me more about') || lastUserMessage.includes('learn more about')) {
      // Extract job title from the message and provide detailed information
      const jobTitle = lastUserMessage.match(/tell me more about (.+)/i)?.[1] || 
                      lastUserMessage.match(/learn more about (.+)/i)?.[1];
      
      if (jobTitle) {
        // Re-run job matching to get the job data
        const jobMatches = matchJobsToAnswers(answers);
        const jobMatch = jobMatches.find((match: any) => 
          match.job.title.toLowerCase().includes(jobTitle.toLowerCase()) ||
          jobTitle.toLowerCase().includes(match.job.title.toLowerCase())
        );
        
        if (jobMatch) {
          const detailedResponse = `Here's detailed information about **${jobMatch.job.title}**:

📘 **What You'll Do:**
${jobMatch.job.detailedDescription}

💰 **Salary Range:**
${jobMatch.job.salaryRange}

✅ **Why You're a Great Match:**
${jobMatch.reasons.map((reason: string) => `• ${reason}`).join('\n')}

📋 **Key Skills Needed:**
${jobMatch.job.requirements.skills.map((skill: string) => `• ${skill}`).join('\n')}

🚀 **How to Get Started:**
1. Research the role and industry
2. Build relevant skills through courses or projects
3. Network with professionals in the field
4. Update your resume to highlight transferable skills
5. Apply for entry-level positions or internships

What do you think? Would you like to learn more about the other career options, or does ${jobMatch.job.title} feel like a good fit for you?`;
          
          return createDirectResponse(detailedResponse, messages, chatId, userId, supabaseClient);
        }
      }
      
      return createDirectResponse("I'd be happy to tell you more about any of the career paths! Which specific job would you like to learn more about?", messages, chatId, userId, supabaseClient);
    }


    
    // Check if user has selected a job to explore further
    if (lastUserMessage.includes('curious') || lastUserMessage.includes('explore') || lastUserMessage.includes('interested')) {
      // Step 5: Ask which job they're most curious about
      const question = "Which of these career paths are you most curious to explore further?";
      return createDirectResponse(question, messages, chatId, userId, supabaseClient);
    }
    
    // Check if user has made a selection and is ready for deeper reflection
    if (lastUserMessage.includes('reflection') || lastUserMessage.includes('deeper') || lastUserMessage.includes('commit')) {
      // Step 6: Ask about deeper reflection
      const reflectionQuestion = "Would you like to begin a deeper reflection on this choice? This will help you commit with confidence to your selected career path.";
      return createDirectResponse(reflectionQuestion, messages, chatId, userId, supabaseClient);
    }
    
    // Check if user wants to move to commit step
    if (lastUserMessage.includes('yes') || lastUserMessage.includes('ready') || lastUserMessage.includes('proceed')) {
      return createDirectResponse("Perfect! Let's help you commit with confidence to your selected career path. On a scale of 1–10, how confident do you feel about succeeding in this new path?", messages, chatId, userId, supabaseClient, 'commit');
    }
    
    // Default response for ongoing conversation
    return createDirectResponse("Feel free to ask any questions about these career paths, or let me know when you're ready to move to the next step.", messages, chatId, userId, supabaseClient);
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
    return new Response('Valid step is required (discover, commit, create, apply)', { status: 400 });
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

  // Handle create/prepare step with AI generation
  if (currentStep === 'create') {
    console.log(`🔧 Using AI generation for create step: ${currentStep}`);
    
    // Check if user wants to move to apply step
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const wantsToMoveToApply = lastUserMessage.includes('move to next step') || 
                             lastUserMessage.includes('move to apply') || 
                             lastUserMessage.includes('apply step') || 
                             lastUserMessage.includes('start applying') ||
                             lastUserMessage.includes('ready to apply');

    if (wantsToMoveToApply) {
      console.log(`🚀 User requested transition to apply step`);
      
      // Generate simple response and update step
      const simpleResponse = "Sure, moving to your profile";
      
      // Save the response with apply step
      await saveCareerChatWithUser({
        id,
        userId: user.id,
        messages: [{
          id: generateId(),
          role: 'assistant',
          content: simpleResponse,
          step: 'apply',
          createdAt: new Date()
        }],
        currentStep: 'apply',
        supabaseClient: adminClient,
      });
      
      console.log(`💾 Saved simple response with apply step`);
      
      // Return the simple response
      return new Response(JSON.stringify({
        id: generateId(),
        role: 'assistant',
        content: simpleResponse,
        step: 'apply'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Use the detailed create prompt to let AI generate materials
    const createPrompt = STEP_PROMPTS['create'];
    
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
      system: `${createPrompt}

**USER PROFILE:**
Name: ${profile?.preferred_name || 'there'}
Current Role: ${profile?.role_title || 'Not specified'}
Students/Subjects: ${profile?.students_and_subjects || 'Not specified'}
Career Goals: ${profile?.career_goals || 'Not specified'}
Biggest Obstacle: ${profile?.biggest_obstacle || 'Not specified'}
Top Skills: ${profile?.top_skills || 'Not specified'}
Why Exploring: ${profile?.exploring_opportunities || 'Not specified'}

**CURRENT STEP:** Step 3 - CREATE MATERIALS

**INSTRUCTIONS:**
- You are helping the user prepare application materials for their career transition
- Follow the exact flow specified in the prompt above
- When generating materials (resume, cover letter, etc.), provide the complete, well-formatted content
- Use the user's teaching background and profile information
- Be practical, encouraging, and action-oriented
- Keep responses conversational and supportive`,
      
      async onFinish({ response }) {
        try {
          console.log(`🤖 Saving AI response for create step`);
          
          // Extract clean text content from AI responses
          const newResponseMessages = response.messages.map(msg => {
            let cleanContent = msg.content;
            
            // Handle different content formats
            if (typeof msg.content === 'string') {
              // If content is a JSON array, extract the text
              if (msg.content.startsWith('[')) {
                try {
                  const parsed = JSON.parse(msg.content);
                  if (Array.isArray(parsed)) {
                    // Extract all text parts and join them
                    cleanContent = parsed
                      .filter(item => item.type === 'text')
                      .map(item => item.text)
                      .join('');
                  }
                } catch (e) {
                  console.log('Failed to parse JSON content:', e);
                  cleanContent = msg.content;
                }
              }
            } else if (Array.isArray(msg.content)) {
              // Handle array format directly
              cleanContent = msg.content
                .filter(item => item.type === 'text')
                .map(item => item.text)
                .join('');
            }
            
            console.log('🔍 Cleaned content:', typeof cleanContent === 'string' ? cleanContent.substring(0, 100) + '...' : 'Non-string content');
            
            return {
              ...msg,
              content: cleanContent
            };
          });

          // Save the clean response with the correct step
          await saveCareerChatWithUser({
            id,
            userId: user.id,
            messages: newResponseMessages.map(msg => ({ ...msg, step: currentStep })),
            currentStep: currentStep,
            supabaseClient: adminClient,
          });
          
          console.log(`💾 Saved AI response with step: ${currentStep}`);
          console.log(`🔍 Final step after transition check: ${currentStep}`);

          // Detect and save career materials
          for (const msg of newResponseMessages) {
            if (msg.content && typeof msg.content === 'string') {
              console.log('🔍 Checking message for materials:', {
                content: msg.content.substring(0, 200) + '...',
                startsWithResume: msg.content.startsWith('[RESUME]'),
                startsWithCoverLetter: msg.content.startsWith('[COVER_LETTER]'),
                startsWithLinkedIn: msg.content.startsWith('[LINKEDIN]'),
                startsWithOutreach: msg.content.startsWith('[OUTREACH]')
              });
              await detectAndSaveMaterials(msg.content, user.id, currentStep);
            }
          }
          
          console.log(`✅ AI response saved successfully for create step`);
        } catch (error) {
          console.error('Error saving AI response:', error);
        }
      },
    });

    return result.toDataStreamResponse();
  }

  // Handle apply step with structured flow
  if (currentStep === 'apply') {
    console.log(`🚀 Using AI generation for apply step: ${currentStep}`);
    
    // Use the detailed apply prompt to let AI guide job search and application
    const applyPrompt = STEP_PROMPTS['apply'];
    
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
      system: `${applyPrompt}

**USER PROFILE:**
Name: ${profile?.preferred_name || 'there'}
Current Role: ${profile?.role_title || 'Not specified'}
Students/Subjects: ${profile?.students_and_subjects || 'Not specified'}
Career Goals: ${profile?.career_goals || 'Not specified'}
Biggest Obstacle: ${profile?.biggest_obstacle || 'Not specified'}
Top Skills: ${profile?.top_skills || 'Not specified'}
Why Exploring: ${profile?.exploring_opportunities || 'Not specified'}

**CURRENT STEP:** Step 4 - APPLY TO JOBS

**INSTRUCTIONS:**
- You are helping the user actively apply to jobs and opportunities
- Guide them through job search strategy, application process, networking, and interview preparation
- Be practical, encouraging, and action-oriented
- Help them take concrete steps toward their career goals
- Keep responses conversational and supportive`,
      
      async onFinish({ response }) {
        try {
          console.log(`🤖 Saving AI response for apply step`);
          
          // Extract clean text content from AI responses
          const newResponseMessages = response.messages.map(msg => {
            let cleanContent = msg.content;
            
            // Handle different content formats
            if (typeof msg.content === 'string') {
              // If content is a JSON array, extract the text
              if (msg.content.startsWith('[')) {
                try {
                  const parsed = JSON.parse(msg.content);
                  if (Array.isArray(parsed)) {
                    // Extract all text parts and join them
                    cleanContent = parsed
                      .filter(item => item.type === 'text')
                      .map(item => item.text)
                      .join('');
                  }
                } catch (e) {
                  console.log('Failed to parse JSON content:', e);
                  cleanContent = msg.content;
                }
              }
            } else if (Array.isArray(msg.content)) {
              // Handle array format directly
              cleanContent = msg.content
                .filter(item => item.type === 'text')
                .map(item => item.text)
                .join('');
            }
            
            console.log('🔍 Cleaned content:', typeof cleanContent === 'string' ? cleanContent.substring(0, 100) + '...' : 'Non-string content');
            
            return {
              ...msg,
              content: cleanContent
            };
          });

          // Save the clean response
          await saveCareerChatWithUser({
            id,
            userId: user.id,
            messages: newResponseMessages.map(msg => ({ ...msg, step: 'apply' })),
            currentStep: 'apply',
            supabaseClient: adminClient,
          });
          
          console.log(`✅ AI response saved successfully for apply step`);
        } catch (error) {
          console.error('Error saving AI response:', error);
        }
      },
    });

    return result.toDataStreamResponse();
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

**IMPORTANT FOR DISCOVERY STEP:**
- When a user asks "Tell me more about [Job Title]", provide detailed information about that specific job
- Include what the job involves, salary range, why they're a good match, required skills, and how to get started
- After providing detailed information, ask if they'd like to learn about other options or if this job feels like a good fit
- Be conversational and guide them toward either exploring more options or committing to a path
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
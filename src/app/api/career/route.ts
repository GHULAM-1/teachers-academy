import { openai } from "@ai-sdk/openai";
import { streamText, appendResponseMessages, generateId } from "ai";
import {
  saveCareerChatWithUser,
  updateCareerChatTitleWithUser,
} from "@/lib/career-chat-store";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase";

import {
  detectMindsetTriggers,
  MINDSET_TOOLS,
  getMindsetToolById,
} from "@/lib/mindset-tools";
import {
  saveCareerMaterialToProfile,
  MaterialType,
} from "@/lib/career-materials";
import { saveJobSearchTermsToCareerChat } from "@/lib/career-chat-store";
import { CareerConfigService } from "@/lib/career-config";
import { cookies } from "next/headers";
import dotenv from "dotenv";

dotenv.config();

// Career steps will be loaded from SheetDB
let CAREER_STEPS: Record<string, number> = {};

// Step prompts will be loaded from SheetDB
let STEP_PROMPTS: Record<string, string> = {};

// Initialize SheetDB configuration
async function initializeCareerConfig() {
  try {
    const configService = CareerConfigService.getInstance();
    const config = await configService.getConfig();

    // Build CAREER_STEPS object dynamically
    CAREER_STEPS = {};
    config.careerSteps.forEach((step, index) => {
      CAREER_STEPS[step] = index + 1;
    });

    // Discovery questions are now handled by AI through the prompt

    // Set step prompts only
    STEP_PROMPTS = {
      discover: config.discoverStepPrompt,
      commit: config.commitStepPrompt,
      create: config.createStepPrompt,
      // Essential flow prompts only
      jobSearchTermsPrompt: config.jobSearchTermsPrompt,
    };

    // Debug: Log what we got from SheetDB
    console.log("🔍 Raw SheetDB config:", {
      discoverStepPrompt: config.discoverStepPrompt?.substring(0, 100) + "...",
      commitStepPrompt: config.commitStepPrompt?.substring(0, 100) + "...",
      createStepPrompt: config.createStepPrompt?.substring(0, 100) + "...",
      careerSteps: config.careerSteps,
    });
    
    // Check if commit prompt is properly loaded
    if (!config.commitStepPrompt || config.commitStepPrompt.length < 50) {
      console.error("❌ Commit prompt is empty or too short:", {
        length: config.commitStepPrompt?.length || 0,
        content: config.commitStepPrompt
      });
    } else {
      console.log("✅ Commit prompt loaded successfully, length:", config.commitStepPrompt.length);
    }

    console.log("✅ Career config initialized from SheetDB:", {
      steps: Object.keys(CAREER_STEPS),
      promptsCount: Object.keys(STEP_PROMPTS).length,
      stepPrompts: {
        discover: !!STEP_PROMPTS.discover,
        commit: !!STEP_PROMPTS.commit,
        create: !!STEP_PROMPTS.create,
      },
      careerSteps: CAREER_STEPS,
    });
  } catch (error) {
    console.error("❌ Failed to initialize career config from SheetDB:", error);
    throw new Error(
      "Failed to load career configuration from SheetDB - no fallback available"
    );
  }
}

async function handleCommitFlow(
  messages: any[],
  chatId: string,
  userId: string,
  profile: any,
  supabaseClient: any
) {
  try {
    // Get the full conversation context from database
    const { data: conversationHistory, error: historyError } = await supabaseClient
      .from("career_messages")
      .select("role, content, created_at")
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    
    if (historyError) {
      console.error("Error fetching conversation history:", historyError);
    }
    
    console.log(`🔍 Commit Flow - Conversation Context:`, {
      historyLength: conversationHistory?.length || 0,
      lastMessages: conversationHistory?.slice(-5).map((m: any) => `${m.role}: ${m.content.substring(0, 50)}...`) || []
    });
    
    // For commit step, start fresh to avoid confusion with discovery conversation
    // Only include the current user message, not previous conversation history
    const fullConversationContext = [
      ...messages
    ];
    
    console.log(`🧠 Commit Flow - Fresh context (no history):`, {
      currentMessagesLength: messages.length,
      totalContextLength: fullConversationContext.length
    });
    
    console.log(`🧠 Commit Flow - Fresh context (no history):`, {
      originalHistoryLength: conversationHistory?.length || 0,
      currentMessagesLength: messages.length,
      totalContextLength: fullConversationContext.length
    });
    
    // Use streamText but extract clean content before saving
    console.log(`🧠 Commit Flow - Using commit prompt:`, STEP_PROMPTS.commit?.substring(0, 200) + "...");
    console.log(`🧠 Commit Flow - Full prompt length:`, STEP_PROMPTS.commit?.length || 0);
    
    const result = await streamText({
      model: openai("gpt-3.5-turbo"),
      messages: fullConversationContext,
      system: `${STEP_PROMPTS.commit}

**USER PROFILE:**
Name: ${profile?.preferred_name || "there"}
Current Role: ${profile?.role_title || "Not specified"}

**COMMIT STEP ENFORCEMENT:**
You are now in the COMMIT step, NOT the discovery step. 

**FOLLOW EXACTLY:**
1. Start with STEP 1: Ask the FIRST question: "On a scale of 1–10, how confident do you feel about succeeding in this new path?"
2. Wait for their answer, then ask the NEXT question in sequence
3. Do NOT give generic advice about curriculum development
4. Do NOT continue the discovery conversation
5. Follow the 5-question sequence exactly as specified in your prompt

**CRITICAL: You are a Mindset Coach in the COMMIT phase. Follow the commit prompt structure exactly.**`,
      async onFinish({ response }) {
        try {
          console.log(`🤖 Processing AI response for commit step`);
          console.log(
            "🔍 Full response object:",
            JSON.stringify(response, null, 2)
          );
          console.log("🔍 Response messages:", response.messages);

          // Get the raw text content from the response
          let cleanContent = "";

          // Try multiple ways to extract the content
          if (response.messages && response.messages.length > 0) {
            console.log("🔍 Number of messages:", response.messages.length);

            // Look for the assistant message (should be the last one)
            for (let i = response.messages.length - 1; i >= 0; i--) {
              const msg = response.messages[i];
              console.log(`🔍 Message ${i}:`, msg);

              if (msg.role === "assistant" && msg.content) {
                if (typeof msg.content === "string") {
                  cleanContent = msg.content;
                  console.log(
                    "🔍 Found assistant message with string content:",
                    cleanContent
                  );
                  break;
                } else if (Array.isArray(msg.content)) {
                  // Handle array format: [{"type": "text", "text": "..."}]
                  const textParts = msg.content
                    .filter((item) => item.type === "text")
                    .map((item) => item.text)
                    .join("");
                  cleanContent = textParts;
                  console.log(
                    "🔍 Found assistant message with array content:",
                    cleanContent
                  );
                  break;
                }
              }
            }
          }

          // If still no content, try alternative approaches
          if (!cleanContent) {
            console.log("🔍 Trying alternative content extraction...");

            // Check if response has a text property
            if ((response as any).text) {
              cleanContent = (response as any).text;
              console.log("🔍 Found content in response.text:", cleanContent);
            }
            // Check if response has a content property
            else if ((response as any).content) {
              cleanContent = (response as any).content;
              console.log(
                "🔍 Found content in response.content:",
                cleanContent
              );
            }
          }

          console.log("🔍 Final clean content:", cleanContent);

          if (!cleanContent) {
            console.log("⚠️ No clean content found, using fallback");
            cleanContent = "I understand. Let me help you with that.";
          }

          // Extract only the motivational content (remove introductory text)
          let extractedContent = cleanContent;

          // Method 1: Extract content between quotes
          if (cleanContent.includes('"') && cleanContent.includes('"')) {
            const startQuote = cleanContent.indexOf('"');
            const endQuote = cleanContent.lastIndexOf('"');
            if (startQuote !== -1 && endQuote !== -1 && endQuote > startQuote) {
              const quotedContent = cleanContent.substring(
                startQuote + 1,
                endQuote
              );
              if (quotedContent.length > 20) {
                extractedContent = quotedContent;
                console.log("🔍 Extracted motivational content from quotes");
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
            "here's a motivational message to help you",
          ];

          let cleanedContent = extractedContent.toLowerCase();
          for (const phrase of introPhrases) {
            if (cleanedContent.includes(phrase)) {
              const phraseIndex = cleanedContent.indexOf(phrase);
              const afterPhrase = extractedContent.substring(
                phraseIndex + phrase.length
              );
              if (afterPhrase.trim().length > 20) {
                extractedContent = afterPhrase.trim();
                console.log("🔍 Removed introductory phrase:", phrase);
                break;
              }
            }
          }

          // Method 3: Find the actual motivational content after colons or newlines
          if (extractedContent.includes(":")) {
            const colonIndex = extractedContent.lastIndexOf(":");
            const afterColon = extractedContent
              .substring(colonIndex + 1)
              .trim();
            if (
              (afterColon.length > 20 && afterColon.includes("remember")) ||
              afterColon.includes("you")
            ) {
              extractedContent = afterColon;
              console.log("🔍 Extracted content after colon");
            }
          }

          cleanContent = extractedContent;

          // Remove the AUDIO_MESSAGE trigger from the final content
          if (cleanContent.includes("AUDIO_MESSAGE")) {
            cleanContent = cleanContent.replace("AUDIO_MESSAGE", "").trim();
            console.log("🔍 Content cleaned of AUDIO_MESSAGE trigger");
          }

          // Remove step transition markers from the final content
          if (cleanContent.includes("[STEP:create]")) {
            cleanContent = cleanContent.replace("[STEP:create]", "").trim();
            console.log("🔍 Content cleaned of [STEP:create] marker");
          }

          // Check if this is a voice recording request
          const isVoiceRecordingRequest = messages.some(
            (msg) =>
              msg.role === "user" &&
              msg.content &&
              typeof msg.content === "string" &&
              (msg.content.toLowerCase().includes("voice recording") ||
                msg.content.toLowerCase().includes("audio") ||
                msg.content.toLowerCase().includes("speech") ||
                msg.content.toLowerCase().includes("motivational message") ||
                msg.content.toLowerCase().includes("motivational") ||
                msg.content.toLowerCase().includes("pep talk"))
          );

          // Check for the hardcoded AUDIO_MESSAGE trigger
          const hasAudioMessageTrigger =
            cleanContent && cleanContent.includes("AUDIO_MESSAGE");

          console.log("🔍 Content length:", cleanContent?.length);
          console.log("🔍 Content preview:", cleanContent?.substring(0, 100));
          console.log(
            "🔍 Contains AUDIO_MESSAGE:",
            cleanContent?.includes("AUDIO_MESSAGE")
          );

          // Also check if the AI response looks like motivational content
          const isMotivationalContent =
            cleanContent &&
            cleanContent.length > 50 &&
            (cleanContent.toLowerCase().includes("you've got this") ||
              cleanContent.toLowerCase().includes("remember") ||
              cleanContent.toLowerCase().includes("believe in") ||
              cleanContent.toLowerCase().includes("you are capable") ||
              cleanContent.toLowerCase().includes("keep moving") ||
              cleanContent.toLowerCase().includes("stay focused"));

          const shouldShowVoiceRecording =
            (isVoiceRecordingRequest ||
              isMotivationalContent ||
              hasAudioMessageTrigger) &&
            cleanContent &&
            cleanContent.length > 20; // Only show for substantial content

          // Check for mindset triggers in the latest user message
          const latestUserMessage = messages
            .filter((msg) => msg.role === "user")
            .pop();
          const triggeredTools =
            latestUserMessage && typeof latestUserMessage.content === "string"
              ? detectMindsetTriggers(latestUserMessage.content)
              : [];

          // Create clean message object
          const cleanMessage = {
            id: generateId(),
            role: "assistant" as const,
            content: cleanContent,
            createdAt: new Date(),
            // Add metadata for voice recording
            ...(shouldShowVoiceRecording && {
              hasVoiceRecording: true,
              voiceRecordingText: cleanContent,
            }),
            // Add metadata for mindset tools
            ...(triggeredTools.length > 0 && {
              hasMindsetTools: true,
              mindsetTools: triggeredTools.map((tool) => ({
                id: tool.id,
                name: tool.name,
                description: tool.description,
                format: tool.format,
                prompt: tool.prompt,
              })),
            }),
          };

          console.log("🔍 Clean message with metadata:", cleanMessage);

          // Check if AI is transitioning to prepare stage
          const isTransitioningToPrepare =
            cleanContent &&
            (cleanContent.includes("🎉 That's a fantastic choice!") ||
              cleanContent.includes(
                "Now let's prepare your application materials"
              ) ||
              cleanContent.includes("📄 **Resume Builder**") ||
              cleanContent.includes("📝 **Cover Letter Assistant**") ||
              cleanContent.includes("💼 **LinkedIn Profile Rebrand**") ||
              cleanContent.includes("📧 **Outreach Message Builder**") ||
              cleanContent.includes("[STEP:create]"));

          const currentStep = isTransitioningToPrepare ? "create" : "commit";

          // Generate and save job search terms when transitioning to prepare stage
          if (isTransitioningToPrepare) {
            try {
              console.log(
                "🎯 Generating job search terms for career transition"
              );

              // Generate job search term based purely on conversation context
              const jobSearchTermsPrompt =
                STEP_PROMPTS.jobSearchTermsPrompt ||
                `Based on this entire conversation about the user's career transition, suggest a single, specific job search term that best represents their chosen career path.

Conversation context: ${messages
                  .map((m) => `${m.role}: ${m.content}`)
                  .join("\n")}

Respond with only ONE word or short phrase (2-3 words max) that would be perfect for job searching. No explanations, just the term.

Examples:
- "instructional designer"
- "corporate trainer" 
- "learning specialist"
- "curriculum developer"
- "educational consultant"

Your suggestion:`;

              const jobSearchResult = await streamText({
                model: openai("gpt-3.5-turbo"),
                messages: [{ role: "user", content: jobSearchTermsPrompt }],
                maxTokens: 50,
                async onFinish({ response }) {
                  try {
                    let jobSearchTerms = "";

                    if (response.messages && response.messages.length > 0) {
                      const lastMessage =
                        response.messages[response.messages.length - 1];
                      if (
                        lastMessage.role === "assistant" &&
                        lastMessage.content
                      ) {
                        if (typeof lastMessage.content === "string") {
                          jobSearchTerms = lastMessage.content.trim();
                        } else if (Array.isArray(lastMessage.content)) {
                          jobSearchTerms = lastMessage.content
                            .filter((item) => item.type === "text")
                            .map((item) => item.text)
                            .join(" ")
                            .trim();
                        }
                      }
                    }

                    if (jobSearchTerms) {
                      console.log(
                        "🎯 Generated job search terms:",
                        jobSearchTerms
                      );
                      await saveJobSearchTermsToCareerChat(
                        chatId,
                        userId,
                        jobSearchTerms,
                        supabaseClient
                      );
                      console.log("✅ Job search terms saved to career chat");
                    }
                  } catch (error) {
                    console.error("Error generating job search terms:", error);
                  }
                },
              });

              // Job search terms will be generated in the onFinish callback
            } catch (error) {
              console.error("Error in job search terms generation:", error);
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

          if (messages.length === 1 && messages[0].role === "user") {
            const title = `Career Commit Session`;
            await updateCareerChatTitleWithUser(
              chatId,
              title,
              userId,
              supabaseClient
            );
          }
        } catch (error) {
          console.error("Error saving clean response:", error);
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in commit flow:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process commit flow",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function createDirectResponse(
  content: string,
  messages: any[],
  chatId: string,
  userId: string,
  supabaseClient: any,
  step: string = "discover"
) {
  try {
    // Create a direct response without using streamText to avoid JSON formatting
    const responseMessage = {
      id: generateId(),
      role: "assistant" as const,
      content: content,
      createdAt: new Date(),
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

      // Set title for the first interaction (when we have 0 or 1 message)
      if (messages.length <= 1) {
        const title =
          step === "discover"
            ? `Career Discovery Session`
            : `Career ${step.charAt(0).toUpperCase() + step.slice(1)} Session`;
        await updateCareerChatTitleWithUser(
          chatId,
          title,
          userId,
          supabaseClient
        );
      }
    } catch (error) {
      console.error("Error saving direct response:", error);
    }

    // Return a streaming response that just outputs the content
    const result = await streamText({
      model: openai("gpt-3.5-turbo"),
      messages: [...messages],
      system: `You are a helpful assistant. Respond with exactly this text and nothing else: ${content}`,

      async onFinish({ response }) {
        // Title is already set when we save the direct response above
        // No need to save anything here since we saved it directly
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error creating direct response:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create response",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleDiscoverFlow(
  messages: any[],
  chatId: string,
  userId: string,
  profile: any,
  supabaseClient: any
) {
  // Let AI handle the entire discovery process naturally
  // AI will ask questions, determine when enough info is gathered, and suggest careers
  console.log(`🔍 Discovery Flow - AI handling entire process`);
  
  // Get the full conversation context from database
  const { data: conversationHistory, error: historyError } = await supabaseClient
    .from("career_messages")
    .select("role, content, created_at")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  
  if (historyError) {
    console.error("Error fetching conversation history:", historyError);
  }
  
  console.log(`🔍 Conversation Context:`, {
    historyLength: conversationHistory?.length || 0,
    lastMessages: conversationHistory?.slice(-5).map((m: any) => `${m.role}: ${m.content.substring(0, 50)}...`) || []
  });
  
  // For discover step, limit conversation history to avoid overwhelming the AI
  const limitedHistory = conversationHistory ? conversationHistory.slice(-5) : [];
  
  const fullConversationContext = [
    ...limitedHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    })),
    ...messages
  ];
  
  console.log(`🔍 Discovery Flow - Limited context:`, {
    originalHistoryLength: conversationHistory?.length || 0,
    limitedHistoryLength: limitedHistory.length,
    currentMessagesLength: messages.length,
    totalContextLength: fullConversationContext.length
  });
  
  // Use the discover prompt to let AI manage the discovery flow
  const discoverPrompt = STEP_PROMPTS.discover;
  
  console.log(`🔍 Discovery Flow - Using prompt from SheetDB:`, discoverPrompt?.substring(0, 200) + "...");
  console.log(`🔍 Discovery Flow - Full prompt length:`, discoverPrompt?.length || 0);
  
  const result = await streamText({
    model: openai("gpt-3.5-turbo"),
    messages: fullConversationContext,
    system: `${discoverPrompt}

**USER PROFILE:**
Name: ${profile?.preferred_name || "there"}
Current Role: ${profile?.role_title || "Not specified"}
Students/Subjects: ${profile?.students_and_subjects || "Not specified"}
Career Goals: ${profile?.career_goals || "Not specified"}
Biggest Obstacle: ${profile?.biggest_obstacle || "Not specified"}
Top Skills: ${profile?.top_skills || "Not specified"}
Why Exploring: ${profile?.exploring_opportunities || "Not specified"}

**CRITICAL: Follow the EXACT process in your prompt above. Do NOT deviate from the structured format.**`,

    async onFinish({ response }) {
      try {
        console.log(`🤖 Saving AI discovery response`);
        
        // Extract clean text content from AI responses
        const newResponseMessages = response.messages.map((msg) => {
          let cleanContent = msg.content;
          
          // Handle different content formats
          if (typeof msg.content === "string") {
            if (msg.content.startsWith("[")) {
              try {
                const parsed = JSON.parse(msg.content);
                if (Array.isArray(parsed)) {
                  cleanContent = parsed
                    .filter((item) => item.type === "text")
                    .map((item) => item.text)
                    .join("");
                }
              } catch (e) {
                console.log("Failed to parse JSON content:", e);
                cleanContent = msg.content;
              }
            }
          } else if (Array.isArray(msg.content)) {
            cleanContent = msg.content
              .filter((item) => item.type === "text")
              .map((item) => item.text)
              .join("");
          }
          
          return {
            ...msg,
            content: cleanContent,
          };
        });
        
        // Check if AI wants to transition to next step
        const lastResponse = newResponseMessages[newResponseMessages.length - 1];
        const shouldTransitionToCommit = typeof lastResponse?.content === 'string' && lastResponse.content.includes('[STEP:commit]');
        
        // Clean up step markers from content before saving
        const cleanedMessages = newResponseMessages.map((msg) => ({
          ...msg,
          content: typeof msg.content === 'string' ? msg.content.replace('[STEP:commit]', '').trim() : msg.content,
          step: shouldTransitionToCommit ? "commit" : "discover",
        }));
        
        // Save the AI response with appropriate step
        await saveCareerChatWithUser({
          id: chatId,
          userId: userId,
          messages: cleanedMessages,
          currentStep: shouldTransitionToCommit ? "commit" : "discover",
          supabaseClient: supabaseClient,
        });
        
        if (shouldTransitionToCommit) {
          console.log(`🔄 Step transition detected: discover → commit`);
        }
        
        console.log(`✅ AI discovery response saved successfully`);
      } catch (error) {
        console.error("Error saving AI discovery response:", error);
      }
    },
  });
  
  // Simply return the AI response - let the frontend handle step transitions
  console.log(`✅ Returning AI discovery response to frontend`);
  return result.toDataStreamResponse();
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not configured");
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  // Initialize SheetDB configuration
  await initializeCareerConfig();

  // Check authentication
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let messages, id, step;

  try {
    const body = await req.json();
    messages = body.messages;
    id = body.id;
    step = body.step;
  } catch (error) {
    console.error("Failed to parse request body:", error);
    return new Response("Invalid JSON in request body", { status: 400 });
  }

  // Validate required fields
  if (!id) {
    return new Response("Chat ID is required", { status: 400 });
  }

  if (!step) {
    return new Response("Step is required", { status: 400 });
  }

  // Check if SheetDB config is loaded
  if (
    !STEP_PROMPTS.discover ||
    !STEP_PROMPTS.commit ||
    !STEP_PROMPTS.create
  ) {
    console.error("❌ SheetDB configuration incomplete:", {
      discover: !!STEP_PROMPTS.discover,
      commit: !!STEP_PROMPTS.commit,
      create: !!STEP_PROMPTS.create,
      totalPrompts: Object.keys(STEP_PROMPTS).length,
    });
    return new Response(
      "Career configuration not loaded from SheetDB. Please check your configuration.",
      { status: 500 }
    );
  }

  if (!messages || !Array.isArray(messages)) {
    return new Response("Messages array is required", { status: 400 });
  }

  // Ensure career chat exists
  const adminClient = createAdminSupabaseClient();
  const { data: existingChat, error: chatCheckError } = await adminClient
    .from("career_chats")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (chatCheckError && chatCheckError.code === "PGRST116") {
    // Career chat doesn't exist, create it
    console.log(`🔧 Creating new career chat:`, {
      id,
      userId: user.id,
      userEmail: user.email,
    });

    const { error: createError } = await adminClient
      .from("career_chats")
      .insert({
        id,
        user_id: user.id,
        title: null,
        saved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (createError && createError.code !== "23505") {
      console.error("Failed to create missing career chat:", createError);
      return new Response("Career chat could not be created", { status: 500 });
    }

    console.log(`✅ Successfully created career chat with user_id: ${user.id}`);
  } else if (chatCheckError && chatCheckError.code !== "PGRST116") {
    console.error("Error checking career chat existence:", chatCheckError);
    return new Response("Error checking career chat", { status: 500 });
  }

  // Fetch user profile information
  const { data: profile } = await adminClient
    .from("profiles")
    .select(
      "preferred_name, role_title, career_goals, biggest_obstacle, students_and_subjects, top_skills, exploring_opportunities, tools_used, commit_status"
    )
    .eq("id", user.id)
    .single();

  // Get previous step context if available
  const { data: previousSteps } = await adminClient
    .from("career_messages")
    .select("step, content, role")
    .eq("chat_id", id)
    .eq("user_id", user.id)
    .neq("step", step) // Exclude current step messages
    .order("created_at", { ascending: true });

  const previousContext =
    previousSteps && previousSteps.length > 0
      ? `\n\nPREVIOUS STEP CONTEXT:\n${previousSteps
          .map(
            (msg) =>
              `${msg.step}: ${msg.role === "user" ? "User" : "Assistant"}: ${
                msg.content
              }`
          )
          .join("\n")}`
      : "";

  // Determine the current step based on the last AI message from database
  let currentStep = step;

  // Get the last AI message from database to check its step
  const { data: lastAIMessageFromDB } = await adminClient
    .from("career_messages")
    .select("step, content, role")
    .eq("chat_id", id)
    .eq("user_id", user.id)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  console.log(`🔍 Step Debug:`, {
    requestedStep: step,
    lastAIMessageStep: lastAIMessageFromDB?.step,
    currentStep: currentStep,
  });

  // Check for step transitions in the last AI message
  if (
    lastAIMessageFromDB &&
    lastAIMessageFromDB.content &&
    typeof lastAIMessageFromDB.content === 'string'
  ) {
    if (lastAIMessageFromDB.content.includes('[STEP:commit]')) {
      currentStep = "commit";
      console.log(`🔄 Step transition detected from content: ${step} → commit`);
    } else if (lastAIMessageFromDB.content.includes('[STEP:create]')) {
      currentStep = "create";
      console.log(`🔄 Step transition detected from content: ${step} → create`);
    } else if (lastAIMessageFromDB.content.includes('[STEP:apply]')) {
      currentStep = "apply";
      console.log(`🔄 Step transition detected from content: ${step} → apply`);
    }
  }

  // Also check if the last message step is different from requested step
  if (
    lastAIMessageFromDB &&
    lastAIMessageFromDB.step &&
    lastAIMessageFromDB.step !== step &&
    lastAIMessageFromDB.step !== currentStep
  ) {
    currentStep = lastAIMessageFromDB.step;
    console.log(
      `🔄 Step transition detected from DB: ${step} → ${currentStep}`
    );
  }

  // Save the current user message first (if it's a user message)
  const currentMessage = messages[messages.length - 1];
  if (currentMessage && currentMessage.role === "user") {
    console.log(`💾 Saving user message:`, {
      content: currentMessage.content.substring(0, 50) + "...",
      step: currentStep,
      messageId: currentMessage.id,
    });
    try {
      await saveCareerChatWithUser({
        id,
        userId: user.id,
        messages: [
          {
            ...currentMessage,
            step: currentStep,
            id: currentMessage.id || generateId(),
          },
        ],
        currentStep: currentStep,
        supabaseClient: adminClient,
      });
      console.log(`✅ User message saved successfully`);
    } catch (error) {
      console.error("Error saving user message:", error);
    }
  }

  // Check if we should respond or wait for user
  const lastMessage = messages[messages.length - 1];
  const { data: lastMessageFromDB, error: lastMessageError } = await adminClient
    .from("career_messages")
    .select("role, content")
    .eq("chat_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  console.log(`🔍 Message Flow Check:`, {
    lastMessageRole: lastMessage?.role,
    lastMessageFromDBRole: lastMessageFromDB?.role,
    shouldRespond: lastMessage?.role === "user" || !lastMessageFromDB?.role,
    isNewConversation: !lastMessageFromDB && !lastMessageError
  });

  // Simplified waiting logic: Only wait if AI just spoke and user hasn't responded
  if (lastMessageFromDB && lastMessageFromDB.role === "assistant") {
    console.log(`🔍 Last message was from AI, checking if user has responded`);
    
    // Check if current request contains a user message
    const hasUserResponse = lastMessage && lastMessage.role === "user";
    
    console.log(`🔍 Simple Waiting Check:`, {
      lastAIContent: lastMessageFromDB.content?.substring(0, 100) + "...",
      hasUserResponse,
      shouldWait: !hasUserResponse
    });
    
    // Only wait if user hasn't responded to the AI's message
    if (!hasUserResponse) {
      console.log(`⏳ AI spoke and user hasn't responded, waiting...`);
      return new Response(
        JSON.stringify({
          id: generateId(),
          role: "assistant",
          content: null,  // Fixed: null instead of "null"
          step: currentStep,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // User has responded, allow conversation to continue
    console.log(`✅ User has responded, allowing conversation to continue`);
  }

  // If this is a new conversation and no user message yet, start the conversation
  if (!lastMessageFromDB && !lastMessageError && (!lastMessage || lastMessage.role !== "user")) {
    console.log(`🚀 New conversation detected, starting career discovery`);
    // Let the normal flow handle this - it will start with the discover step
  }

  // Handle discover step with structured flow
  if (currentStep === "discover") {
    console.log(`🔍 Using handleDiscoverFlow for step: ${currentStep}`);
 
    
    try {
      const result = await handleDiscoverFlow(
        messages,
        id,
        user.id,
        profile,
        adminClient
      );
      console.log(`✅ handleDiscoverFlow completed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ handleDiscoverFlow failed:`, error);
      throw error;
    }
  }

  // Handle commit step with structured flow
  if (currentStep === "commit") {
    console.log(`🧠 Using handleCommitFlow for step: ${currentStep}`);
    return await handleCommitFlow(messages, id, user.id, profile, adminClient);
  }

  // Handle create/prepare step with AI generation
  if (currentStep === "create") {
    console.log(`🔧 Using AI generation for create step: ${currentStep}`);

    // Check if user wants to move to apply step
    const lastUserMessage =
      messages[messages.length - 1]?.content?.toLowerCase() || "";
    const wantsToMoveToApply =
      lastUserMessage.includes("move to next step") ||
      lastUserMessage.includes("move to apply") ||
      lastUserMessage.includes("apply step") ||
      lastUserMessage.includes("start applying") ||
      lastUserMessage.includes("ready to apply");

    if (wantsToMoveToApply) {
      console.log(`🚀 User requested transition to apply step`);

      // Generate simple response and update step
      const simpleResponse = "Sure, moving to your profile";

      // Save the response with apply step
      await saveCareerChatWithUser({
        id,
        userId: user.id,
        messages: [
          {
            id: generateId(),
            role: "assistant",
            content: simpleResponse,
            step: "apply",
            createdAt: new Date(),
          },
        ],
        currentStep: "apply",
        supabaseClient: adminClient,
      });

      console.log(`💾 Saved simple response with apply step`);

      // Return the simple response
      return new Response(
        JSON.stringify({
          id: generateId(),
          role: "assistant",
          content: simpleResponse,
          step: "apply",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the full conversation context from database
    const { data: conversationHistory, error: historyError } = await adminClient
      .from("career_messages")
      .select("role, content, created_at")
      .eq("chat_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    
    if (historyError) {
      console.error("Error fetching conversation history:", historyError);
    }
    
    console.log(`🔍 Create Step - Conversation Context:`, {
      historyLength: conversationHistory?.length || 0,
      lastMessages: conversationHistory?.slice(-5).map((m: any) => `${m.role}: ${m.content.substring(0, 50)}...`) || []
    });
    
    // Combine database history with current messages for full context
    const fullConversationContext = [
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      ...messages
    ];
    
    // Use the detailed create prompt to let AI generate materials
    const createPrompt = STEP_PROMPTS["create"];
    
    console.log(`🔧 Create Step - Using prompt from SheetDB:`, createPrompt?.substring(0, 200) + "...");
    console.log(`🔧 Create Step - Full prompt length:`, createPrompt?.length || 0);

    const result = await streamText({
      model: openai("gpt-3.5-turbo"),
      messages: fullConversationContext,
      system: `${createPrompt}

**USER PROFILE:**
Name: ${profile?.preferred_name || "there"}
Current Role: ${profile?.role_title || "Not specified"}
Students/Subjects: ${profile?.students_and_subjects || "Not specified"}
Career Goals: ${profile?.career_goals || "Not specified"}
Biggest Obstacle: ${profile?.biggest_obstacle || "Not specified"}
Top Skills: ${profile?.top_skills || "Not specified"}
Why Exploring: ${profile?.exploring_opportunities || "Not specified"}

**CRITICAL: Follow the EXACT process in your create prompt above. Do NOT deviate from the structured format.**`,

      async onFinish({ response }) {
        try {
          console.log(`🤖 Saving AI response for create step`);

          // Extract clean text content from AI responses
          const newResponseMessages = response.messages.map((msg) => {
            let cleanContent = msg.content;

            // Handle different content formats
            if (typeof msg.content === "string") {
              // If content is a JSON array, extract the text
              if (msg.content.startsWith("[")) {
                try {
                  const parsed = JSON.parse(msg.content);
                  if (Array.isArray(parsed)) {
                    // Extract all text parts and join them
                    cleanContent = parsed
                      .filter((item) => item.type === "text")
                      .map((item) => item.text)
                      .join("");
                  }
                } catch (e) {
                  console.log("Failed to parse JSON content:", e);
                  cleanContent = msg.content;
                }
              }
            } else if (Array.isArray(msg.content)) {
              // Handle array format directly
              cleanContent = msg.content
                .filter((item) => item.type === "text")
                .map((item) => item.text)
                .join("");
            }

            console.log(
              "🔍 Cleaned content:",
              typeof cleanContent === "string"
                ? cleanContent.substring(0, 100) + "..."
                : "Non-string content"
            );

            return {
              ...msg,
              content: cleanContent,
            };
          });

          // Check if AI wants to transition to apply step
          const lastResponse = newResponseMessages[newResponseMessages.length - 1];
          const shouldTransitionToApply = typeof lastResponse?.content === 'string' && lastResponse.content.includes('[STEP:apply]');
          
          // Clean up step markers from content before saving
          const cleanedMessages = newResponseMessages.map((msg) => ({
            ...msg,
            content: typeof msg.content === 'string' ? msg.content.replace('[STEP:apply]', '').trim() : msg.content,
            step: shouldTransitionToApply ? "apply" : currentStep,
          }));
          
          // Save the clean response with the appropriate step
          await saveCareerChatWithUser({
            id,
            userId: user.id,
            messages: cleanedMessages,
            currentStep: shouldTransitionToApply ? "apply" : currentStep,
            supabaseClient: adminClient,
          });
          
          if (shouldTransitionToApply) {
            console.log(`🔄 Step transition detected: create → apply`);
          }

          console.log(`💾 Saved AI response with step: ${currentStep}`);
          console.log(`🔍 Final step after transition check: ${currentStep}`);

          console.log(`✅ AI response saved successfully for create step`);
        } catch (error) {
          console.error("Error saving AI response:", error);
        }
      },
    });

    return result.toDataStreamResponse();
  }

  // Apply step is handled by static dashboard - no AI needed
  if (currentStep === "apply") {
    console.log(`📊 Apply step - using static dashboard, no AI processing needed`);
    return new Response(
      JSON.stringify({
        error: "Apply step uses static dashboard, not AI chat",
        message: "The apply step is handled by a static dashboard component",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  console.log(
    `⚠️ Step ${currentStep} not handled by structured flow, using generic logic`
  );

  // Handle other steps with original logic
  const stepPrompt = STEP_PROMPTS[currentStep as keyof typeof STEP_PROMPTS];
  const stepNumber = CAREER_STEPS[currentStep as keyof typeof CAREER_STEPS];

  console.log(
    `🔄 Career Step ${stepNumber} (${currentStep}) - OpenAI API Key exists:`,
    !!process.env.OPENAI_API_KEY
  );

  try {
    const result = await streamText({
      model: openai("gpt-3.5-turbo"),
      messages,
      system: `${stepPrompt}

**USER PROFILE:**
Name: ${profile?.preferred_name || "there"}
Current Role: ${profile?.role_title || "Not specified"}
Students/Subjects: ${profile?.students_and_subjects || "Not specified"}
Career Goals: ${profile?.career_goals || "Not specified"}
Biggest Obstacle: ${profile?.biggest_obstacle || "Not specified"}
Top Skills: ${profile?.top_skills || "Not specified"}
Why Exploring: ${profile?.exploring_opportunities || "Not specified"}

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
- If this is the first message in this step, acknowledge what step you're in and provide an overview`,

      async onFinish({ response }) {
        try {
          console.log(`🤖 Saving AI response for ${currentStep} step`);

          // Extract clean text content from AI responses
          const newResponseMessages = response.messages.map((msg) => {
            let cleanContent = msg.content;

            // If content is a JSON array, extract the text
            if (
              typeof msg.content === "string" &&
              msg.content.startsWith("[")
            ) {
              try {
                const parsed = JSON.parse(msg.content);
                if (
                  Array.isArray(parsed) &&
                  parsed.length > 0 &&
                  parsed[0].type === "text"
                ) {
                  cleanContent = parsed[0].text;
                }
              } catch (e) {
                // If parsing fails, keep original content
                console.log("Failed to parse JSON content, keeping original");
              }
            }

            return {
              ...msg,
              content: cleanContent,
              step: currentStep,
              id: msg.id || generateId(),
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
          if (messages.length === 1 && messages[0].role === "user") {
            const title = `Career ${
              currentStep.charAt(0).toUpperCase() + currentStep.slice(1)
            } Session`;
            await updateCareerChatTitleWithUser(
              id,
              title,
              user.id,
              adminClient
            );
          }
        } catch (error) {
          console.error("Error saving career chat:", error);
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("🚨 StreamText error:", error);
    return new Response(
      JSON.stringify({
        error: "StreamText failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

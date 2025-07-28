import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createAdminSupabaseClient } from '@/lib/supabase';
import { saveJobSearchTermsToCareerChat } from '@/lib/career-chat-store';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { chatId, userId } = await req.json();

    if (!chatId || !userId) {
      return NextResponse.json(
        { error: 'Missing chatId or userId' },
        { status: 400 }
      );
    }

    // Get the career chat messages to analyze
    const adminClient = createAdminSupabaseClient();
    const { data: messages, error: messagesError } = await adminClient
      .from('career_messages')
      .select('content, role')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (messagesError || !messages) {
      console.error('Error fetching career messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch career chat messages' },
        { status: 500 }
      );
    }

    // Generate job search term based on conversation context
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

    const response = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: jobSearchTermsPrompt,
      maxTokens: 50,
    });

    const jobSearchTerms = response.text?.trim() || 'instructional designer';

    if (jobSearchTerms) {
      console.log('🎯 Generated job search terms:', jobSearchTerms);
      await saveJobSearchTermsToCareerChat(chatId, userId, jobSearchTerms, adminClient);
      console.log('✅ Job search terms saved to career chat');
    }

    return NextResponse.json({
      success: true,
      jobSearchTerms: jobSearchTerms || 'instructional designer' // fallback
    });

  } catch (error) {
    console.error('Error generating job search terms:', error);
    return NextResponse.json(
      { error: 'Failed to generate job search terms' },
      { status: 500 }
    );
  }
} 
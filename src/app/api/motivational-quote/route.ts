import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function GET() {
  try {
    const response = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: `Generate a short, inspiring motivational quote (1-2 sentences) for a teacher transitioning to a new career. The quote should:

1. Be encouraging and uplifting
2. Reference their teaching background as a strength
3. Inspire confidence in their career transition
4. Be 1-2 sentences maximum
5. Be original and creative

Respond with ONLY the quote, no explanations or formatting.`,
      maxTokens: 100,
    });

    let quote = response.text?.trim() || '';
    
    if (!quote) {
      quote = "Your teaching experience is your superpower. Every lesson you've planned, every student you've inspired, every challenge you've overcome - these are the skills that will make you unstoppable in your new career.";
    }

    return new Response(JSON.stringify({ quote }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error generating motivational quote:', error);
    return new Response(JSON.stringify({
      quote: "Your teaching experience is your superpower. Every lesson you've planned, every student you've inspired, every challenge you've overcome - these are the skills that will make you unstoppable in your new career."
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 
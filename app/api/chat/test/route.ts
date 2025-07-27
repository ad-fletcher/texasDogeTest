import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    console.log('Test route called');
    
    const { messages } = await req.json();
    console.log('Messages received:', messages);
    
    const result = streamText({ 
      model: openai("gpt-4o-mini"),
      system: `You are a helpful assistant.`,
      messages,
      maxSteps: 5,
    });

    console.log('Stream created successfully');
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Error in test route:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 
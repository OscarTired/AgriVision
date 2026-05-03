import { NextRequest, NextResponse } from 'next/server';
import { generateKnowledgeChatResponse, type KnowledgeChatInput } from '@/ai/flows/knowledge-chat';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: KnowledgeChatInput = await request.json();
    
    const result = await generateKnowledgeChatResponse(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in knowledge chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process knowledge chat message' },
      { status: 500 }
    );
  }
}

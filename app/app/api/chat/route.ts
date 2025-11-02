import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../auth/utils';
import { ChatBedrockConverse } from '@langchain/aws';
import { HumanMessage } from '@langchain/core/messages';

// Initialize Bedrock LLM via LangChain (reusable instance)
function getLLM() {
  const region = process.env.AWS_REGION || 'us-east-1';
  const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.titan-text-express-v1';
  
  // Build credentials object only if environment variables are provided
  const credentialsConfig: any = {
    region,
    model: modelId,
    temperature: 0.7,
    maxTokens: 1000,
  };

  // Add credentials if provided via environment variables
  // Otherwise, SDK will use default credential chain (IAM roles, ~/.aws/credentials, etc.)
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    credentialsConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }
  
  return new ChatBedrockConverse(credentialsConfig);
}

// Cache the LLM instance
let llmInstance: ChatBedrockConverse | null = null;

function getCachedLLM(): ChatBedrockConverse {
  if (!llmInstance) {
    llmInstance = getLLM();
  }
  return llmInstance;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get the cached LLM instance
    const llm = getCachedLLM();

    // Invoke the model with the user's prompt
    const messages = [new HumanMessage(prompt)];
    const response = await llm.invoke(messages);

    // Extract the text content from the response
    const responseText = response.content?.toString() || 'Thank you';

    return NextResponse.json({
      message: responseText,
    });
  } catch (error: any) {
    console.error('Error processing chat message:', error);
    
    // Provide more detailed error information
    const errorMessage = error.message || 'Failed to process message';
    const statusCode = error.name === 'AccessDeniedException' ? 403 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}


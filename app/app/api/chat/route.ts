import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../auth/utils';
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';

// Initialize Bedrock Agent Runtime client
function getBedrockClient() {
  const region = process.env.AWS_REGION || 'us-east-1';
  
  const config: any = {
    region,
  };

  // Add credentials if provided via environment variables
  // Otherwise, SDK will use default credential chain (IAM roles, ~/.aws/credentials, etc.)
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }
  
  return new BedrockAgentRuntimeClient(config);
}

// Cache the client instance
let bedrockClient: BedrockAgentRuntimeClient | null = null;

function getCachedBedrockClient(): BedrockAgentRuntimeClient {
  if (!bedrockClient) {
    bedrockClient = getBedrockClient();
  }
  return bedrockClient;
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

    // Get the cached Bedrock client
    const client = getCachedBedrockClient();
    
    // Knowledge base ID - VTN3OAQTUA
    const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID || 'ZSXUATKCEV';
    const region = process.env.AWS_REGION || 'us-east-1';
    
    // Model ARN - Use Titan model
    // Format: arn:aws:bedrock:region::foundation-model/model-id
    const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-micro-v1:0';
    const modelArn = `arn:aws:bedrock:${region}::foundation-model/${modelId}`;

    // Call RetrieveAndGenerate API
    const command = new RetrieveAndGenerateCommand({
      input: {
        text: prompt,
      },
      retrieveAndGenerateConfiguration: {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration: {
          knowledgeBaseId: knowledgeBaseId,
          modelArn: modelArn,
          vectorSearchConfiguration: {
            numberOfResults: 20,
          },
        },
      },
    });

    const response = await client.send(command);

    // Extract the generated text from the response
    const responseText = response.output?.text || 'Thank you';

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


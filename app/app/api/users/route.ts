import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.MAGUS_USER_AUTH_TABLE_NAME || 'magus-user-auth';

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// GET - List all users
export async function GET() {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    // Remove passwordHash from response for security
    const users = (result.Items || []).map((item) => {
      const { passwordHash, ...user } = item;
      return user;
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    
    // Handle case when table doesn't exist
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json(
        { 
          error: 'DynamoDB table not found. Please deploy the CDK stack first.',
          users: []
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch users', users: [] },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('POST /api/users - Request body:', { email: body.email, hasPassword: !!body.password });
    
    const { email, password } = body;

    if (!email || !password) {
      console.log('POST /api/users - Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (normalizedPassword.length < 6) {
      console.log('POST /api/users - Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    console.log('POST /api/users - Checking if user exists:', normalizedEmail);
    // Check if user already exists
    let existingUser;
    try {
      existingUser = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            email: normalizedEmail,
          },
        })
      );
    } catch (checkError: any) {
      // If table doesn't exist, that's okay - we'll create it implicitly
      // But if it's a different error, we should handle it
      if (checkError.name === 'ResourceNotFoundException') {
        console.log('POST /api/users - Table does not exist, will create user');
        existingUser = { Item: undefined };
      } else {
        throw checkError; // Re-throw if it's a different error
      }
    }

    if (existingUser.Item) {
      console.log('POST /api/users - User already exists');
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    console.log('POST /api/users - Hashing password');
    // Hash password
    const passwordHash = await hashPassword(normalizedPassword);

    console.log('POST /api/users - Creating user in DynamoDB:', TABLE_NAME);
    // Create user
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          email: normalizedEmail,
          passwordHash,
          createdAt: new Date().toISOString(),
        },
      })
    );

    console.log('POST /api/users - User created successfully');
    return NextResponse.json({
      success: true,
      user: { email: normalizedEmail },
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      $metadata: error.$metadata,
    });
    
    // Handle case when table doesn't exist
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json(
        { error: 'DynamoDB table not found. Please deploy the CDK stack first.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to create user: ${error.message || error.name || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('DELETE /api/users - Deleting user:', normalizedEmail);

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          email: normalizedEmail,
        },
      })
    );

    console.log('DELETE /api/users - User deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json(
        { error: 'DynamoDB table not found. Please deploy the CDK stack first.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to delete user: ${error.message || error.name || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// PUT - Reset user password
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (normalizedPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    console.log('PUT /api/users - Resetting password for user:', normalizedEmail);

    // Check if user exists
    const existingUser = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          email: normalizedEmail,
        },
      })
    );

    if (!existingUser.Item) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(normalizedPassword);

    // Update user password
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          email: normalizedEmail,
        },
        UpdateExpression: 'SET passwordHash = :passwordHash, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':passwordHash': passwordHash,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    console.log('PUT /api/users - Password reset successfully');
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json(
        { error: 'DynamoDB table not found. Please deploy the CDK stack first.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to reset password: ${error.message || error.name || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

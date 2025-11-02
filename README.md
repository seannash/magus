# Magus

A modern chat application built with Next.js, AWS DynamoDB, and AWS Bedrock. Magus provides user authentication, chat functionality with AI-powered responses, and user management capabilities.

## Features

- 🔐 **User Authentication**: Secure login with JWT tokens and HTTP-only cookies
- 💬 **Chat Interface**: Android Messages-style chat interface with AI-powered responses
- 🤖 **AWS Bedrock Integration**: Powered by Amazon Titan LLM via LangChain
- 👥 **User Management**: Create, delete, and manage users (requires authentication)
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode support
- 🔒 **Protected Routes**: Middleware-based authentication for secure access

## Architecture

- **Frontend**: Next.js 16 with React 19 and Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: AWS DynamoDB for user authentication
- **AI/LLM**: AWS Bedrock with Amazon Titan models via LangChain
- **Infrastructure**: AWS CDK for infrastructure as code

## Prerequisites

- Node.js 20+ and npm
- AWS Account with:
  - AWS CDK CLI installed (`npm install -g aws-cdk`)
  - AWS credentials configured
  - Access to DynamoDB and Bedrock services
- TypeScript knowledge (optional but helpful)

## Setup

### 1. Clone and Install Dependencies

```bash
# Install root dependencies (CDK)
npm install

# Install app dependencies
cd app
npm install
```

### 2. Deploy AWS Infrastructure

Deploy the DynamoDB table using AWS CDK:

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy the stack
cdk deploy
```

This creates:
- DynamoDB table `magus-user-auth` for user authentication

### 3. Configure AWS Bedrock

Ensure you have access to Amazon Bedrock in your AWS account:

1. Go to AWS Bedrock console
2. Request access to Amazon Titan models
3. Verify your IAM role has `bedrock:InvokeModel` permissions

### 4. Environment Variables

Create a `.env.local` file in the `app` directory:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# DynamoDB Table Name (defaults to magus-user-auth)
MAGUS_USER_AUTH_TABLE_NAME=magus-user-auth

# Authentication Secret (use a strong random string in production)
AUTH_SECRET=your-secret-key-change-in-production

# Bedrock Model Configuration (optional)
BEDROCK_MODEL_ID=amazon.titan-text-express-v1
```

**Note**: If running on AWS (EC2, Lambda, ECS), you can omit `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as the SDK will use IAM roles automatically.

### 5. Run the Application

```bash
cd app
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### Initial Setup

1. **Create a User**: Navigate to `/users` (initially accessible without login)
2. **Login**: Go to `/login` and enter your credentials
3. **Start Chatting**: Access `/chat` to begin conversations with the AI

### Routes

- `/` - Root page (redirects to `/login` or `/chat` based on auth status)
- `/login` - Login page
- `/chat` - Chat interface (requires authentication)
- `/users` - User management page (requires authentication)

### API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Check authentication status
- `POST /api/chat` - Send message to AI (requires authentication)
- `GET /api/users` - List all users (requires authentication)
- `POST /api/users` - Create a new user (requires authentication)
- `DELETE /api/users?email=...` - Delete a user (requires authentication)
- `PUT /api/users` - Reset user password (requires authentication)

## Project Structure

```
magus-frontend/
├── app/                    # Next.js application
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth/     # Authentication endpoints
│   │   │   ├── chat/     # Chat endpoint
│   │   │   └── users/    # User management endpoints
│   │   ├── chat/         # Chat page
│   │   ├── login/        # Login page
│   │   ├── users/        # User management page
│   │   └── page.tsx      # Root page
│   ├── proxy.ts          # Next.js proxy (middleware)
│   └── package.json
├── lib/
│   └── magus-frontend-stack.ts  # CDK stack definition
├── bin/
│   └── magus-frontend.ts        # CDK app entry point
└── package.json          # Root package.json (CDK)
```

## Authentication

Magus uses JWT tokens stored in HTTP-only cookies for authentication:

- Tokens expire after 24 hours
- Protected routes are checked via Next.js proxy (middleware)
- Sessions are validated on each API request

## AWS Bedrock Models

The application supports Amazon Titan models:

- `amazon.titan-text-express-v1` (default)
- `amazon.titan-text-lite-v1`
- `amazon.titan-text-premier-v1:0`

Configure via `BEDROCK_MODEL_ID` environment variable.

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
cd app
npm run build
npm start
```

### Linting

```bash
cd app
npm run lint
```

## Security Considerations

- Change `AUTH_SECRET` to a strong random string in production
- Use HTTPS in production
- Set `NODE_ENV=production` for secure cookie settings
- Review IAM permissions for least privilege access
- Consider using AWS Secrets Manager for sensitive credentials

## Troubleshooting

### DynamoDB Table Not Found

If you see "DynamoDB table not found" errors:
1. Ensure the CDK stack is deployed: `cdk deploy`
2. Verify the table name matches `MAGUS_USER_AUTH_TABLE_NAME`
3. Check AWS credentials and region configuration

### Bedrock Access Denied

If you get Bedrock access errors:
1. Verify Bedrock model access in AWS console
2. Check IAM permissions for `bedrock:InvokeModel`
3. Ensure you're using the correct region
4. Verify the model ID is correct

### Authentication Issues

If login doesn't work:
1. Check `AUTH_SECRET` is set correctly
2. Verify cookies are enabled in your browser
3. Check browser console for errors
4. Ensure the proxy middleware is configured correctly

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

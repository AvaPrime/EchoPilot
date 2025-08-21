# EchoPilot API Reference

## Overview

This document provides comprehensive API documentation for the EchoPilot VS Code extension, including internal APIs, external integrations, and extension points.

## Internal APIs

### Chat API

#### `ChatParticipant`

```typescript
interface ChatParticipant {
  handleMessage(message: string, context: ChatContext): Promise<ChatResponse>;
  getContext(): ChatContext;
  updateContext(context: Partial<ChatContext>): void;
}
```

**Methods:**
- `handleMessage()` - Processes incoming chat messages
- `getContext()` - Retrieves current chat context
- `updateContext()` - Updates chat context state

#### `ChatContext`

```typescript
interface ChatContext {
  sessionId: string;
  userId?: string;
  workspace: WorkspaceInfo;
  history: ChatMessage[];
  settings: ChatSettings;
}
```

### API Client

#### `CodesaApiClient`

```typescript
class CodesaApiClient {
  constructor(config: ApiConfig);
  
  // Chat methods
  sendChatMessage(message: string, context?: any): Promise<ChatResponse>;
  
  // Policy methods
  validateCode(code: string, language: string): Promise<PolicyResult>;
  
  // Playbook methods
  executePlaybook(playbookId: string, params: any): Promise<PlaybookResult>;
}
```

**Configuration:**
```typescript
interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
}
```

### Policy Engine API

#### `DiagnosticsProvider`

```typescript
interface DiagnosticsProvider {
  provideDiagnostics(document: TextDocument): Promise<Diagnostic[]>;
  validatePolicy(code: string, rules: PolicyRule[]): PolicyResult;
}
```

#### `PolicyRule`

```typescript
interface PolicyRule {
  id: string;
  name: string;
  description: string;
  severity: DiagnosticSeverity;
  pattern: RegExp | string;
  message: string;
  fixSuggestion?: string;
}
```

### Monaco Integration API

#### `MonacoEnhancer`

```typescript
interface MonacoEnhancer {
  registerCompletionProvider(language: string, provider: CompletionProvider): void;
  registerHoverProvider(language: string, provider: HoverProvider): void;
  addCodeActions(actions: CodeAction[]): void;
}
```

## External APIs

### Codessa API Integration

#### Base URL
```
https://api.codessa.io/v1
```

#### Authentication
```http
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

#### Endpoints

##### Chat Completion
```http
POST /chat/completions
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "string"
    }
  ],
  "model": "string",
  "context": {
    "workspace": "string",
    "language": "string"
  }
}
```

**Response:**
```json
{
  "id": "string",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "string"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```

##### Code Analysis
```http
POST /analyze/code
```

**Request Body:**
```json
{
  "code": "string",
  "language": "string",
  "rules": ["string"],
  "context": {
    "file_path": "string",
    "project_type": "string"
  }
}
```

**Response:**
```json
{
  "analysis_id": "string",
  "violations": [
    {
      "rule_id": "string",
      "severity": "error|warning|info",
      "message": "string",
      "line": 0,
      "column": 0,
      "suggestion": "string"
    }
  ],
  "score": 0.95
}
```

##### Playbook Execution
```http
POST /playbooks/{id}/execute
```

**Request Body:**
```json
{
  "parameters": {
    "key": "value"
  },
  "context": {
    "workspace": "string",
    "user_id": "string"
  }
}
```

**Response:**
```json
{
  "execution_id": "string",
  "status": "running|completed|failed",
  "results": [
    {
      "step": "string",
      "output": "string",
      "status": "success|error"
    }
  ]
}
```

## VS Code Extension API Usage

### Commands

```typescript
// Register commands
vscode.commands.registerCommand('echopilot.chat', () => {
  // Implementation
});

vscode.commands.registerCommand('echopilot.analyze', () => {
  // Implementation
});
```

### Providers

```typescript
// Diagnostics Provider
vscode.languages.registerDiagnosticsProvider(
  { scheme: 'file' },
  diagnosticsProvider
);

// Completion Provider
vscode.languages.registerCompletionItemProvider(
  'typescript',
  completionProvider,
  '.', ' '
);
```

### Configuration

```typescript
// Get configuration
const config = vscode.workspace.getConfiguration('echopilot');
const apiKey = config.get<string>('apiKey');

// Watch configuration changes
vscode.workspace.onDidChangeConfiguration(event => {
  if (event.affectsConfiguration('echopilot')) {
    // Handle configuration change
  }
});
```

## Error Handling

### Error Types

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: any;
}

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
```

### Error Codes

- `AUTH_FAILED` - Authentication failure
- `RATE_LIMITED` - API rate limit exceeded
- `INVALID_REQUEST` - Malformed request
- `SERVER_ERROR` - Internal server error
- `NETWORK_ERROR` - Network connectivity issue

## Rate Limiting

- **Chat API**: 100 requests per minute
- **Analysis API**: 50 requests per minute
- **Playbook API**: 20 executions per hour

## Webhooks (Future)

### Playbook Completion
```http
POST /webhooks/playbook-complete
```

**Payload:**
```json
{
  "execution_id": "string",
  "playbook_id": "string",
  "status": "completed|failed",
  "results": {},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## SDK Examples

### Basic Usage

```typescript
import { CodesaApiClient } from './api/apiClient';

const client = new CodesaApiClient({
  baseUrl: 'https://api.codessa.io/v1',
  apiKey: process.env.CODESSA_API_KEY
});

// Send chat message
const response = await client.sendChatMessage('Help me debug this code');
console.log(response.content);

// Validate code
const validation = await client.validateCode(code, 'typescript');
if (validation.violations.length > 0) {
  console.log('Policy violations found:', validation.violations);
}
```

## Versioning

API versioning follows semantic versioning (semver):
- Major version: Breaking changes
- Minor version: New features, backward compatible
- Patch version: Bug fixes, backward compatible

Current API version: `v1.0.0`
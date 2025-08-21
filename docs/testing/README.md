# EchoPilot Testing Guide

## Overview

This guide covers the comprehensive testing strategy for EchoPilot, including unit tests, integration tests, end-to-end tests, and manual testing procedures.

## Testing Philosophy

### Testing Pyramid

```
    /\     E2E Tests (Few)
   /  \    - User workflows
  /____\   - Critical paths
 /      \  Integration Tests (Some)
/        \ - API interactions
\________/ - Component integration
 \      /  Unit Tests (Many)
  \____/   - Pure functions
   \  /    - Business logic
    \/     - Utilities
```

### Testing Principles

1. **Fast Feedback** - Quick test execution
2. **Reliable** - Consistent and deterministic
3. **Maintainable** - Easy to update and understand
4. **Comprehensive** - Good coverage of critical paths
5. **Isolated** - Tests don't depend on each other

## Test Structure

### Directory Structure

```
src/
├── test/
│   ├── unit/
│   │   ├── chat/
│   │   ├── security/
│   │   ├── api/
│   │   └── utils/
│   ├── integration/
│   │   ├── api/
│   │   ├── extension/
│   │   └── workflows/
│   ├── e2e/
│   │   ├── chat.test.ts
│   │   ├── security.test.ts
│   │   └── playbooks.test.ts
│   ├── fixtures/
│   │   ├── mock-data/
│   │   ├── test-files/
│   │   └── responses/
│   └── helpers/
│       ├── test-utils.ts
│       ├── mocks.ts
│       └── setup.ts
```

## Unit Testing

### Framework Setup

#### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/helpers/setup.ts']
};
```

#### Test Setup

```typescript
// src/test/helpers/setup.ts
import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Mock VS Code API
  global.vscode = {
    window: {
      showInformationMessage: jest.fn(),
      showErrorMessage: jest.fn(),
      createOutputChannel: jest.fn(() => ({
        appendLine: jest.fn(),
        show: jest.fn()
      }))
    },
    workspace: {
      getConfiguration: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn()
      }))
    }
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});
```

### Unit Test Examples

#### Testing Utilities

```typescript
// src/test/unit/utils/string-utils.test.ts
import { sanitizeInput, formatMessage } from '../../../utils/string-utils';

describe('String Utils', () => {
  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
    });

    it('should preserve safe content', () => {
      const input = 'Hello, world!';
      const result = sanitizeInput(input);
      expect(result).toBe(input);
    });

    it('should handle empty input', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });
  });

  describe('formatMessage', () => {
    it('should format message with variables', () => {
      const template = 'Hello, {name}!';
      const variables = { name: 'Alice' };
      const result = formatMessage(template, variables);
      expect(result).toBe('Hello, Alice!');
    });

    it('should handle missing variables', () => {
      const template = 'Hello, {name}!';
      const variables = {};
      const result = formatMessage(template, variables);
      expect(result).toBe('Hello, {name}!');
    });
  });
});
```

#### Testing API Client

```typescript
// src/test/unit/api/client.test.ts
import { ApiClient } from '../../../api/client';
import { jest } from '@jest/globals';

// Mock fetch
global.fetch = jest.fn();

describe('ApiClient', () => {
  let client: ApiClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new ApiClient({
      baseUrl: 'https://api.test.com',
      apiKey: 'test-key'
    });
    mockFetch.mockClear();
  });

  describe('chat completion', () => {
    it('should make successful API call', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.chatCompletion({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as Response);

      await expect(client.chatCompletion({
        messages: [{ role: 'user', content: 'Hello' }]
      })).rejects.toThrow('API request failed: 401 Unauthorized');
    });

    it('should retry on network errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ choices: [] })
        } as Response);

      await client.chatCompletion({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
```

#### Testing Security Rules

```typescript
// src/test/unit/security/rules.test.ts
import { SecurityRuleEngine } from '../../../security/rules';
import { DiagnosticSeverity } from 'vscode';

describe('SecurityRuleEngine', () => {
  let engine: SecurityRuleEngine;

  beforeEach(() => {
    engine = new SecurityRuleEngine();
  });

  describe('hardcoded secrets detection', () => {
    it('should detect API keys', () => {
      const code = 'const apiKey = "sk-1234567890abcdef";';
      const diagnostics = engine.analyze(code, 'typescript');

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].severity).toBe(DiagnosticSeverity.Error);
      expect(diagnostics[0].message).toContain('Hardcoded API key detected');
    });

    it('should detect passwords', () => {
      const code = 'const password = "mySecretPassword123";';
      const diagnostics = engine.analyze(code, 'typescript');

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].severity).toBe(DiagnosticSeverity.Error);
      expect(diagnostics[0].message).toContain('Hardcoded password detected');
    });

    it('should ignore safe patterns', () => {
      const code = 'const placeholder = "YOUR_API_KEY_HERE";';
      const diagnostics = engine.analyze(code, 'typescript');

      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('SQL injection detection', () => {
    it('should detect dangerous SQL patterns', () => {
      const code = 'const query = "SELECT * FROM users WHERE id = " + userId;';
      const diagnostics = engine.analyze(code, 'typescript');

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].severity).toBe(DiagnosticSeverity.Warning);
      expect(diagnostics[0].message).toContain('Potential SQL injection');
    });

    it('should allow parameterized queries', () => {
      const code = 'const query = "SELECT * FROM users WHERE id = ?";';
      const diagnostics = engine.analyze(code, 'typescript');

      expect(diagnostics).toHaveLength(0);
    });
  });
});
```

## Integration Testing

### VS Code Extension Integration

```typescript
// src/test/integration/extension/activation.test.ts
import * as vscode from 'vscode';
import { activate } from '../../../extension';

describe('Extension Integration', () => {
  let context: vscode.ExtensionContext;

  beforeEach(() => {
    context = {
      subscriptions: [],
      extensionPath: '/test/path',
      globalState: {
        get: jest.fn(),
        update: jest.fn()
      },
      workspaceState: {
        get: jest.fn(),
        update: jest.fn()
      }
    } as any;
  });

  it('should activate extension successfully', async () => {
    await activate(context);

    expect(context.subscriptions.length).toBeGreaterThan(0);
  });

  it('should register chat participant', async () => {
    const registerSpy = jest.spyOn(vscode.chat, 'createChatParticipant');
    
    await activate(context);

    expect(registerSpy).toHaveBeenCalledWith(
      'echopilot',
      expect.any(Function)
    );
  });

  it('should register commands', async () => {
    const registerSpy = jest.spyOn(vscode.commands, 'registerCommand');
    
    await activate(context);

    expect(registerSpy).toHaveBeenCalledWith(
      'echopilot.runSecurityScan',
      expect.any(Function)
    );
  });
});
```

### API Integration Tests

```typescript
// src/test/integration/api/codessa-api.test.ts
import { CodesaApiClient } from '../../../api/codessa-client';
import { createTestServer } from '../../helpers/test-server';

describe('Codessa API Integration', () => {
  let server: any;
  let client: CodesaApiClient;

  beforeAll(async () => {
    server = await createTestServer();
    client = new CodesaApiClient({
      baseUrl: `http://localhost:${server.port}`,
      apiKey: 'test-key'
    });
  });

  afterAll(async () => {
    await server.close();
  });

  it('should handle chat completion flow', async () => {
    // Mock server response
    server.post('/chat/completions', (req, res) => {
      res.json({
        choices: [{
          message: {
            role: 'assistant',
            content: 'Hello! How can I help you?'
          }
        }]
      });
    });

    const response = await client.chatCompletion({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'gpt-4'
    });

    expect(response.choices[0].message.content)
      .toBe('Hello! How can I help you?');
  });

  it('should handle code analysis', async () => {
    server.post('/analyze', (req, res) => {
      res.json({
        issues: [
          {
            type: 'security',
            severity: 'high',
            message: 'Potential XSS vulnerability',
            line: 42
          }
        ]
      });
    });

    const analysis = await client.analyzeCode({
      code: 'document.innerHTML = userInput;',
      language: 'javascript'
    });

    expect(analysis.issues).toHaveLength(1);
    expect(analysis.issues[0].type).toBe('security');
  });
});
```

## End-to-End Testing

### E2E Test Setup

```typescript
// src/test/e2e/setup.ts
import * as vscode from 'vscode';
import { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath } from '@vscode/test-electron';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './index');

    const vscodeExecutablePath = await downloadAndUnzipVSCode('stable');
    const [cliPath, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);

    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        '--disable-extensions',
        '--disable-workspace-trust'
      ]
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
```

### Chat Workflow E2E Test

```typescript
// src/test/e2e/chat.test.ts
import * as vscode from 'vscode';
import { expect } from 'chai';

describe('Chat E2E Tests', () => {
  let chatParticipant: vscode.ChatParticipant;

  before(async () => {
    // Wait for extension to activate
    await vscode.extensions.getExtension('your-publisher.echopilot')?.activate();
    
    // Get chat participant
    chatParticipant = vscode.chat.participants.find(p => p.id === 'echopilot')!;
    expect(chatParticipant).to.not.be.undefined;
  });

  it('should respond to basic chat message', async () => {
    const request: vscode.ChatRequest = {
      prompt: 'Hello, can you help me?',
      command: undefined,
      references: [],
      location: vscode.ChatLocation.Panel,
      attempt: 0,
      enableCommandDetection: true
    };

    const context: vscode.ChatContext = {
      history: []
    };

    const stream = new TestChatResponseStream();
    const token = new vscode.CancellationTokenSource().token;

    await chatParticipant.requestHandler(request, context, stream, token);

    expect(stream.responses).to.have.length.greaterThan(0);
    expect(stream.responses[0]).to.include('help');
  });

  it('should handle code analysis request', async () => {
    const request: vscode.ChatRequest = {
      prompt: 'Analyze this code for security issues: const password = "123456";',
      command: 'analyze',
      references: [],
      location: vscode.ChatLocation.Panel,
      attempt: 0,
      enableCommandDetection: true
    };

    const context: vscode.ChatContext = {
      history: []
    };

    const stream = new TestChatResponseStream();
    const token = new vscode.CancellationTokenSource().token;

    await chatParticipant.requestHandler(request, context, stream, token);

    expect(stream.responses.join('')).to.include('security');
    expect(stream.responses.join('')).to.include('password');
  });
});

class TestChatResponseStream implements vscode.ChatResponseStream {
  responses: string[] = [];

  markdown(value: string): void {
    this.responses.push(value);
  }

  anchor(value: vscode.Uri, title?: string): void {
    this.responses.push(`[${title || 'Link'}](${value.toString()})`);
  }

  button(command: vscode.Command): void {
    this.responses.push(`Button: ${command.title}`);
  }

  filetree(value: vscode.ChatResponseFileTree[], baseUri: vscode.Uri): void {
    this.responses.push('File tree rendered');
  }

  progress(value: string): void {
    this.responses.push(`Progress: ${value}`);
  }

  reference(value: vscode.Uri | vscode.Location, iconPath?: vscode.ThemeIcon | vscode.Uri): void {
    this.responses.push(`Reference: ${value.toString()}`);
  }
}
```

## Performance Testing

### Load Testing

```typescript
// src/test/performance/load.test.ts
import { ApiClient } from '../../api/client';
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient({
      baseUrl: process.env.TEST_API_URL || 'http://localhost:3000',
      apiKey: 'test-key'
    });
  });

  it('should handle concurrent requests', async () => {
    const concurrentRequests = 10;
    const requests = Array(concurrentRequests).fill(null).map(() => 
      client.chatCompletion({
        messages: [{ role: 'user', content: 'Test message' }]
      })
    );

    const start = performance.now();
    const results = await Promise.all(requests);
    const end = performance.now();

    expect(results).toHaveLength(concurrentRequests);
    expect(end - start).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should maintain performance under load', async () => {
    const iterations = 100;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await client.chatCompletion({
        messages: [{ role: 'user', content: `Test message ${i}` }]
      });
      const end = performance.now();
      times.push(end - start);
    }

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);

    expect(averageTime).toBeLessThan(1000); // Average under 1 second
    expect(maxTime).toBeLessThan(3000); // Max under 3 seconds
  });
});
```

### Memory Testing

```typescript
// src/test/performance/memory.test.ts
import { ChatManager } from '../../chat/manager';

describe('Memory Tests', () => {
  it('should not leak memory with large chat history', async () => {
    const chatManager = new ChatManager();
    const initialMemory = process.memoryUsage().heapUsed;

    // Simulate large chat history
    for (let i = 0; i < 1000; i++) {
      await chatManager.addMessage({
        role: 'user',
        content: `Message ${i}`.repeat(100) // Large message
      });
    }

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## Test Utilities

### Mock Helpers

```typescript
// src/test/helpers/mocks.ts
import { jest } from '@jest/globals';

export const createMockVSCode = () => ({
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    createOutputChannel: jest.fn(() => ({
      appendLine: jest.fn(),
      show: jest.fn(),
      clear: jest.fn()
    })),
    activeTextEditor: {
      document: {
        getText: jest.fn(() => 'mock document text'),
        languageId: 'typescript'
      },
      selection: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 10 }
      }
    }
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string) => {
        const config = {
          'echopilot.apiKey': 'test-key',
          'echopilot.enabled': true,
          'echopilot.logLevel': 'info'
        };
        return config[key];
      }),
      update: jest.fn()
    })),
    workspaceFolders: [{
      uri: { fsPath: '/test/workspace' },
      name: 'test-workspace',
      index: 0
    }]
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn()
  },
  chat: {
    createChatParticipant: jest.fn()
  }
});

export const createMockApiResponse = (data: any) => ({
  ok: true,
  status: 200,
  json: async () => data,
  text: async () => JSON.stringify(data)
});

export const createMockApiError = (status: number, message: string) => ({
  ok: false,
  status,
  statusText: message,
  json: async () => ({ error: message })
});
```

### Test Data Fixtures

```typescript
// src/test/fixtures/chat-data.ts
export const mockChatMessages = [
  {
    role: 'user' as const,
    content: 'Hello, can you help me with TypeScript?'
  },
  {
    role: 'assistant' as const,
    content: 'Of course! I\'d be happy to help you with TypeScript. What specific question do you have?'
  },
  {
    role: 'user' as const,
    content: 'How do I define an interface?'
  }
];

export const mockCodeSamples = {
  typescript: {
    secure: `
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
};
    `,
    insecure: `
const apiKey = "sk-1234567890abcdef";
const password = "mySecretPassword123";
const query = "SELECT * FROM users WHERE id = " + userId;
    `
  },
  javascript: {
    secure: `
function sanitizeInput(input) {
  return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
}
    `,
    insecure: `
document.innerHTML = userInput;
eval(userCode);
    `
  }
};
```

## Test Commands

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest src/test/unit",
    "test:integration": "jest src/test/integration",
    "test:e2e": "npm run compile && node out/test/e2e/setup.js",
    "test:performance": "jest src/test/performance",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

### GitHub Actions CI

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [16, 18, 20]

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run unit tests
      run: npm run test:unit
      
    - name: Run integration tests
      run: npm run test:integration
      
    - name: Run E2E tests
      run: npm run test:e2e
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## Manual Testing

### Test Scenarios

#### Chat Functionality
1. **Basic Chat**
   - Open VS Code
   - Open chat panel
   - Type "@echopilot hello"
   - Verify response is received

2. **Code Analysis**
   - Open a file with security issues
   - Type "@echopilot analyze this code"
   - Verify security issues are identified

3. **Playbook Execution**
   - Type "@echopilot run security scan"
   - Verify playbook executes correctly

#### Security Features
1. **Real-time Analysis**
   - Type code with hardcoded secrets
   - Verify diagnostics appear
   - Fix the issue
   - Verify diagnostics disappear

2. **Security Scan**
   - Run security scan command
   - Verify all files are scanned
   - Verify results are displayed

#### Configuration
1. **API Key Setup**
   - Configure API key in settings
   - Verify connection works
   - Test with invalid key
   - Verify error handling

### Browser Testing (Web Extension)

#### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

#### Test Environments
- github.dev
- vscode.dev
- Local VS Code Server
- GitHub Codespaces

## Coverage Requirements

### Minimum Coverage Thresholds
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Critical Path Coverage
- **Chat functionality**: 95%
- **Security analysis**: 95%
- **API client**: 90%
- **Configuration**: 85%

## Continuous Testing

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run test:unit
npm run lint
```

### Automated Testing
- Run tests on every commit
- Run full test suite on PR
- Performance tests on release
- Security tests on schedule

## Troubleshooting Tests

### Common Issues

1. **VS Code API Mocking**
   - Ensure all VS Code APIs are properly mocked
   - Check for missing mock implementations

2. **Async Test Issues**
   - Use proper async/await patterns
   - Set appropriate timeouts
   - Handle promise rejections

3. **Test Isolation**
   - Clear mocks between tests
   - Reset global state
   - Avoid test interdependencies

4. **Flaky Tests**
   - Add proper wait conditions
   - Use deterministic test data
   - Avoid timing-dependent assertions

### Debugging Tests

```bash
# Debug specific test
npm run test:debug -- --testNamePattern="should handle API errors"

# Run single test file
npm test -- src/test/unit/api/client.test.ts

# Run tests with verbose output
npm test -- --verbose
```
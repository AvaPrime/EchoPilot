# EchoPilot Development Guide

## Getting Started

### Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher
- **VS Code**: Latest stable version
- **Git**: Version 2.x or higher
- **TypeScript**: Global installation recommended

### Development Environment Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/AvaPrime/EchoPilot.git
   cd EchoPilot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure API Keys**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env file with your API keys
   CODESSA_API_KEY=your_api_key_here
   ```

4. **Build the Extension**
   ```bash
   npm run compile
   ```

5. **Run in Development Mode**
   - Open the project in VS Code
   - Press `F5` to launch Extension Development Host
   - Test your changes in the new VS Code window

## Project Structure

```
echopilot/
├── src/                    # Source code
│   ├── api/               # API client and interfaces
│   ├── chat/              # Chat participant implementation
│   ├── monaco/            # Monaco editor integration
│   ├── notebook/          # Notebook/playbook controller
│   ├── policy/            # Policy engine and diagnostics
│   ├── web/               # Web extension support
│   └── extension.ts       # Main extension entry point
├── docs/                  # Documentation
├── out/                   # Compiled JavaScript output
├── node_modules/          # Dependencies
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
├── webpack.config.js      # Webpack build configuration
└── .eslintrc.json        # ESLint configuration
```

## Development Workflow

### 1. Feature Development

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Changes**
   - Write code following TypeScript best practices
   - Add appropriate type definitions
   - Include error handling

3. **Test Changes**
   ```bash
   # Compile and check for errors
   npm run compile
   
   # Run linting
   npm run lint
   
   # Test in Extension Development Host
   # Press F5 in VS Code
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### 2. Code Quality

#### TypeScript Guidelines
- Use strict type checking
- Prefer interfaces over types for object shapes
- Use enums for constants
- Add JSDoc comments for public APIs

```typescript
/**
 * Represents a chat message in the conversation
 */
interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Message content */
  content: string;
  /** Message role (user or assistant) */
  role: 'user' | 'assistant';
  /** Timestamp when message was created */
  timestamp: Date;
}
```

#### ESLint Configuration
The project uses ESLint with TypeScript support:

```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

#### Code Formatting
- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multiline objects/arrays
- Use semicolons

### 3. Testing Strategy

#### Unit Testing (Planned)
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### Integration Testing
- Test extension activation/deactivation
- Test command execution
- Test provider registration
- Test API integration

#### Manual Testing Checklist
- [ ] Extension activates without errors
- [ ] Chat participant responds correctly
- [ ] Diagnostics appear for policy violations
- [ ] Monaco enhancements work
- [ ] Configuration changes are respected
- [ ] Web extension compatibility

## Build Process

### Development Build
```bash
# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch
```

### Production Build
```bash
# Build optimized bundle
npm run build

# Package extension
npm run package
```

### Webpack Configuration
The project uses Webpack for bundling:

- **Entry Point**: `src/extension.ts`
- **Output**: `out/extension.js`
- **Target**: Node.js (VS Code extension host)
- **Externals**: VS Code API modules

## Debugging

### VS Code Debugging
1. Set breakpoints in TypeScript source
2. Press `F5` to start debugging
3. Use Debug Console for evaluation

### Debug Configuration
```json
{
  "type": "extensionHost",
  "request": "launch",
  "name": "Launch Extension",
  "runtimeExecutable": "${execPath}",
  "args": ["--extensionDevelopmentPath=${workspaceFolder}"]
}
```

### Logging
```typescript
import * as vscode from 'vscode';

// Use VS Code output channel
const outputChannel = vscode.window.createOutputChannel('EchoPilot');
outputChannel.appendLine('Debug message');
outputChannel.show();
```

## API Development

### Adding New API Endpoints

1. **Define Interface**
   ```typescript
   interface NewApiRequest {
     param1: string;
     param2: number;
   }
   
   interface NewApiResponse {
     result: string;
     status: 'success' | 'error';
   }
   ```

2. **Implement Client Method**
   ```typescript
   async newApiCall(request: NewApiRequest): Promise<NewApiResponse> {
     return this.makeRequest('/new-endpoint', request);
   }
   ```

3. **Add Error Handling**
   ```typescript
   try {
     const response = await this.newApiCall(request);
     return response;
   } catch (error) {
     this.handleApiError(error);
     throw error;
   }
   ```

### API Testing
- Use Postman or similar tools for endpoint testing
- Mock API responses for development
- Test error scenarios and edge cases

## Extension Development

### Adding New Commands

1. **Register Command**
   ```typescript
   const disposable = vscode.commands.registerCommand(
     'echopilot.newCommand',
     async () => {
       // Command implementation
     }
   );
   context.subscriptions.push(disposable);
   ```

2. **Update package.json**
   ```json
   {
     "contributes": {
       "commands": [
         {
           "command": "echopilot.newCommand",
           "title": "New Command",
           "category": "EchoPilot"
         }
       ]
     }
   }
   ```

### Adding Configuration Options

1. **Define in package.json**
   ```json
   {
     "contributes": {
       "configuration": {
         "properties": {
           "echopilot.newSetting": {
             "type": "string",
             "default": "defaultValue",
             "description": "Description of the setting"
           }
         }
       }
     }
   }
   ```

2. **Access in Code**
   ```typescript
   const config = vscode.workspace.getConfiguration('echopilot');
   const setting = config.get<string>('newSetting');
   ```

## Performance Optimization

### Best Practices
- Lazy load heavy components
- Cache API responses when appropriate
- Use VS Code's built-in debouncing for file watchers
- Minimize extension activation time

### Memory Management
- Dispose of event listeners and providers
- Clean up resources in deactivate function
- Use weak references where appropriate

## Troubleshooting

### Common Issues

1. **Extension Not Activating**
   - Check activation events in package.json
   - Verify entry point path
   - Check for compilation errors

2. **API Calls Failing**
   - Verify API key configuration
   - Check network connectivity
   - Review request/response formats

3. **TypeScript Compilation Errors**
   - Update type definitions
   - Check tsconfig.json settings
   - Verify import paths

### Debug Tools
- VS Code Developer Tools (`Help > Toggle Developer Tools`)
- Extension Host Log (`View > Output > Extension Host`)
- Network inspection for API calls

## Release Process

### Version Management
1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Build and package extension
5. Publish to VS Code Marketplace

### Pre-release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Version bumped appropriately
- [ ] Changelog updated
- [ ] No console.log statements in production code
- [ ] Extension tested in clean VS Code instance

## Contributing Guidelines

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed contribution guidelines.

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Webpack Documentation](https://webpack.js.org/concepts/)
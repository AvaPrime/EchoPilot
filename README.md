# EchoPilot: AI-Powered VS Code Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue)](https://marketplace.visualstudio.com/)
[![GitHub Issues](https://img.shields.io/github/issues/username/EchoPilot)](https://github.com/username/EchoPilot/issues)
[![GitHub Stars](https://img.shields.io/github/stars/username/EchoPilot)](https://github.com/username/EchoPilot/stargazers)

**EchoPilot** is a revolutionary VS Code extension that transforms your development environment into a first-class AI workbench. Built on the Codessa AI platform, it provides intelligent code assistance, automated policy enforcement, and sophisticated agent-driven workflows through an intuitive chat interface, real-time diagnostics, and executable playbooks.

> 🚀 **Vision**: Bend VS Code into an AI-powered development workbench without forking the universe - leveraging existing Extension APIs to create a seamless AI development experience across all VS Code deployment scenarios.

## Features

### 🤖 @codessa Chat Participant
- **Smart Conversations**: Chat with AI about your code using `@codessa` in VS Code's chat panel
- **Contextual Awareness**: Automatically includes workspace context, open files, and selected text
- **Streaming Responses**: Real-time AI responses with markdown formatting
- **Direct Actions**: AI can create, edit, and delete files directly in your workspace
- **Command Execution**: Run terminal commands suggested by the AI

### 🛡️ GitGuard Policy Enforcement
- **Real-time Policy Checking**: Automatic policy validation on file save
- **Inline Diagnostics**: Policy violations shown as VS Code diagnostics with severity levels
- **Quick Fixes**: One-click fixes for common policy violations
- **Code Actions**: "Fix all" and "Explain policy" actions in the editor
- **Custom Rules**: Support for organization-specific GitGuard policies

### 📋 Agent Playbooks
- **Notebook Interface**: Define multi-step AI workflows as executable notebooks
- **Step Types**: Plan, Search, Edit, Test, and Analyze steps
- **Visual Execution**: See each step's progress and output in real-time
- **Reusable Workflows**: Save and share common automation patterns
- **JSON/YAML Configuration**: Flexible step definitions

### 🌐 Web Extension Support
- **vscode.dev Compatible**: Works in browser-based VS Code environments
- **Codespaces Ready**: Full functionality in GitHub Codespaces
- **Remote Development**: Supports SSH, containers, and remote workspaces
- **Fallback Modes**: Graceful degradation for limited web environments

### 🎨 Monaco Editor Integration
- **Lightweight Satellite**: Embed Monaco editor in web applications
- **AI-Powered**: Full Codessa AI assistance in embedded editors
- **Policy Checking**: Real-time policy validation in Monaco
- **Customizable**: Configurable themes, languages, and features

## 🚀 Quick Start

### Prerequisites
- **VS Code**: Version 1.85.0 or higher
- **Node.js**: Version 20.x or higher
- **Git**: For version control and collaboration
- **Codessa API Key**: Sign up at [codessa.dev](https://codessa.dev) for API access

### Installation Options

#### Option 1: VS Code Marketplace (Recommended)
```bash
# Install via VS Code Extensions view
1. Open VS Code
2. Press Ctrl+Shift+X (Cmd+Shift+X on Mac)
3. Search for "EchoPilot"
4. Click "Install"
```

#### Option 2: Development Installation
```bash
# Clone and setup for development
git clone https://github.com/username/EchoPilot.git
cd EchoPilot
npm install
npm run compile

# Launch Extension Development Host
code . && press F5
```

#### Option 3: Manual Installation
```bash
# Download and install .vsix package
npm install -g vsce
vsce package
code --install-extension echopilot-*.vsix
```

## ⚙️ Configuration

### Initial Setup
1. **Get API Credentials**
   - Visit [codessa.dev](https://codessa.dev) and create an account
   - Generate an API key from your dashboard
   - Copy your API endpoint URL

2. **Configure VS Code Settings**
   ```json
   {
     "codessa.apiEndpoint": "https://api.codessa.dev",
     "codessa.apiKey": "your-api-key-here"
   }
   ```

3. **Optional Advanced Settings**
   ```json
   {
     "codessa.enablePolicyChecks": true,
     "codessa.streamResponses": true,
     "codessa.webApiEndpoint": "https://web-api.codessa.dev",
     "codessa.maxTokens": 4096,
     "codessa.temperature": 0.7
   }
   ```

### Environment-Specific Configuration

#### For Web Environments (vscode.dev, Codespaces)
```json
{
  "codessa.webApiEndpoint": "https://web-api.codessa.dev",
  "codessa.corsEnabled": true
}
```

#### For Enterprise/Self-Hosted
```json
{
  "codessa.apiEndpoint": "https://your-domain.com/api",
  "codessa.customHeaders": {
    "X-Organization": "your-org-id"
  }
}
```

## Usage

### Chat Participant
1. Open VS Code's chat panel (Ctrl+Alt+I)
2. Type `@codessa` followed by your question
3. The AI will respond with contextual help and can perform actions

**Example conversations:**
- `@codessa explain this function` (with code selected)
- `@codessa refactor this component to use hooks`
- `@codessa create a test file for this module`
- `@codessa fix the TypeScript errors in this file`

### Policy Checking
- **Automatic**: Policies are checked when you save files
- **Manual**: Use Command Palette → "Codessa: Check GitGuard Policies"
- **Quick Fixes**: Click the lightbulb icon on policy violations

### Agent Playbooks
1. Use Command Palette → "Codessa: Run Agent Playbook"
2. A new notebook opens with example steps
3. Modify the JSON configuration for each step
4. Execute cells to run the workflow

**Example Playbook Steps:**
```json
{
  "type": "plan",
  "description": "Analyze codebase for refactoring opportunities",
  "input": {
    "task": "Identify components that could be converted to hooks",
    "scope": "src/components"
  }
}
```

### Monaco Editor
- Use Command Palette → "Codessa: Open Monaco Editor"
- Or "Codessa: Open Current File in Monaco Editor"
- Embedded editor with full AI assistance

## Web Extension Usage

The extension works seamlessly in web environments:

### vscode.dev
1. Go to [vscode.dev](https://vscode.dev)
2. Install the Codessa AI Workbench extension
3. Configure your API settings
4. Start using AI assistance in the browser

### GitHub Codespaces
1. Create or open a Codespace
2. The extension will be available if pre-installed
3. All features work with some limitations for file system operations

## Architecture

### Extension Structure
```
src/
├── extension.ts          # Main extension entry point
├── api/
│   └── apiClient.ts      # Codessa API communication
├── chat/
│   └── chatParticipant.ts # @codessa chat participant
├── policy/
│   └── diagnosticsProvider.ts # GitGuard policy checking
├── notebook/
│   └── playbookController.ts # Agent playbook execution
├── monaco/
│   └── monacoIntegration.ts # Monaco editor integration
└── web/
    └── webExtension.ts   # Web compatibility layer
```

### Key Components

- **Chat Participant**: Handles `@codessa` mentions and routes to AI backend
- **Policy Provider**: Integrates GitGuard with VS Code diagnostics system
- **Notebook Controller**: Executes agent playbooks as interactive notebooks
- **API Client**: Manages communication with Codessa platform
- **Web Compatibility**: Ensures functionality across all VS Code environments

## Development

### Prerequisites
- Node.js ≥ 20
- VS Code ≥ 1.85.0
- TypeScript

### Setup
```bash
git clone https://github.com/codessa/vscode-extension
cd vscode-extension
npm install
npm run watch
```

### Testing
```bash
npm run test
```

### Building
```bash
npm run compile
```

### Packaging
```bash
npm install -g vsce
vsce package
```

## API Integration

The extension communicates with the Codessa platform through REST APIs:

### Chat API
```typescript
POST /chat
{
  "message": "user prompt",
  "context": {
    "workspaceRoot": "/path/to/workspace",
    "activeFile": "src/component.tsx",
    "selectedText": "selected code"
  },
  "stream": true
}
```

### Policy API
```typescript
POST /policy/check
{
  "filePath": "src/component.tsx",
  "content": "file contents",
  "language": "typescript"
}
```

### Playbook API
```typescript
POST /playbook/execute
{
  "id": "step-123",
  "type": "edit",
  "description": "Refactor component",
  "input": { "files": ["src/component.tsx"] }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [docs.codessa.dev](https://docs.codessa.dev)
- **Issues**: [GitHub Issues](https://github.com/codessa/vscode-extension/issues)
- **Discord**: [Codessa Community](https://discord.gg/codessa)
- **Email**: support@codessa.dev

---

**Transform your VS Code into an AI-powered development workbench with Codessa! 🚀**
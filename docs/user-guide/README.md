# EchoPilot User Guide

## Welcome to EchoPilot

EchoPilot is an intelligent VS Code extension that enhances your development workflow with AI-powered chat assistance, code analysis, security policy enforcement, and interactive playbooks.

## Table of Contents

1. [Installation](#installation)
2. [Getting Started](#getting-started)
3. [Features Overview](#features-overview)
4. [AI Chat Assistant](#ai-chat-assistant)
5. [GitGuard Security](#gitguard-security)
6. [Agent Playbooks](#agent-playbooks)
7. [Monaco Editor Integration](#monaco-editor-integration)
8. [Web Extension Support](#web-extension-support)
9. [Configuration](#configuration)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#faq)

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "EchoPilot"
4. Click "Install" on the EchoPilot extension
5. Reload VS Code when prompted

### Manual Installation

1. Download the `.vsix` file from the releases page
2. Open VS Code
3. Go to Extensions view
4. Click the "..." menu and select "Install from VSIX..."
5. Select the downloaded `.vsix` file

## Getting Started

### Initial Setup

1. **Get Your API Key**
   - Visit [Codessa Platform](https://codessa.io)
   - Sign up or log in to your account
   - Navigate to API Keys section
   - Generate a new API key

2. **Configure EchoPilot**
   - Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
   - Search for "EchoPilot"
   - Enter your API key in the "Api Key" field
   - Configure other settings as needed

3. **Verify Installation**
   - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
   - Type "EchoPilot" to see available commands
   - Try the "EchoPilot: Start Chat" command

## Features Overview

### 🤖 AI Chat Assistant
Interact with an intelligent AI assistant directly within VS Code for code help, debugging, and development guidance.

### 🛡️ GitGuard Security
Real-time security policy enforcement and code analysis to prevent vulnerabilities and ensure compliance.

### 📚 Agent Playbooks
Execute interactive workflows and automation scripts to streamline development tasks.

### ✨ Monaco Editor Integration
Enhanced code editing experience with AI-powered completions and suggestions.

### 🌐 Web Extension Support
Full compatibility with VS Code for the Web and browser-based development environments.

## AI Chat Assistant

### Starting a Chat Session

1. **Using Command Palette**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
   - Type "EchoPilot: Start Chat"
   - Press Enter

2. **Using Chat Panel**
   - Open the Chat view in the Activity Bar
   - Look for the EchoPilot chat participant
   - Start typing your message

### Chat Commands

- `@echopilot help` - Get help and available commands
- `@echopilot explain` - Explain selected code
- `@echopilot debug` - Help debug code issues
- `@echopilot optimize` - Suggest code optimizations
- `@echopilot test` - Generate test cases
- `@echopilot document` - Generate documentation

### Example Conversations

**Code Explanation:**
```
User: @echopilot explain this function
[Selected code in editor]

EchoPilot: This function implements a binary search algorithm...
```

**Debugging Help:**
```
User: @echopilot debug - my API call is failing

EchoPilot: I can help you debug the API call. Let me analyze the code...
```

**Code Generation:**
```
User: @echopilot create a REST API endpoint for user authentication

EchoPilot: I'll create a REST API endpoint for user authentication...
```

### Context Awareness

EchoPilot understands your workspace context:
- Current file and selected code
- Project structure and dependencies
- Git repository information
- Previous conversation history

## GitGuard Security

### Real-time Code Analysis

GitGuard continuously analyzes your code for:
- Security vulnerabilities
- Policy violations
- Best practice deviations
- Compliance issues

### Security Diagnostics

1. **Viewing Issues**
   - Security issues appear as squiggly underlines in the editor
   - Check the Problems panel (`Ctrl+Shift+M`) for detailed list
   - Hover over highlighted code for quick info

2. **Issue Severity Levels**
   - 🔴 **Error**: Critical security vulnerabilities
   - 🟡 **Warning**: Potential security risks
   - 🔵 **Info**: Best practice suggestions

3. **Quick Fixes**
   - Click the lightbulb icon next to issues
   - Select from available quick fixes
   - Apply automatic corrections when available

### Policy Configuration

```json
{
  "echopilot.security.enabled": true,
  "echopilot.security.severity": "warning",
  "echopilot.security.rules": {
    "no-hardcoded-secrets": true,
    "sql-injection-prevention": true,
    "xss-prevention": true,
    "unsafe-eval": true
  }
}
```

### Common Security Issues

1. **Hardcoded Secrets**
   ```javascript
   // ❌ Bad
   const apiKey = "sk-1234567890abcdef";
   
   // ✅ Good
   const apiKey = process.env.API_KEY;
   ```

2. **SQL Injection**
   ```javascript
   // ❌ Bad
   const query = `SELECT * FROM users WHERE id = ${userId}`;
   
   // ✅ Good
   const query = "SELECT * FROM users WHERE id = ?";
   ```

3. **XSS Prevention**
   ```javascript
   // ❌ Bad
   element.innerHTML = userInput;
   
   // ✅ Good
   element.textContent = userInput;
   ```

## Agent Playbooks

### What are Playbooks?

Playbooks are interactive, step-by-step workflows that automate common development tasks and guide you through complex processes.

### Running Playbooks

1. **Browse Available Playbooks**
   - Open Command Palette
   - Type "EchoPilot: Browse Playbooks"
   - Select from available playbooks

2. **Execute a Playbook**
   - Select a playbook from the list
   - Follow the interactive prompts
   - Review and approve each step

### Built-in Playbooks

#### 🚀 Project Setup
- Initialize new projects
- Configure development environment
- Set up CI/CD pipelines

#### 🔧 Code Refactoring
- Modernize legacy code
- Apply design patterns
- Optimize performance

#### 🧪 Testing Workflows
- Generate test suites
- Set up testing frameworks
- Create mock data

#### 📦 Deployment
- Deploy to cloud platforms
- Configure environments
- Set up monitoring

### Creating Custom Playbooks

```yaml
name: "Custom Setup Playbook"
description: "Set up a new React project"
steps:
  - name: "Create project structure"
    type: "command"
    command: "npx create-react-app my-app"
  
  - name: "Install dependencies"
    type: "command"
    command: "npm install axios react-router-dom"
  
  - name: "Configure ESLint"
    type: "file"
    path: ".eslintrc.json"
    content: |
      {
        "extends": ["react-app"]
      }
```

## Monaco Editor Integration

### Enhanced Code Completion

EchoPilot enhances VS Code's IntelliSense with:
- AI-powered suggestions
- Context-aware completions
- Code snippet generation
- Documentation integration

### Smart Code Actions

1. **Refactoring Suggestions**
   - Extract methods/functions
   - Rename variables intelligently
   - Optimize imports

2. **Code Generation**
   - Generate boilerplate code
   - Create test cases
   - Add error handling

3. **Documentation**
   - Generate JSDoc comments
   - Create README sections
   - Add inline explanations

### Hover Information

Hover over code elements to see:
- Enhanced documentation
- Usage examples
- Best practices
- Related resources

## Web Extension Support

### VS Code for the Web

EchoPilot works seamlessly in:
- GitHub Codespaces
- VS Code for the Web (vscode.dev)
- Gitpod
- Other browser-based environments

### Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

### Limitations in Web Environment

- Some file system operations may be restricted
- Certain Node.js APIs are not available
- Performance may vary based on network connection

## Configuration

### Basic Settings

```json
{
  "echopilot.apiKey": "your-api-key-here",
  "echopilot.enabled": true,
  "echopilot.autoComplete": true,
  "echopilot.diagnostics": true
}
```

### Advanced Settings

```json
{
  "echopilot.api.baseUrl": "https://api.codessa.io/v1",
  "echopilot.api.timeout": 30000,
  "echopilot.api.retryAttempts": 3,
  "echopilot.chat.maxHistory": 50,
  "echopilot.chat.contextWindow": 4000,
  "echopilot.security.realTimeAnalysis": true,
  "echopilot.playbooks.autoExecute": false
}
```

### Workspace-specific Configuration

Create `.vscode/settings.json` in your project:

```json
{
  "echopilot.security.rules": {
    "no-hardcoded-secrets": true,
    "custom-rule-set": "./security-rules.json"
  },
  "echopilot.playbooks.directory": "./playbooks"
}
```

## Troubleshooting

### Common Issues

#### Extension Not Working

1. **Check API Key**
   - Verify API key is correctly configured
   - Ensure API key has necessary permissions
   - Check for typos or extra spaces

2. **Network Issues**
   - Check internet connection
   - Verify firewall settings
   - Try different network if behind corporate proxy

3. **VS Code Issues**
   - Restart VS Code
   - Disable other extensions temporarily
   - Check VS Code version compatibility

#### Chat Not Responding

1. **Check Output Panel**
   - Open Output panel (`View > Output`)
   - Select "EchoPilot" from dropdown
   - Look for error messages

2. **API Limits**
   - Check if you've exceeded API rate limits
   - Wait and try again
   - Upgrade API plan if needed

#### Diagnostics Not Showing

1. **Enable Diagnostics**
   ```json
   {
     "echopilot.diagnostics": true,
     "echopilot.security.enabled": true
   }
   ```

2. **Check File Types**
   - Ensure file type is supported
   - Check language-specific settings

### Getting Help

1. **Documentation**
   - Check this user guide
   - Review API documentation
   - Browse troubleshooting section

2. **Community Support**
   - GitHub Issues
   - Discord community
   - Stack Overflow (tag: echopilot)

3. **Contact Support**
   - Email: support@codessa.io
   - Include error logs and configuration
   - Describe steps to reproduce issue

## FAQ

### General Questions

**Q: Is EchoPilot free to use?**
A: EchoPilot offers both free and premium tiers. Check the pricing page for details.

**Q: What programming languages are supported?**
A: EchoPilot supports all major programming languages including JavaScript, TypeScript, Python, Java, C#, Go, Rust, and more.

**Q: Can I use EchoPilot offline?**
A: EchoPilot requires an internet connection for AI features, but some basic functionality works offline.

### Privacy and Security

**Q: Is my code sent to external servers?**
A: Only the code you explicitly share with the chat assistant is sent to our secure servers. We don't automatically scan your entire codebase.

**Q: How is my data protected?**
A: All data is encrypted in transit and at rest. We follow industry-standard security practices and compliance requirements.

**Q: Can I use EchoPilot in enterprise environments?**
A: Yes, we offer enterprise plans with additional security features, on-premises deployment, and custom integrations.

### Technical Questions

**Q: How do I update EchoPilot?**
A: VS Code automatically updates extensions. You can also manually check for updates in the Extensions view.

**Q: Can I customize the AI model used?**
A: Premium users can select from different AI models and configure model parameters.

**Q: How do I report bugs or request features?**
A: Use our GitHub repository to report issues or request features. Include detailed information and reproduction steps.

---

## Next Steps

- Explore the [API Reference](../api/README.md) for advanced integrations
- Check out [Development Guide](../development/README.md) for contributing
- Review [Configuration Guide](../configuration/README.md) for advanced setup
- Browse [Security Guide](../security/README.md) for best practices

Welcome to the EchoPilot community! 🚀
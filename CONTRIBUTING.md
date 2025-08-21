# Contributing to Ava-Prime

🎉 Thank you for your interest in contributing to Ava-Prime! We welcome contributions from developers of all skill levels and backgrounds.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Ways to Contribute

- 🐛 **Bug Reports**: Help us identify and fix issues
- 💡 **Feature Requests**: Suggest new features or improvements
- 📝 **Documentation**: Improve our docs, examples, and guides
- 🔧 **Code Contributions**: Fix bugs, implement features, or optimize performance
- 🧪 **Testing**: Write tests, test new features, or improve test coverage
- 🎨 **Design**: Improve UI/UX, create assets, or enhance user experience

### Before You Start

1. **Check existing issues** to avoid duplicate work
2. **Join our discussions** to understand project direction
3. **Read our documentation** to understand the codebase
4. **Start small** with good first issues if you're new

## Development Setup

### Prerequisites

- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher
- **VS Code**: Version 1.85.0 or higher
- **Git**: Latest stable version

### Local Development

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/Ava-Prime.git
cd Ava-Prime

# 2. Install dependencies
npm install

# 3. Build the extension
npm run compile

# 4. Start development mode
npm run watch

# 5. Launch Extension Development Host
# Press F5 in VS Code or run:
code . && press F5
```

### Project Structure

```
Ava-Prime/
├── src/                    # Source code
│   ├── api/               # API client and communication
│   ├── chat/              # Chat participant implementation
│   ├── policy/            # Policy checking and diagnostics
│   ├── notebook/          # Agent playbook controller
│   ├── monaco/            # Monaco editor integration
│   ├── web/               # Web extension compatibility
│   └── extension.ts       # Main extension entry point
├── out/                   # Compiled output
├── test/                  # Test files
├── docs/                  # Documentation
├── package.json           # Extension manifest
├── tsconfig.json          # TypeScript configuration
├── webpack.config.js      # Build configuration
└── README.md             # Project documentation
```

## Contributing Guidelines

### Issue Guidelines

#### Bug Reports

When reporting bugs, please include:

- **Clear title** describing the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Environment details** (VS Code version, OS, extension version)
- **Screenshots or logs** if applicable
- **Minimal reproduction case** if possible

**Template:**
```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- VS Code Version: 
- Extension Version: 
- OS: 
- Node.js Version: 

## Additional Context
Any other context about the problem.
```

#### Feature Requests

When requesting features, please include:

- **Clear use case** and problem statement
- **Proposed solution** or approach
- **Alternative solutions** considered
- **Implementation complexity** estimate
- **Breaking changes** if any

### Development Workflow

1. **Create an issue** or comment on existing one
2. **Fork the repository** to your GitHub account
3. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number-description
   ```
4. **Make your changes** following our coding standards
5. **Write tests** for new functionality
6. **Update documentation** if needed
7. **Commit your changes** using conventional commits
8. **Push to your fork** and create a pull request

### Branch Naming Convention

- `feature/description` - New features
- `fix/issue-number-description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements
- `chore/description` - Maintenance tasks

## Pull Request Process

### Before Submitting

- [ ] Code follows our style guidelines
- [ ] Self-review of code completed
- [ ] Tests added/updated and passing
- [ ] Documentation updated if needed
- [ ] No merge conflicts with main branch
- [ ] Commit messages follow conventional format

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
```

### Review Process

1. **Automated checks** must pass (CI/CD, linting, tests)
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** from at least one maintainer
5. **Merge** to main branch

## Coding Standards

### TypeScript Guidelines

- Use **strict TypeScript** configuration
- Prefer **interfaces over types** for object shapes
- Use **explicit return types** for functions
- Follow **camelCase** for variables and functions
- Use **PascalCase** for classes and interfaces
- Add **JSDoc comments** for public APIs

### Code Style

```typescript
// ✅ Good
interface ChatRequest {
  message: string;
  context: WorkspaceContext;
  stream?: boolean;
}

class CodessaChatParticipant {
  /**
   * Handles chat requests from VS Code
   * @param request The chat request to process
   * @returns Promise resolving to chat response
   */
  public async handleRequest(request: ChatRequest): Promise<ChatResponse> {
    // Implementation
  }
}

// ❌ Avoid
var chatParticipant = {
  handleRequest: function(req) {
    // No types, unclear structure
  }
};
```

### ESLint Configuration

We use ESLint with TypeScript rules. Run linting:

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Import Organization

```typescript
// 1. Node.js built-ins
import * as path from 'path';

// 2. External libraries
import * as vscode from 'vscode';
import axios from 'axios';

// 3. Internal modules (absolute paths)
import { CodessaApiClient } from '../api/apiClient';
import { WorkspaceContext } from '../types';

// 4. Relative imports
import { validateConfig } from './utils';
```

## Testing

### Test Structure

```
test/
├── unit/                  # Unit tests
│   ├── api/
│   ├── chat/
│   └── policy/
├── integration/           # Integration tests
├── fixtures/              # Test data
└── helpers/               # Test utilities
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { CodessaChatParticipant } from '../../src/chat/chatParticipant';

describe('CodessaChatParticipant', () => {
  let chatParticipant: CodessaChatParticipant;

  beforeEach(() => {
    chatParticipant = new CodessaChatParticipant();
  });

  it('should handle basic chat requests', async () => {
    const request = {
      message: 'Hello, @codessa',
      context: mockWorkspaceContext
    };

    const response = await chatParticipant.handleRequest(request);
    
    expect(response).toBeDefined();
    expect(response.content).toContain('Hello');
  });
});
```

## Documentation

### Documentation Types

- **README.md**: Project overview and quick start
- **API Documentation**: Generated from JSDoc comments
- **User Guides**: Step-by-step tutorials
- **Developer Docs**: Architecture and implementation details

### Writing Documentation

- Use **clear, concise language**
- Include **code examples** where helpful
- Add **screenshots** for UI features
- Keep **up-to-date** with code changes
- Follow **markdown best practices**

### JSDoc Standards

```typescript
/**
 * Processes a chat request and returns an AI response
 * 
 * @param request - The chat request containing message and context
 * @param options - Optional configuration for the request
 * @returns Promise that resolves to the chat response
 * 
 * @example
 * ```typescript
 * const response = await chatParticipant.handleRequest({
 *   message: 'Explain this code',
 *   context: workspaceContext
 * });
 * ```
 * 
 * @throws {ApiError} When the API request fails
 * @throws {ValidationError} When the request is invalid
 */
public async handleRequest(
  request: ChatRequest,
  options?: RequestOptions
): Promise<ChatResponse> {
  // Implementation
}
```

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat and community support
- **Email**: security@ava-prime.dev for security issues

### Getting Help

1. **Check documentation** and existing issues first
2. **Search discussions** for similar questions
3. **Ask in Discord** for quick help
4. **Create an issue** for bugs or feature requests

### Recognition

We recognize contributors through:

- **Contributors section** in README
- **Release notes** mentioning contributions
- **Special badges** for significant contributions
- **Maintainer invitations** for consistent contributors

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated changelog generation:

```bash
# Features
feat: add support for custom AI models
feat(chat): implement streaming responses

# Bug fixes
fix: resolve policy checking memory leak
fix(api): handle network timeout errors

# Documentation
docs: update installation instructions
docs(api): add JSDoc comments to public methods

# Refactoring
refactor: simplify chat participant logic
refactor(types): consolidate interface definitions

# Tests
test: add unit tests for policy provider
test(integration): add end-to-end chat tests

# Chores
chore: update dependencies
chore(ci): improve build performance
```

---

## Questions?

Don't hesitate to reach out! We're here to help:

- 💬 [GitHub Discussions](https://github.com/username/Ava-Prime/discussions)
- 🐛 [Report Issues](https://github.com/username/Ava-Prime/issues)
- 📧 [Email Us](mailto:contributors@ava-prime.dev)

Thank you for contributing to Ava-Prime! 🚀
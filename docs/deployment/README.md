# EchoPilot Deployment Guide

## Overview

This guide covers deployment strategies for EchoPilot across different environments and platforms.

## Deployment Options

### 1. VS Code Marketplace (Recommended)

#### Prerequisites
- Valid VS Code publisher account
- Extension packaged as `.vsix` file
- All tests passing
- Documentation complete

#### Steps
1. Package the extension
2. Upload to VS Code Marketplace
3. Configure marketplace listing
4. Monitor deployment status

### 2. Private Distribution

#### VSIX Installation
```bash
# Package extension
npm run package

# Install locally
code --install-extension echopilot-1.0.0.vsix
```

#### Enterprise Distribution
- Internal marketplace
- Group policy deployment
- Silent installation scripts

### 3. Development Deployment

#### Local Development
```bash
# Clone repository
git clone https://github.com/codessa-ai/echopilot.git
cd echopilot

# Install dependencies
npm install

# Run in development mode
npm run dev
```

#### Debug Mode
- Press F5 in VS Code
- Extension Development Host launches
- Real-time debugging available

## Environment Configuration

### Production Environment

#### Required Environment Variables
```bash
CODESSA_API_URL=https://api.codessa.io/v1
CODESSA_API_KEY=your-production-key
LOG_LEVEL=error
ENABLE_TELEMETRY=true
```

#### Production Settings
```json
{
  "echopilot.logLevel": "error",
  "echopilot.api.timeout": 30000,
  "echopilot.api.retryAttempts": 3,
  "echopilot.telemetry.enabled": true
}
```

### Staging Environment

#### Environment Variables
```bash
CODESSA_API_URL=https://staging-api.codessa.io/v1
CODESSA_API_KEY=your-staging-key
LOG_LEVEL=info
ENABLE_TELEMETRY=false
```

#### Staging Settings
```json
{
  "echopilot.logLevel": "info",
  "echopilot.api.timeout": 45000,
  "echopilot.api.retryAttempts": 5,
  "echopilot.telemetry.enabled": false
}
```

### Development Environment

#### Environment Variables
```bash
CODESSA_API_URL=http://localhost:3000/api/v1
CODESSA_API_KEY=dev-key-123
LOG_LEVEL=debug
ENABLE_TELEMETRY=false
```

#### Development Settings
```json
{
  "echopilot.logLevel": "debug",
  "echopilot.api.timeout": 60000,
  "echopilot.api.retryAttempts": 1,
  "echopilot.telemetry.enabled": false
}
```

## Platform-Specific Deployment

### Windows

#### System Requirements
- Windows 10/11
- VS Code 1.74.0+
- Node.js 16+

#### Installation Script
```powershell
# PowerShell installation script
$vsixPath = "echopilot-1.0.0.vsix"
code --install-extension $vsixPath

# Verify installation
code --list-extensions | Select-String "echopilot"
```

#### Group Policy Deployment
- Use VS Code policy templates
- Configure extension allowlist
- Deploy via Active Directory

### macOS

#### System Requirements
- macOS 10.15+
- VS Code 1.74.0+
- Node.js 16+

#### Installation Script
```bash
#!/bin/bash
# macOS installation script
VSIX_PATH="echopilot-1.0.0.vsix"
code --install-extension "$VSIX_PATH"

# Verify installation
code --list-extensions | grep echopilot
```

#### MDM Deployment
- Use Jamf or similar MDM
- Deploy via configuration profiles
- Automated installation scripts

### Linux

#### System Requirements
- Ubuntu 18.04+ / RHEL 8+ / SUSE 15+
- VS Code 1.74.0+
- Node.js 16+

#### Installation Script
```bash
#!/bin/bash
# Linux installation script
VSIX_PATH="echopilot-1.0.0.vsix"
code --install-extension "$VSIX_PATH"

# Verify installation
code --list-extensions | grep echopilot
```

#### Package Management
- Create .deb packages
- Create .rpm packages
- Use snap packages

## Web Extension Deployment

### VS Code for Web

#### Supported Platforms
- github.dev
- vscode.dev
- Codespaces
- Custom web instances

#### Deployment Configuration
```json
{
  "browser": "./dist/web/extension.js",
  "extensionKind": ["ui", "workspace"],
  "capabilities": {
    "virtualWorkspaces": true,
    "untrustedWorkspaces": {
      "supported": "limited"
    }
  }
}
```

### GitHub Codespaces

#### Devcontainer Configuration
```json
{
  "extensions": [
    "your-publisher.echopilot"
  ],
  "settings": {
    "echopilot.enabled": true,
    "echopilot.web.enabled": true
  }
}
```

## CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy EchoPilot

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build extension
        run: npm run build
        
      - name: Package extension
        run: npm run package
        
      - name: Publish to marketplace
        run: npx vsce publish
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
```

### Azure DevOps

```yaml
trigger:
  branches:
    include:
      - main
  tags:
    include:
      - v*

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: |
    npm ci
    npm test
    npm run build
    npm run package
  displayName: 'Build and test'

- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: '*.vsix'
    artifactName: 'extension'
```

## Monitoring and Maintenance

### Health Checks

#### Extension Health
```typescript
// Health check endpoint
export function checkExtensionHealth(): HealthStatus {
  return {
    status: 'healthy',
    version: getExtensionVersion(),
    apiConnectivity: checkApiConnection(),
    lastUpdate: new Date().toISOString()
  };
}
```

#### API Connectivity
```typescript
// API health check
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

### Logging and Telemetry

#### Production Logging
```typescript
// Production logger configuration
const logger = createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

#### Telemetry Collection
```typescript
// Telemetry configuration
const telemetry = {
  enabled: process.env.NODE_ENV === 'production',
  endpoint: 'https://telemetry.codessa.io/v1/events',
  batchSize: 100,
  flushInterval: 30000
};
```

### Update Management

#### Automatic Updates
- VS Code handles extension updates
- Configure update channels
- Pre-release vs stable releases

#### Manual Updates
```bash
# Update to latest version
code --install-extension echopilot --force

# Update to specific version
code --install-extension echopilot@1.2.0 --force
```

#### Rollback Procedures
```bash
# Uninstall current version
code --uninstall-extension your-publisher.echopilot

# Install previous version
code --install-extension echopilot-1.1.0.vsix
```

## Security Considerations

### API Key Management
- Use environment variables
- Implement key rotation
- Monitor API usage
- Set up alerts for anomalies

### Network Security
- Use HTTPS for all API calls
- Implement certificate pinning
- Configure proper CORS policies
- Use secure WebSocket connections

### Data Protection
- Encrypt sensitive data at rest
- Implement proper access controls
- Regular security audits
- Compliance with data regulations

## Troubleshooting

### Common Deployment Issues

#### Extension Not Loading
1. Check VS Code version compatibility
2. Verify extension dependencies
3. Review error logs
4. Restart VS Code

#### API Connection Issues
1. Verify API key configuration
2. Check network connectivity
3. Review firewall settings
4. Test API endpoints manually

#### Performance Issues
1. Monitor resource usage
2. Check API response times
3. Review extension logs
4. Optimize configuration settings

### Support Channels

- **Documentation**: [docs.echopilot.dev](https://docs.echopilot.dev)
- **GitHub Issues**: [github.com/your-org/echopilot/issues](https://github.com/your-org/echopilot/issues)
- **Community Forum**: [community.echopilot.dev](https://community.echopilot.dev)
- **Email Support**: support@echopilot.dev

## Rollout Strategy

### Phased Deployment

1. **Alpha Release** (Internal testing)
   - Development team only
   - Feature complete but may have bugs
   - Extensive testing and feedback

2. **Beta Release** (Limited external testing)
   - Selected external users
   - Feature freeze
   - Bug fixes and polish

3. **Release Candidate** (Pre-production)
   - Wider beta audience
   - Production-ready candidate
   - Final testing and validation

4. **General Availability** (Production)
   - Public release
   - Full marketplace availability
   - Production support

### Feature Flags

```typescript
// Feature flag configuration
const featureFlags = {
  newChatInterface: process.env.ENABLE_NEW_CHAT === 'true',
  advancedSecurity: process.env.ENABLE_ADVANCED_SECURITY === 'true',
  experimentalFeatures: process.env.ENABLE_EXPERIMENTAL === 'true'
};
```

## Performance Optimization

### Bundle Optimization
- Code splitting
- Tree shaking
- Minification
- Compression

### Runtime Optimization
- Lazy loading
- Caching strategies
- Memory management
- Background processing

### Monitoring
- Performance metrics
- User experience tracking
- Error rate monitoring
- Resource usage analysis
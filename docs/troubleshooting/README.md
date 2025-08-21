# EchoPilot Troubleshooting Guide

## Overview

This guide provides solutions to common issues you might encounter while using EchoPilot, along with diagnostic steps and advanced troubleshooting techniques.

## Quick Diagnostics

### Health Check Command

Run the built-in health check to quickly identify issues:

```bash
# In VS Code Command Palette (Ctrl+Shift+P)
EchoPilot: Run Health Check
```

This will check:
- Extension activation status
- API connectivity
- Configuration validity
- Required dependencies
- VS Code compatibility

### System Information

Gather system information for troubleshooting:

```bash
# In VS Code Command Palette
EchoPilot: Show System Information
```

This displays:
- EchoPilot version
- VS Code version
- Operating system
- Node.js version
- Extension configuration

## Common Issues

### Installation Issues

#### Extension Won't Install

**Symptoms:**
- Installation fails with error message
- Extension doesn't appear in installed extensions
- VS Code shows compatibility warnings

**Solutions:**

1. **Check VS Code Version**
   ```bash
   # Minimum required: VS Code 1.74.0
   code --version
   ```
   - Update VS Code if version is too old
   - Check [VS Code release notes](https://code.visualstudio.com/updates)

2. **Clear Extension Cache**
   ```bash
   # Windows
   rmdir /s "%USERPROFILE%\.vscode\extensions"
   
   # macOS/Linux
   rm -rf ~/.vscode/extensions
   ```
   - Restart VS Code
   - Reinstall extension

3. **Install from VSIX**
   ```bash
   code --install-extension echopilot-1.0.0.vsix
   ```

4. **Check Permissions**
   - Ensure VS Code has write permissions to extensions directory
   - Run VS Code as administrator (Windows) if necessary
   - Check corporate firewall/proxy settings

#### Extension Fails to Activate

**Symptoms:**
- Extension installed but not working
- No EchoPilot commands available
- Chat participant not registered

**Solutions:**

1. **Check Extension Status**
   - Go to Extensions view (Ctrl+Shift+X)
   - Find EchoPilot extension
   - Check if it shows "Disabled" or error status

2. **Enable Extension**
   ```bash
   # In Command Palette
   Extensions: Enable Extension
   ```
   - Select EchoPilot from the list

3. **Reload Window**
   ```bash
   # In Command Palette
   Developer: Reload Window
   ```

4. **Check Dependencies**
   - Ensure all required extensions are installed
   - Update VS Code to latest version
   - Check for conflicting extensions

5. **View Extension Logs**
   ```bash
   # In Command Palette
   Developer: Show Logs
   ```
   - Select "Extension Host"
   - Look for EchoPilot-related errors

### Configuration Issues

#### API Key Problems

**Symptoms:**
- "Invalid API key" error messages
- Authentication failures
- Unable to connect to Codessa API

**Solutions:**

1. **Verify API Key Format**
   ```typescript
   // Valid format: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   // Minimum length: 35 characters
   // Must start with 'sk-'
   ```

2. **Check API Key Configuration**
   ```json
   {
     "echopilot.apiKey": "your-actual-api-key-here"
   }
   ```
   - Open Settings (Ctrl+,)
   - Search for "echopilot.apiKey"
   - Ensure key is correctly entered

3. **Test API Key**
   ```bash
   # In Command Palette
   EchoPilot: Test API Connection
   ```

4. **Regenerate API Key**
   - Log into Codessa dashboard
   - Generate new API key
   - Update configuration

5. **Check Network Connectivity**
   ```bash
   # Test API endpoint
   curl -H "Authorization: Bearer your-api-key" https://api.codessa.io/v1/health
   ```

#### Configuration Not Loading

**Symptoms:**
- Settings changes not taking effect
- Extension using default values
- Configuration errors in logs

**Solutions:**

1. **Check Configuration Scope**
   - User settings: `%APPDATA%\Code\User\settings.json`
   - Workspace settings: `.vscode/settings.json`
   - Folder settings: `.vscode/settings.json` in specific folder

2. **Validate JSON Syntax**
   ```bash
   # Use JSON validator or VS Code's JSON validation
   # Check for missing commas, quotes, brackets
   ```

3. **Reset Configuration**
   ```json
   {
     "echopilot.enabled": true,
     "echopilot.apiKey": "your-api-key",
     "echopilot.logLevel": "info"
   }
   ```

4. **Reload Configuration**
   ```bash
   # In Command Palette
   Developer: Reload Window
   ```

### Chat Issues

#### Chat Not Responding

**Symptoms:**
- No response to chat messages
- Chat participant not found
- Error messages in chat

**Solutions:**

1. **Check Chat Participant Registration**
   ```bash
   # In Command Palette
   Chat: Show Participants
   ```
   - Verify "echopilot" appears in the list

2. **Restart Chat Service**
   ```bash
   # In Command Palette
   EchoPilot: Restart Chat Service
   ```

3. **Check API Connectivity**
   ```bash
   # In Command Palette
   EchoPilot: Test API Connection
   ```

4. **Clear Chat History**
   ```bash
   # In Command Palette
   EchoPilot: Clear Chat History
   ```

5. **Check Rate Limiting**
   - Wait a few minutes if hitting rate limits
   - Check API usage in Codessa dashboard

#### Chat Responses Are Slow

**Symptoms:**
- Long delays before responses
- Timeout errors
- Partial responses

**Solutions:**

1. **Check Network Connection**
   ```bash
   # Test latency to API
   ping api.codessa.io
   ```

2. **Adjust Timeout Settings**
   ```json
   {
     "echopilot.api.timeout": 60000,
     "echopilot.api.retryAttempts": 5
   }
   ```

3. **Reduce Context Size**
   ```json
   {
     "echopilot.chat.contextWindow": 2000,
     "echopilot.chat.maxHistory": 20
   }
   ```

4. **Check System Resources**
   - Monitor CPU and memory usage
   - Close unnecessary applications
   - Restart VS Code

### Security Analysis Issues

#### Security Diagnostics Not Showing

**Symptoms:**
- No security warnings in editor
- Security scan not finding issues
- Diagnostics panel empty

**Solutions:**

1. **Enable Security Analysis**
   ```json
   {
     "echopilot.security.enabled": true,
     "echopilot.security.realTimeAnalysis": true,
     "echopilot.diagnostics": true
   }
   ```

2. **Check File Types**
   - Security analysis only works on supported file types
   - Supported: .ts, .js, .py, .java, .cs, .php, .rb

3. **Verify Security Rules**
   ```bash
   # In Command Palette
   EchoPilot: Show Security Rules
   ```

4. **Run Manual Security Scan**
   ```bash
   # In Command Palette
   EchoPilot: Run Security Scan
   ```

5. **Check Exclude Patterns**
   ```json
   {
     "echopilot.security.excludePatterns": [
       "**/node_modules/**",
       "**/dist/**"
     ]
   }
   ```

#### False Positives in Security Analysis

**Symptoms:**
- Security warnings on safe code
- Too many false alarms
- Legitimate patterns flagged

**Solutions:**

1. **Adjust Severity Levels**
   ```json
   {
     "echopilot.security.severity": "error",
     "echopilot.security.rules": {
       "hardcoded-secrets": {
         "severity": "warning"
       }
     }
   }
   ```

2. **Add Custom Exclusions**
   ```json
   {
     "echopilot.security.customRules": {
       "excludePatterns": [
         "YOUR_API_KEY_HERE",
         "PLACEHOLDER_*",
         "example.com"
       ]
     }
   }
   ```

3. **Disable Specific Rules**
   ```json
   {
     "echopilot.security.rules": {
       "sql-injection": {
         "enabled": false
       }
     }
   }
   ```

### Performance Issues

#### Extension Running Slowly

**Symptoms:**
- VS Code becomes unresponsive
- High CPU/memory usage
- Slow typing/editing experience

**Solutions:**

1. **Check Resource Usage**
   ```bash
   # In Command Palette
   Developer: Show Running Extensions
   ```
   - Look for EchoPilot resource usage

2. **Disable Real-time Analysis**
   ```json
   {
     "echopilot.security.realTimeAnalysis": false,
     "echopilot.autoComplete.enabled": false
   }
   ```

3. **Reduce Analysis Frequency**
   ```json
   {
     "echopilot.autoComplete.debounceDelay": 1000,
     "echopilot.security.analysisDelay": 2000
   }
   ```

4. **Limit File Processing**
   ```json
   {
     "echopilot.security.maxFileSize": "1MB",
     "echopilot.security.excludePatterns": [
       "**/*.min.js",
       "**/dist/**",
       "**/build/**"
     ]
   }
   ```

5. **Restart Extension Host**
   ```bash
   # In Command Palette
   Developer: Restart Extension Host
   ```

#### Memory Leaks

**Symptoms:**
- VS Code memory usage keeps growing
- System becomes slow over time
- Out of memory errors

**Solutions:**

1. **Monitor Memory Usage**
   ```bash
   # In Command Palette
   Developer: Show Running Extensions
   ```

2. **Clear Extension Cache**
   ```bash
   # In Command Palette
   EchoPilot: Clear Cache
   ```

3. **Limit Chat History**
   ```json
   {
     "echopilot.chat.maxHistory": 10,
     "echopilot.chat.autoCleanup": true
   }
   ```

4. **Restart Extension Periodically**
   ```bash
   # In Command Palette
   Developer: Restart Extension Host
   ```

### Network Issues

#### Connection Timeouts

**Symptoms:**
- "Request timeout" errors
- API calls failing
- Intermittent connectivity

**Solutions:**

1. **Increase Timeout Values**
   ```json
   {
     "echopilot.api.timeout": 60000,
     "echopilot.api.retryAttempts": 5,
     "echopilot.api.retryDelay": 2000
   }
   ```

2. **Check Proxy Settings**
   ```json
   {
     "http.proxy": "http://proxy.company.com:8080",
     "http.proxyStrictSSL": false
   }
   ```

3. **Test Direct Connection**
   ```bash
   # Bypass proxy temporarily
   curl --noproxy '*' https://api.codessa.io/v1/health
   ```

4. **Configure Firewall**
   - Allow outbound HTTPS (port 443) to api.codessa.io
   - Add exception for VS Code process

#### SSL/TLS Issues

**Symptoms:**
- Certificate validation errors
- SSL handshake failures
- "Unable to verify certificate" errors

**Solutions:**

1. **Update Certificates**
   ```bash
   # Windows: Update Windows
   # macOS: Update macOS
   # Linux: Update ca-certificates package
   ```

2. **Configure Certificate Validation**
   ```json
   {
     "echopilot.api.validateCertificates": true,
     "echopilot.api.rejectUnauthorized": true
   }
   ```

3. **Corporate Certificate Issues**
   ```json
   {
     "http.systemCertificates": true,
     "echopilot.api.customCertPath": "/path/to/corporate/cert.pem"
   }
   ```

## Advanced Troubleshooting

### Debug Mode

Enable debug mode for detailed logging:

```json
{
  "echopilot.logLevel": "debug",
  "echopilot.debug.enabled": true,
  "echopilot.debug.verbose": true
}
```

### Log Analysis

#### Extension Logs

1. **View Extension Logs**
   ```bash
   # In Command Palette
   Developer: Show Logs
   ```
   - Select "Extension Host"
   - Filter for "EchoPilot"

2. **Export Logs**
   ```bash
   # In Command Palette
   EchoPilot: Export Logs
   ```

3. **Log Locations**
   - Windows: `%APPDATA%\Code\logs\extension-host`
   - macOS: `~/Library/Application Support/Code/logs/extension-host`
   - Linux: `~/.config/Code/logs/extension-host`

#### Common Log Patterns

**API Connection Issues:**
```
[ERROR] ApiClient: Request failed with status 401
[ERROR] Authentication failed: Invalid API key
```

**Configuration Issues:**
```
[WARN] Configuration: Invalid setting value for 'echopilot.apiKey'
[ERROR] ConfigManager: Failed to load configuration
```

**Performance Issues:**
```
[WARN] SecurityAnalyzer: Analysis took 5000ms for file.ts
[ERROR] MemoryManager: High memory usage detected
```

### Network Diagnostics

#### Test API Connectivity

```bash
# Test basic connectivity
curl -I https://api.codessa.io/v1/health

# Test with API key
curl -H "Authorization: Bearer your-api-key" https://api.codessa.io/v1/health

# Test with verbose output
curl -v -H "Authorization: Bearer your-api-key" https://api.codessa.io/v1/health
```

#### Network Trace

```bash
# Windows
netsh trace start capture=yes tracefile=network.etl
# Reproduce issue
netsh trace stop

# macOS/Linux
sudo tcpdump -i any -w network.pcap host api.codessa.io
# Reproduce issue
# Ctrl+C to stop
```

### Performance Profiling

#### CPU Profiling

1. **Start CPU Profile**
   ```bash
   # In Command Palette
   Developer: Start Extension Host Profile
   ```

2. **Reproduce Issue**
   - Perform actions that cause performance problems

3. **Stop and Analyze Profile**
   ```bash
   # In Command Palette
   Developer: Stop Extension Host Profile
   ```

#### Memory Profiling

1. **Take Memory Snapshot**
   ```bash
   # In Command Palette
   Developer: Take Heap Snapshot
   ```

2. **Analyze Memory Usage**
   - Look for memory leaks
   - Identify large objects
   - Check for retained references

### Extension Development Debugging

#### Debug Extension Source

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/echopilot.git
   cd echopilot
   npm install
   ```

2. **Open in VS Code**
   ```bash
   code .
   ```

3. **Start Debugging**
   - Press F5 to launch Extension Development Host
   - Set breakpoints in source code
   - Use Debug Console for inspection

#### Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": [
        "${workspaceFolder}/out/**/*.js"
      ],
      "preLaunchTask": "npm: compile"
    }
  ]
}
```

## Error Reference

### Common Error Codes

#### API Errors

| Code | Message | Solution |
|------|---------|----------|
| 401 | Unauthorized | Check API key configuration |
| 403 | Forbidden | Verify API key permissions |
| 429 | Rate Limited | Wait and retry, check usage limits |
| 500 | Internal Server Error | Check API status, retry later |
| 503 | Service Unavailable | API maintenance, check status page |

#### Extension Errors

| Code | Message | Solution |
|------|---------|----------|
| E001 | Extension activation failed | Check VS Code version, restart |
| E002 | Configuration invalid | Validate settings.json syntax |
| E003 | API key missing | Configure echopilot.apiKey |
| E004 | Network connection failed | Check internet, proxy settings |
| E005 | Security analysis failed | Check file permissions, syntax |

### Error Message Patterns

#### Authentication Errors
```
Error: Invalid API key format
Solution: Ensure API key starts with 'sk-' and is at least 35 characters

Error: API key expired
Solution: Generate new API key in Codessa dashboard

Error: Insufficient permissions
Solution: Check API key scope and permissions
```

#### Network Errors
```
Error: ECONNREFUSED
Solution: Check internet connection and firewall settings

Error: ETIMEDOUT
Solution: Increase timeout values, check proxy configuration

Error: CERT_UNTRUSTED
Solution: Update certificates, configure corporate proxy
```

#### Configuration Errors
```
Error: Invalid JSON in settings
Solution: Validate JSON syntax, check for missing commas/quotes

Error: Unknown configuration property
Solution: Check property name spelling, refer to documentation

Error: Configuration value out of range
Solution: Check allowed values in configuration reference
```

## Getting Help

### Self-Service Resources

1. **Documentation**
   - [User Guide](../user-guide/README.md)
   - [Configuration Guide](../configuration/README.md)
   - [API Reference](../api/README.md)

2. **Health Check Tool**
   ```bash
   # In Command Palette
   EchoPilot: Run Health Check
   ```

3. **System Information**
   ```bash
   # In Command Palette
   EchoPilot: Show System Information
   ```

### Community Support

1. **GitHub Issues**
   - Search existing issues: [github.com/your-org/echopilot/issues](https://github.com/your-org/echopilot/issues)
   - Create new issue with:
     - System information
     - Steps to reproduce
     - Expected vs actual behavior
     - Relevant logs

2. **Community Forum**
   - [community.echopilot.dev](https://community.echopilot.dev)
   - Search existing topics
   - Post detailed questions

3. **Discord Server**
   - [discord.gg/echopilot](https://discord.gg/echopilot)
   - Real-time community support
   - Developer Q&A sessions

### Professional Support

1. **Email Support**
   - support@echopilot.dev
   - Include system information and logs
   - Response within 24-48 hours

2. **Priority Support**
   - Available for enterprise customers
   - Dedicated support channel
   - SLA guarantees

### Bug Reports

When reporting bugs, include:

1. **System Information**
   ```
   EchoPilot Version: 1.0.0
   VS Code Version: 1.85.0
   OS: Windows 11 (Build 22000)
   Node.js: 18.17.0
   ```

2. **Configuration**
   ```json
   {
     "echopilot.enabled": true,
     "echopilot.logLevel": "debug"
   }
   ```

3. **Steps to Reproduce**
   ```
   1. Open VS Code
   2. Install EchoPilot extension
   3. Configure API key
   4. Open chat panel
   5. Type "@echopilot hello"
   6. Observe error message
   ```

4. **Expected Behavior**
   ```
   Extension should respond with greeting message
   ```

5. **Actual Behavior**
   ```
   Error: "API key invalid" appears in chat
   ```

6. **Logs**
   ```
   [ERROR] ApiClient: Request failed with status 401
   [ERROR] Authentication failed: Invalid API key
   ```

## Prevention Tips

### Best Practices

1. **Keep Software Updated**
   - Update VS Code regularly
   - Update EchoPilot extension
   - Update Node.js and dependencies

2. **Monitor Resource Usage**
   - Check extension performance regularly
   - Monitor memory and CPU usage
   - Restart VS Code periodically

3. **Backup Configuration**
   - Export settings regularly
   - Document custom configurations
   - Version control workspace settings

4. **Test Changes**
   - Test configuration changes in development
   - Validate API keys before deployment
   - Monitor logs after changes

### Maintenance Schedule

- **Daily**: Check for extension updates
- **Weekly**: Review logs for errors
- **Monthly**: Clean cache and temporary files
- **Quarterly**: Review and update configuration
- **Annually**: Security audit and dependency updates

## Troubleshooting Checklist

When encountering issues, work through this checklist:

- [ ] Check VS Code and extension versions
- [ ] Verify API key configuration
- [ ] Test network connectivity
- [ ] Review extension logs
- [ ] Check system resources
- [ ] Validate configuration syntax
- [ ] Try with minimal configuration
- [ ] Restart VS Code
- [ ] Clear extension cache
- [ ] Test in clean environment
- [ ] Check for conflicting extensions
- [ ] Review recent changes
- [ ] Consult documentation
- [ ] Search community forums
- [ ] Contact support if needed
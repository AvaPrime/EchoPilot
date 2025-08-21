# EchoPilot Configuration Guide

## Overview

This guide covers all configuration options available in EchoPilot, from basic setup to advanced customization.

## Configuration Hierarchy

EchoPilot follows VS Code's configuration hierarchy:

1. **Default Settings** - Built-in defaults
2. **User Settings** - Global user preferences
3. **Workspace Settings** - Project-specific settings
4. **Folder Settings** - Multi-root workspace folder settings

## Basic Configuration

### Required Settings

```json
{
  "echopilot.apiKey": "your-codessa-api-key"
}
```

### Essential Settings

```json
{
  "echopilot.enabled": true,
  "echopilot.apiKey": "your-api-key",
  "echopilot.api.baseUrl": "https://api.codessa.io/v1",
  "echopilot.diagnostics": true,
  "echopilot.autoComplete": true
}
```

## Complete Settings Reference

### Core Settings

#### `echopilot.enabled`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable/disable the EchoPilot extension

#### `echopilot.apiKey`
- **Type**: `string`
- **Default**: `""`
- **Description**: Your Codessa API key for authentication
- **Required**: Yes

#### `echopilot.logLevel`
- **Type**: `string`
- **Default**: `"info"`
- **Options**: `"error"`, `"warn"`, `"info"`, `"debug"`
- **Description**: Logging level for debugging

### API Configuration

#### `echopilot.api.baseUrl`
- **Type**: `string`
- **Default**: `"https://api.codessa.io/v1"`
- **Description**: Base URL for the Codessa API

#### `echopilot.api.timeout`
- **Type**: `number`
- **Default**: `30000`
- **Description**: API request timeout in milliseconds

#### `echopilot.api.retryAttempts`
- **Type**: `number`
- **Default**: `3`
- **Description**: Number of retry attempts for failed API calls

#### `echopilot.api.retryDelay`
- **Type**: `number`
- **Default**: `1000`
- **Description**: Delay between retry attempts in milliseconds

#### `echopilot.api.maxConcurrentRequests`
- **Type**: `number`
- **Default**: `5`
- **Description**: Maximum number of concurrent API requests

### Chat Configuration

#### `echopilot.chat.enabled`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable chat participant functionality

#### `echopilot.chat.maxHistory`
- **Type**: `number`
- **Default**: `50`
- **Description**: Maximum number of messages to keep in chat history

#### `echopilot.chat.contextWindow`
- **Type**: `number`
- **Default**: `4000`
- **Description**: Maximum context window size for chat conversations

#### `echopilot.chat.model`
- **Type**: `string`
- **Default**: `"gpt-4"`
- **Options**: `"gpt-3.5-turbo"`, `"gpt-4"`, `"claude-3"`, `"custom"`
- **Description**: AI model to use for chat responses

#### `echopilot.chat.temperature`
- **Type**: `number`
- **Default**: `0.7`
- **Range**: `0.0` to `2.0`
- **Description**: Controls randomness in AI responses

#### `echopilot.chat.maxTokens`
- **Type**: `number`
- **Default**: `2000`
- **Description**: Maximum tokens in AI response

#### `echopilot.chat.streamResponse`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Stream chat responses for better UX

### Security & Diagnostics

#### `echopilot.security.enabled`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable security analysis and diagnostics

#### `echopilot.security.realTimeAnalysis`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Perform real-time security analysis while typing

#### `echopilot.security.severity`
- **Type**: `string`
- **Default**: `"warning"`
- **Options**: `"error"`, `"warning"`, `"info"`
- **Description**: Minimum severity level to show diagnostics

#### `echopilot.security.rules`
- **Type**: `object`
- **Default**: See [Security Rules](#security-rules)
- **Description**: Configuration for security rules

#### `echopilot.security.customRulesPath`
- **Type**: `string`
- **Default**: `""`
- **Description**: Path to custom security rules file

#### `echopilot.diagnostics`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable diagnostic messages in editor

### Auto-completion

#### `echopilot.autoComplete.enabled`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable AI-powered auto-completion

#### `echopilot.autoComplete.triggerCharacters`
- **Type**: `array`
- **Default**: `[".", " ", "(", "["]`
- **Description**: Characters that trigger auto-completion

#### `echopilot.autoComplete.maxSuggestions`
- **Type**: `number`
- **Default**: `10`
- **Description**: Maximum number of completion suggestions

#### `echopilot.autoComplete.debounceDelay`
- **Type**: `number`
- **Default**: `300`
- **Description**: Delay before triggering completion in milliseconds

### Monaco Editor Integration

#### `echopilot.monaco.enabled`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable Monaco editor enhancements

#### `echopilot.monaco.hoverInfo`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Show enhanced hover information

#### `echopilot.monaco.codeActions`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable AI-powered code actions

#### `echopilot.monaco.inlineHints`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Show inline hints and suggestions

### Playbooks

#### `echopilot.playbooks.enabled`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable playbook functionality

#### `echopilot.playbooks.directory`
- **Type**: `string`
- **Default**: `"./playbooks"`
- **Description**: Directory containing custom playbooks

#### `echopilot.playbooks.autoExecute`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Automatically execute playbook steps without confirmation

#### `echopilot.playbooks.maxConcurrent`
- **Type**: `number`
- **Default**: `3`
- **Description**: Maximum number of concurrent playbook executions

### Web Extension

#### `echopilot.web.enabled`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable web extension features

#### `echopilot.web.corsProxy`
- **Type**: `string`
- **Default**: `""`
- **Description**: CORS proxy URL for web environments

#### `echopilot.web.fallbackMode`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable fallback mode for limited web environments

## Security Rules

### Default Security Rules

```json
{
  "echopilot.security.rules": {
    "no-hardcoded-secrets": {
      "enabled": true,
      "severity": "error",
      "patterns": [
        "password\\s*=\\s*['\"][^'\"]+['\"]
/**
 * Monaco Editor Integration for Codessa AI Workbench
 * 
 * This module provides a lightweight Monaco editor integration that can be used
 * in web applications, internal portals, or ops consoles to provide code editing
 * capabilities with Codessa AI assistance.
 */

import * as vscode from 'vscode';
import { CodessaApiClient } from '../api/apiClient';

/**
 * Monaco Editor Panel Provider
 * Creates webview panels with embedded Monaco editor that can communicate with Codessa AI
 */
export class MonacoEditorProvider {
    private apiClient: CodessaApiClient;
    private panels: Map<string, vscode.WebviewPanel> = new Map();

    constructor(apiClient: CodessaApiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Create a new Monaco editor panel
     */
    async createEditorPanel(
        title: string = 'Codessa Monaco Editor',
        language: string = 'typescript',
        initialContent: string = ''
    ): Promise<vscode.WebviewPanel> {
        const panel = vscode.window.createWebviewPanel(
            'codessa-monaco',
            title,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(vscode.extensions.getExtension('codessa.codessa-ai-workbench')?.extensionUri || vscode.Uri.file(''), 'resources')
                ]
            }
        );

        // Generate unique panel ID
        const panelId = `monaco-${Date.now()}`;
        this.panels.set(panelId, panel);

        // Set up the webview content
        panel.webview.html = this.getMonacoHtml(panelId, language, initialContent);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async (message) => {
                await this.handleWebviewMessage(panelId, message);
            },
            undefined
        );

        // Clean up when panel is disposed
        panel.onDidDispose(() => {
            this.panels.delete(panelId);
        });

        return panel;
    }

    /**
     * Handle messages from the Monaco editor webview
     */
    private async handleWebviewMessage(panelId: string, message: any): Promise<void> {
        const panel = this.panels.get(panelId);
        if (!panel) return;

        switch (message.type) {
            case 'ai-assist':
                await this.handleAiAssist(panel, message.data);
                break;
            case 'policy-check':
                await this.handlePolicyCheck(panel, message.data);
                break;
            case 'save-content':
                await this.handleSaveContent(message.data);
                break;
            case 'ready':
                // Monaco editor is ready
                console.log(`Monaco editor ${panelId} is ready`);
                break;
        }
    }

    /**
     * Handle AI assistance requests from Monaco editor
     */
    private async handleAiAssist(panel: vscode.WebviewPanel, data: any): Promise<void> {
        try {
            const response = await this.apiClient.sendChatMessage({
                message: data.prompt,
                context: {
                    activeFile: data.fileName || 'monaco-editor.ts',
                    selectedText: data.selectedText,
                    workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
                }
            });

            // Send response back to Monaco editor
            panel.webview.postMessage({
                type: 'ai-response',
                requestId: data.requestId,
                response: response.content,
                actions: response.actions
            });
        } catch (error) {
            panel.webview.postMessage({
                type: 'ai-error',
                requestId: data.requestId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Handle policy checking requests from Monaco editor
     */
    private async handlePolicyCheck(panel: vscode.WebviewPanel, data: any): Promise<void> {
        try {
            const violations = await this.apiClient.checkPolicies({
                filePath: data.fileName || 'monaco-editor.ts',
                content: data.content,
                language: data.language
            });

            // Send violations back to Monaco editor
            panel.webview.postMessage({
                type: 'policy-violations',
                requestId: data.requestId,
                violations: violations
            });
        } catch (error) {
            panel.webview.postMessage({
                type: 'policy-error',
                requestId: data.requestId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Handle save content requests
     */
    private async handleSaveContent(data: any): Promise<void> {
        if (data.fileName && data.content) {
            try {
                const uri = vscode.Uri.file(data.fileName);
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(uri, encoder.encode(data.content));
                vscode.window.showInformationMessage(`Saved ${data.fileName}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to save ${data.fileName}: ${error}`);
            }
        }
    }

    /**
     * Generate HTML content for Monaco editor webview
     */
    private getMonacoHtml(panelId: string, language: string, initialContent: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Codessa Monaco Editor</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .toolbar {
            height: 40px;
            background: var(--vscode-titleBar-activeBackground);
            border-bottom: 1px solid var(--vscode-titleBar-border);
            display: flex;
            align-items: center;
            padding: 0 10px;
            gap: 10px;
        }
        .toolbar button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        .toolbar button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .toolbar button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        #container {
            height: calc(100vh - 40px);
            width: 100%;
        }
        .ai-panel {
            position: fixed;
            top: 40px;
            right: 0;
            width: 300px;
            height: calc(100vh - 40px);
            background: var(--vscode-sideBar-background);
            border-left: 1px solid var(--vscode-sideBar-border);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 1000;
            display: flex;
            flex-direction: column;
        }
        .ai-panel.open {
            transform: translateX(0);
        }
        .ai-header {
            padding: 10px;
            border-bottom: 1px solid var(--vscode-sideBar-border);
            font-weight: bold;
        }
        .ai-content {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
        }
        .ai-input {
            padding: 10px;
            border-top: 1px solid var(--vscode-sideBar-border);
        }
        .ai-input textarea {
            width: 100%;
            height: 60px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            padding: 5px;
            resize: none;
            font-family: inherit;
        }
        .ai-input button {
            margin-top: 5px;
            width: 100%;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px;
            border-radius: 3px;
            cursor: pointer;
        }
        .violation {
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 8px;
            margin: 5px 0;
            border-radius: 3px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button onclick="saveContent()">💾 Save</button>
        <button onclick="checkPolicies()">🛡️ Check Policies</button>
        <button onclick="toggleAiPanel()">🤖 AI Assistant</button>
        <button onclick="formatCode()">✨ Format</button>
        <span style="margin-left: auto; font-size: 12px; opacity: 0.7;">Codessa Monaco Editor</span>
    </div>
    
    <div id="container"></div>
    
    <div id="aiPanel" class="ai-panel">
        <div class="ai-header">
            🤖 Codessa AI Assistant
            <button onclick="toggleAiPanel()" style="float: right; background: none; border: none; color: inherit; cursor: pointer;">✕</button>
        </div>
        <div id="aiContent" class="ai-content">
            <p>Ask me anything about your code! I can help with:</p>
            <ul>
                <li>Code explanations</li>
                <li>Bug fixes</li>
                <li>Refactoring suggestions</li>
                <li>Best practices</li>
                <li>Policy compliance</li>
            </ul>
        </div>
        <div class="ai-input">
            <textarea id="aiPrompt" placeholder="Ask me about your code..."></textarea>
            <button onclick="sendAiRequest()">Send</button>
        </div>
    </div>

    <script src="https://unpkg.com/monaco-editor@0.44.0/min/vs/loader.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        let editor;
        let currentFileName = 'untitled.${language}';
        let aiPanelOpen = false;

        // Initialize Monaco Editor
        require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            editor = monaco.editor.create(document.getElementById('container'), {
                value: \`${initialContent.replace(/`/g, '\\`')}\`,
                language: '${language}',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                wordWrap: 'on'
            });

            // Add AI assistance context menu
            editor.addAction({
                id: 'ai-explain',
                label: '🤖 Explain with AI',
                contextMenuGroupId: 'navigation',
                run: function(ed) {
                    const selection = ed.getSelection();
                    const selectedText = ed.getModel().getValueInRange(selection);
                    if (selectedText) {
                        sendAiRequest('Explain this code: ' + selectedText);
                        toggleAiPanel(true);
                    }
                }
            });

            editor.addAction({
                id: 'ai-fix',
                label: '🔧 Fix with AI',
                contextMenuGroupId: 'navigation',
                run: function(ed) {
                    const selection = ed.getSelection();
                    const selectedText = ed.getModel().getValueInRange(selection);
                    if (selectedText) {
                        sendAiRequest('Fix any issues in this code: ' + selectedText);
                        toggleAiPanel(true);
                    }
                }
            });

            // Notify VS Code that Monaco is ready
            vscode.postMessage({ type: 'ready', panelId: '${panelId}' });
        });

        function saveContent() {
            if (editor) {
                vscode.postMessage({
                    type: 'save-content',
                    data: {
                        fileName: currentFileName,
                        content: editor.getValue()
                    }
                });
            }
        }

        function checkPolicies() {
            if (editor) {
                vscode.postMessage({
                    type: 'policy-check',
                    data: {
                        requestId: Date.now(),
                        fileName: currentFileName,
                        content: editor.getValue(),
                        language: '${language}'
                    }
                });
            }
        }

        function toggleAiPanel(forceOpen = false) {
            const panel = document.getElementById('aiPanel');
            if (forceOpen || !aiPanelOpen) {
                panel.classList.add('open');
                aiPanelOpen = true;
            } else {
                panel.classList.remove('open');
                aiPanelOpen = false;
            }
        }

        function sendAiRequest(prompt = null) {
            const promptText = prompt || document.getElementById('aiPrompt').value;
            if (!promptText.trim()) return;

            const selection = editor.getSelection();
            const selectedText = editor.getModel().getValueInRange(selection);

            vscode.postMessage({
                type: 'ai-assist',
                data: {
                    requestId: Date.now(),
                    prompt: promptText,
                    fileName: currentFileName,
                    selectedText: selectedText,
                    fullContent: editor.getValue()
                }
            });

            // Clear input if it was typed by user
            if (!prompt) {
                document.getElementById('aiPrompt').value = '';
            }

            // Show loading in AI panel
            const aiContent = document.getElementById('aiContent');
            aiContent.innerHTML += '<div class="ai-message">🤔 Thinking...</div>';
        }

        function formatCode() {
            if (editor) {
                editor.getAction('editor.action.formatDocument').run();
            }
        }

        // Handle messages from VS Code
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'ai-response':
                    displayAiResponse(message.response, message.actions);
                    break;
                case 'ai-error':
                    displayAiError(message.error);
                    break;
                case 'policy-violations':
                    displayPolicyViolations(message.violations);
                    break;
                case 'policy-error':
                    displayPolicyError(message.error);
                    break;
            }
        });

        function displayAiResponse(response, actions) {
            const aiContent = document.getElementById('aiContent');
            // Remove loading message
            const loadingMsg = aiContent.querySelector('.ai-message');
            if (loadingMsg) loadingMsg.remove();
            
            const responseDiv = document.createElement('div');
            responseDiv.className = 'ai-response';
            responseDiv.innerHTML = \`<div style="background: var(--vscode-textBlockQuote-background); padding: 10px; margin: 10px 0; border-radius: 3px; white-space: pre-wrap;">\${response}</div>\`;
            aiContent.appendChild(responseDiv);
            aiContent.scrollTop = aiContent.scrollHeight;
        }

        function displayAiError(error) {
            const aiContent = document.getElementById('aiContent');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'ai-error';
            errorDiv.innerHTML = \`<div style="background: var(--vscode-inputValidation-errorBackground); padding: 10px; margin: 10px 0; border-radius: 3px;">❌ Error: \${error}</div>\`;
            aiContent.appendChild(errorDiv);
        }

        function displayPolicyViolations(violations) {
            const aiContent = document.getElementById('aiContent');
            aiContent.innerHTML = '<h4>🛡️ Policy Check Results</h4>';
            
            if (violations.length === 0) {
                aiContent.innerHTML += '<div style="color: green;">✅ No policy violations found!</div>';
            } else {
                violations.forEach(violation => {
                    const violationDiv = document.createElement('div');
                    violationDiv.className = 'violation';
                    violationDiv.innerHTML = \`
                        <strong>\${violation.rule}</strong><br>
                        Line \${violation.line}: \${violation.message}
                    \`;
                    aiContent.appendChild(violationDiv);
                });
            }
        }

        function displayPolicyError(error) {
            const aiContent = document.getElementById('aiContent');
            aiContent.innerHTML = \`<div class="violation">❌ Policy check failed: \${error}</div>\`;
        }

        // Handle Enter key in AI prompt
        document.getElementById('aiPrompt').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAiRequest();
            }
        });
    </script>
</body>
</html>`;
    }

    /**
     * Register Monaco editor commands
     */
    static registerCommands(context: vscode.ExtensionContext, apiClient: CodessaApiClient): void {
        const provider = new MonacoEditorProvider(apiClient);

        // Command to open Monaco editor
        context.subscriptions.push(
            vscode.commands.registerCommand('codessa.openMonacoEditor', async () => {
                await provider.createEditorPanel();
            })
        );

        // Command to open Monaco editor with current file
        context.subscriptions.push(
            vscode.commands.registerCommand('codessa.openMonacoEditorWithFile', async () => {
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    const document = activeEditor.document;
                    await provider.createEditorPanel(
                        `Monaco: ${document.fileName}`,
                        document.languageId,
                        document.getText()
                    );
                } else {
                    vscode.window.showWarningMessage('No active file to open in Monaco editor');
                }
            })
        );
    }
}
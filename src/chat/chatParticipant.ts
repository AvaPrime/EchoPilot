import * as vscode from 'vscode';
import { CodessaApiClient, ChatRequest, ChatResponse } from '../api/apiClient';

export class CodessaChatParticipant {
    private participant: vscode.ChatParticipant;
    private apiClient: CodessaApiClient;

    constructor(apiClient: CodessaApiClient) {
        this.apiClient = apiClient;
    }

    register(): vscode.Disposable {
        this.participant = vscode.chat.createChatParticipant('codessa.chat', this.handleChatRequest.bind(this));
        this.participant.iconPath = vscode.Uri.joinPath(
            vscode.extensions.getExtension('codessa.echopilot')?.extensionUri || vscode.Uri.file(''),
            'resources',
            'codessa-icon.svg'
        );
        this.participant.followupProvider = {
            provideFollowups: this.provideFollowups.bind(this)
        };

        return this.participant;
    }

    private async handleChatRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        try {
            // Show thinking indicator
            stream.progress('Thinking...');

            // Gather workspace context
            const workspaceContext = await this.gatherWorkspaceContext();

            // Prepare request for Codessa API
            const chatRequest: ChatRequest = {
                message: request.prompt,
                context: workspaceContext,
                stream: true
            };

            // Send request to Codessa API with streaming
            await this.apiClient.sendChatMessage(
                chatRequest,
                (chunk: string) => {
                    // Stream markdown content
                    stream.markdown(chunk);
                },
                async (action: any) => {
                    // Handle actions from the AI
                    await this.handleAction(action, stream);
                }
            );

        } catch (error) {
            console.error('Error in chat request:', error);
            stream.markdown(`❌ **Error**: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        }
    }

    private async gatherWorkspaceContext(): Promise<any> {
        const context: any = {};

        // Get workspace root
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            context.workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        }

        // Get active editor info
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            context.activeFile = activeEditor.document.fileName;
            
            // Get selected text if any
            const selection = activeEditor.selection;
            if (!selection.isEmpty) {
                context.selectedText = activeEditor.document.getText(selection);
            }
        }

        // Get list of open files
        context.openFiles = vscode.workspace.textDocuments
            .filter(doc => !doc.isUntitled && doc.uri.scheme === 'file')
            .map(doc => doc.fileName);

        return context;
    }

    private async handleAction(action: any, stream: vscode.ChatResponseStream): Promise<void> {
        try {
            switch (action.type) {
                case 'edit':
                    await this.handleEditAction(action, stream);
                    break;
                case 'create':
                    await this.handleCreateAction(action, stream);
                    break;
                case 'delete':
                    await this.handleDeleteAction(action, stream);
                    break;
                case 'run':
                    await this.handleRunAction(action, stream);
                    break;
                default:
                    console.warn('Unknown action type:', action.type);
            }
        } catch (error) {
            console.error('Error handling action:', error);
            stream.markdown(`\n\n⚠️ **Action Error**: Failed to execute ${action.type} action - ${error}`);
        }
    }

    private async handleEditAction(action: any, stream: vscode.ChatResponseStream): Promise<void> {
        const uri = vscode.Uri.file(action.target);
        
        try {
            // Open the file if not already open
            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document);

            // Apply the edit
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );
            edit.replace(uri, fullRange, action.content);
            
            const success = await vscode.workspace.applyEdit(edit);
            
            if (success) {
                stream.markdown(`\n\n✅ **File Updated**: ${action.target}`);
                
                // Show a button to view the changes
                stream.button({
                    command: 'vscode.diff',
                    title: 'View Changes',
                    arguments: [uri, uri]
                });
            } else {
                stream.markdown(`\n\n❌ **Edit Failed**: Could not apply changes to ${action.target}`);
            }
        } catch (error) {
            stream.markdown(`\n\n❌ **Edit Error**: ${error}`);
        }
    }

    private async handleCreateAction(action: any, stream: vscode.ChatResponseStream): Promise<void> {
        const uri = vscode.Uri.file(action.target);
        
        try {
            const edit = new vscode.WorkspaceEdit();
            edit.createFile(uri, { ignoreIfExists: false });
            edit.insert(uri, new vscode.Position(0, 0), action.content || '');
            
            const success = await vscode.workspace.applyEdit(edit);
            
            if (success) {
                stream.markdown(`\n\n✅ **File Created**: ${action.target}`);
                
                // Show a button to open the new file
                stream.button({
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [uri]
                });
            } else {
                stream.markdown(`\n\n❌ **Create Failed**: Could not create ${action.target}`);
            }
        } catch (error) {
            stream.markdown(`\n\n❌ **Create Error**: ${error}`);
        }
    }

    private async handleDeleteAction(action: any, stream: vscode.ChatResponseStream): Promise<void> {
        const uri = vscode.Uri.file(action.target);
        
        try {
            const edit = new vscode.WorkspaceEdit();
            edit.deleteFile(uri);
            
            const success = await vscode.workspace.applyEdit(edit);
            
            if (success) {
                stream.markdown(`\n\n✅ **File Deleted**: ${action.target}`);
            } else {
                stream.markdown(`\n\n❌ **Delete Failed**: Could not delete ${action.target}`);
            }
        } catch (error) {
            stream.markdown(`\n\n❌ **Delete Error**: ${error}`);
        }
    }

    private async handleRunAction(action: any, stream: vscode.ChatResponseStream): Promise<void> {
        try {
            const terminal = vscode.window.createTerminal({
                name: 'Codessa Command',
                cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
            });
            
            terminal.show();
            terminal.sendText(action.command);
            
            stream.markdown(`\n\n🚀 **Command Executed**: \`${action.command}\``);
            
            // Show a button to focus the terminal
            stream.button({
                command: 'workbench.action.terminal.focus',
                title: 'Focus Terminal'
            });
        } catch (error) {
            stream.markdown(`\n\n❌ **Run Error**: ${error}`);
        }
    }

    private async provideFollowups(
        result: vscode.ChatResult,
        context: vscode.ChatContext,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatFollowup[]> {
        return [
            {
                prompt: 'Explain the changes you made',
                label: '🔍 Explain changes'
            },
            {
                prompt: 'Run tests for the modified code',
                label: '🧪 Run tests'
            },
            {
                prompt: 'Check for policy violations',
                label: '🛡️ Check policies'
            },
            {
                prompt: 'Create a playbook for this workflow',
                label: '📋 Create playbook'
            }
        ];
    }

    dispose(): void {
        if (this.participant) {
            this.participant.dispose();
        }
    }
}
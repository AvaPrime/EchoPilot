import * as vscode from 'vscode';
import { CodessaChatParticipant } from './chat/chatParticipant';
import { PolicyDiagnosticsProvider } from './policy/diagnosticsProvider';
import { PlaybookNotebookController } from './notebook/playbookController';
import { CodessaApiClient } from './api/apiClient';
import { MonacoEditorProvider } from './monaco/monacoIntegration';

let chatParticipant: CodessaChatParticipant;
let policyProvider: PolicyDiagnosticsProvider;
let notebookController: PlaybookNotebookController;
let apiClient: CodessaApiClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('Codessa AI Workbench extension is now active!');

    // Initialize API client
    apiClient = new CodessaApiClient();

    // Register chat participant
    chatParticipant = new CodessaChatParticipant(apiClient);
    context.subscriptions.push(chatParticipant.register());

    // Register policy diagnostics provider
    policyProvider = new PolicyDiagnosticsProvider(apiClient);
    context.subscriptions.push(policyProvider.register());

    // Register notebook controller for agent playbooks
    notebookController = new PlaybookNotebookController(apiClient);
    context.subscriptions.push(notebookController.register());

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('codessa.runPlaybook', async () => {
            await notebookController.createNewPlaybook();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('codessa.checkPolicies', async () => {
            await policyProvider.checkAllPolicies();
        })
    );

    // Register Monaco editor commands
    MonacoEditorProvider.registerCommands(context, apiClient);

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('codessa')) {
                apiClient.updateConfiguration();
            }
        })
    );

    // Auto-check policies on file save if enabled
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async (document) => {
            const config = vscode.workspace.getConfiguration('codessa');
            if (config.get('enablePolicyChecks', true)) {
                await policyProvider.checkDocumentPolicies(document);
            }
        })
    );
}

export function deactivate() {
    console.log('Codessa AI Workbench extension is now deactivated.');
    
    // Clean up resources
    if (chatParticipant) {
        chatParticipant.dispose();
    }
    if (policyProvider) {
        policyProvider.dispose();
    }
    if (notebookController) {
        notebookController.dispose();
    }
    if (apiClient) {
        apiClient.dispose();
    }
}
import * as vscode from 'vscode';
import { CodessaApiClient } from '../api/apiClient';
import { CodessaChatParticipant } from '../chat/chatParticipant';
import { PolicyDiagnosticsProvider } from '../policy/diagnosticsProvider';
import { PlaybookNotebookController } from '../notebook/playbookController';

/**
 * Web extension entry point for vscode.dev and Codespaces compatibility
 * This module handles the differences between desktop and web environments
 */

let chatParticipant: CodessaChatParticipant;
let policyProvider: PolicyDiagnosticsProvider;
let notebookController: PlaybookNotebookController;
let apiClient: CodessaApiClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('Codessa AI Workbench (Web) extension is now active!');

    // Check if we're running in a web environment
    const isWeb = vscode.env.uiKind === vscode.UIKind.Web;
    
    if (isWeb) {
        console.log('Running in web environment (vscode.dev/Codespaces)');
        
        // Show a welcome message for web users
        vscode.window.showInformationMessage(
            'Codessa AI Workbench is now active in web mode! Some features may have limited functionality.',
            'Learn More'
        ).then(selection => {
            if (selection === 'Learn More') {
                vscode.env.openExternal(vscode.Uri.parse('https://docs.codessa.dev/vscode-web'));
            }
        });
    }

    // Initialize API client with web-compatible settings
    apiClient = new WebCompatibleApiClient();

    // Register chat participant (works in web)
    chatParticipant = new CodessaChatParticipant(apiClient);
    context.subscriptions.push(chatParticipant.register());

    // Register policy diagnostics provider (limited in web)
    policyProvider = new WebCompatiblePolicyProvider(apiClient, isWeb);
    context.subscriptions.push(policyProvider.register());

    // Register notebook controller (works in web)
    notebookController = new PlaybookNotebookController(apiClient);
    context.subscriptions.push(notebookController.register());

    // Register web-compatible commands
    registerWebCompatibleCommands(context, isWeb);

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('codessa')) {
                apiClient.updateConfiguration();
            }
        })
    );

    // Auto-check policies on file save (if supported in web)
    if (!isWeb || vscode.workspace.fs) {
        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument(async (document) => {
                const config = vscode.workspace.getConfiguration('codessa');
                if (config.get('enablePolicyChecks', true)) {
                    await policyProvider.checkDocumentPolicies(document);
                }
            })
        );
    }
}

function registerWebCompatibleCommands(context: vscode.ExtensionContext, isWeb: boolean): void {
    // Run playbook command
    context.subscriptions.push(
        vscode.commands.registerCommand('codessa.runPlaybook', async () => {
            await notebookController.createNewPlaybook();
        })
    );

    // Check policies command (may be limited in web)
    context.subscriptions.push(
        vscode.commands.registerCommand('codessa.checkPolicies', async () => {
            if (isWeb) {
                // In web, we can only check open documents
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    await policyProvider.checkDocumentPolicies(activeEditor.document);
                } else {
                    vscode.window.showWarningMessage(
                        'In web mode, please open a file to check policies.'
                    );
                }
            } else {
                await policyProvider.checkAllPolicies();
            }
        })
    );

    // Web-specific commands
    if (isWeb) {
        context.subscriptions.push(
            vscode.commands.registerCommand('codessa.openWebDocs', () => {
                vscode.env.openExternal(vscode.Uri.parse('https://docs.codessa.dev/vscode-web'));
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('codessa.reportWebIssue', () => {
                vscode.env.openExternal(vscode.Uri.parse(
                    'https://github.com/codessa/vscode-extension/issues/new?template=web-issue.md'
                ));
            })
        );
    }
}

/**
 * Web-compatible API client that handles CORS and authentication differences
 */
class WebCompatibleApiClient extends CodessaApiClient {
    constructor() {
        super();
        this.setupWebCompatibility();
    }

    private setupWebCompatibility(): void {
        // In web environments, we may need to use different endpoints
        // or authentication methods due to CORS restrictions
        const isWeb = vscode.env.uiKind === vscode.UIKind.Web;
        
        if (isWeb) {
            // Override base configuration for web compatibility
            const config = vscode.workspace.getConfiguration('codessa');
            const webEndpoint = config.get('webApiEndpoint') || config.get('apiEndpoint');
            
            if (this.client) {
                this.client.defaults.baseURL = webEndpoint;
                
                // Add CORS headers for web requests
                this.client.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
                this.client.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
                this.client.defaults.headers.common['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
            }
        }
    }

    updateConfiguration(): void {
        super.updateConfiguration();
        this.setupWebCompatibility();
    }
}

/**
 * Web-compatible policy provider with fallbacks for limited file system access
 */
class WebCompatiblePolicyProvider extends PolicyDiagnosticsProvider {
    private isWeb: boolean;

    constructor(apiClient: CodessaApiClient, isWeb: boolean) {
        super(apiClient);
        this.isWeb = isWeb;
    }

    async checkAllPolicies(): Promise<void> {
        if (this.isWeb) {
            // In web mode, we can only check currently open documents
            const openDocuments = vscode.workspace.textDocuments.filter(
                doc => !doc.isUntitled && doc.uri.scheme === 'vscode-vfs'
            );

            if (openDocuments.length === 0) {
                vscode.window.showWarningMessage(
                    'No files are currently open. Please open files to check policies in web mode.'
                );
                return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Checking GitGuard Policies (Web Mode)',
                cancellable: true
            }, async (progress, token) => {
                const total = openDocuments.length;
                let completed = 0;

                for (const document of openDocuments) {
                    if (token.isCancellationRequested) {
                        break;
                    }

                    try {
                        await this.checkDocumentPolicies(document);
                    } catch (error) {
                        console.error(`Error checking policies for ${document.fileName}:`, error);
                    }

                    completed++;
                    progress.report({
                        increment: (100 / total),
                        message: `Checked ${completed}/${total} open files`
                    });
                }

                if (!token.isCancellationRequested) {
                    vscode.window.showInformationMessage(
                        `Policy check completed. Checked ${completed} open files.`
                    );
                }
            });
        } else {
            // Use the full implementation for desktop
            await super.checkAllPolicies();
        }
    }
}

export function deactivate() {
    console.log('Codessa AI Workbench (Web) extension is now deactivated.');
    
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
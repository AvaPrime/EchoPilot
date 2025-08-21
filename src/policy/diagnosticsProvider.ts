import * as vscode from 'vscode';
import { CodessaApiClient, PolicyCheckRequest, PolicyViolation } from '../api/apiClient';

export class PolicyDiagnosticsProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private apiClient: CodessaApiClient;
    private codeActionProvider: PolicyCodeActionProvider;

    constructor(apiClient: CodessaApiClient) {
        this.apiClient = apiClient;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('codessa-policies');
        this.codeActionProvider = new PolicyCodeActionProvider(apiClient);
    }

    register(): vscode.Disposable {
        const disposables: vscode.Disposable[] = [];

        // Register the diagnostic collection
        disposables.push(this.diagnosticCollection);

        // Register code action provider for all languages
        disposables.push(
            vscode.languages.registerCodeActionsProvider(
                '*',
                this.codeActionProvider,
                {
                    providedCodeActionKinds: [
                        vscode.CodeActionKind.QuickFix,
                        vscode.CodeActionKind.SourceFixAll
                    ]
                }
            )
        );

        // Register decorations provider for inline policy hints
        disposables.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.updateDecorations(editor);
                }
            })
        );

        return vscode.Disposable.from(...disposables);
    }

    async checkDocumentPolicies(document: vscode.TextDocument): Promise<void> {
        if (document.uri.scheme !== 'file') {
            return;
        }

        try {
            const request: PolicyCheckRequest = {
                filePath: document.fileName,
                content: document.getText(),
                language: document.languageId
            };

            const violations = await this.apiClient.checkPolicies(request);
            this.updateDiagnostics(document.uri, violations);
        } catch (error) {
            console.error('Error checking policies for document:', error);
            vscode.window.showErrorMessage(`Failed to check policies: ${error}`);
        }
    }

    async checkAllPolicies(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showWarningMessage('No workspace folder open');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Checking GitGuard Policies',
            cancellable: true
        }, async (progress, token) => {
            const files = await vscode.workspace.findFiles(
                '**/*.{ts,js,py,java,go,rs,cpp,c,h,hpp}',
                '**/node_modules/**',
                1000
            );

            const total = files.length;
            let completed = 0;

            for (const file of files) {
                if (token.isCancellationRequested) {
                    break;
                }

                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    await this.checkDocumentPolicies(document);
                } catch (error) {
                    console.error(`Error checking policies for ${file.fsPath}:`, error);
                }

                completed++;
                progress.report({
                    increment: (100 / total),
                    message: `Checked ${completed}/${total} files`
                });
            }

            if (!token.isCancellationRequested) {
                vscode.window.showInformationMessage(
                    `Policy check completed. Checked ${completed} files.`
                );
            }
        });
    }

    private updateDiagnostics(uri: vscode.Uri, violations: PolicyViolation[]): void {
        const diagnostics: vscode.Diagnostic[] = violations.map(violation => {
            const range = new vscode.Range(
                violation.line - 1,
                violation.column - 1,
                violation.endLine ? violation.endLine - 1 : violation.line - 1,
                violation.endColumn ? violation.endColumn - 1 : violation.column + 10
            );

            const diagnostic = new vscode.Diagnostic(
                range,
                `[${violation.rule}] ${violation.message}`,
                this.mapSeverity(violation.severity)
            );

            diagnostic.source = 'GitGuard';
            diagnostic.code = violation.rule;

            // Store fix information for code actions
            if (violation.fix) {
                (diagnostic as any).fix = violation.fix;
            }

            return diagnostic;
        });

        this.diagnosticCollection.set(uri, diagnostics);
    }

    private mapSeverity(severity: string): vscode.DiagnosticSeverity {
        switch (severity) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'info':
                return vscode.DiagnosticSeverity.Information;
            default:
                return vscode.DiagnosticSeverity.Hint;
        }
    }

    private updateDecorations(editor: vscode.TextEditor): void {
        const diagnostics = this.diagnosticCollection.get(editor.document.uri);
        if (!diagnostics || diagnostics.length === 0) {
            return;
        }

        // Create decorations for policy violations
        const decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: ' 🛡️',
                color: 'rgba(255, 165, 0, 0.8)'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });

        const decorations: vscode.DecorationOptions[] = diagnostics
            .filter(d => d.source === 'GitGuard')
            .map(diagnostic => ({
                range: diagnostic.range,
                hoverMessage: `GitGuard Policy: ${diagnostic.message}`
            }));

        editor.setDecorations(decorationType, decorations);
    }

    dispose(): void {
        this.diagnosticCollection.dispose();
    }
}

class PolicyCodeActionProvider implements vscode.CodeActionProvider {
    private apiClient: CodessaApiClient;

    constructor(apiClient: CodessaApiClient) {
        this.apiClient = apiClient;
    }

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        const actions: vscode.CodeAction[] = [];

        // Find GitGuard diagnostics in the current range
        const gitGuardDiagnostics = context.diagnostics.filter(
            d => d.source === 'GitGuard' && d.range.intersection(range)
        );

        for (const diagnostic of gitGuardDiagnostics) {
            const fix = (diagnostic as any).fix;
            if (fix) {
                // Create quick fix action
                const fixAction = new vscode.CodeAction(
                    fix.description,
                    vscode.CodeActionKind.QuickFix
                );
                fixAction.diagnostics = [diagnostic];
                fixAction.isPreferred = true;

                // Create workspace edit for the fix
                const edit = new vscode.WorkspaceEdit();
                for (const editInfo of fix.edits) {
                    edit.replace(document.uri, editInfo.range, editInfo.newText);
                }
                fixAction.edit = edit;

                actions.push(fixAction);
            }

            // Create "Explain Policy" action
            const explainAction = new vscode.CodeAction(
                `Explain policy: ${diagnostic.code}`,
                vscode.CodeActionKind.Empty
            );
            explainAction.command = {
                command: 'codessa.explainPolicy',
                title: 'Explain Policy',
                arguments: [diagnostic.code, diagnostic.message]
            };
            actions.push(explainAction);
        }

        // Add "Fix All GitGuard Issues" action if there are multiple violations
        if (gitGuardDiagnostics.length > 1) {
            const fixAllAction = new vscode.CodeAction(
                'Fix all GitGuard issues',
                vscode.CodeActionKind.SourceFixAll
            );
            
            const edit = new vscode.WorkspaceEdit();
            for (const diagnostic of gitGuardDiagnostics) {
                const fix = (diagnostic as any).fix;
                if (fix) {
                    for (const editInfo of fix.edits) {
                        edit.replace(document.uri, editInfo.range, editInfo.newText);
                    }
                }
            }
            
            if (edit.size > 0) {
                fixAllAction.edit = edit;
                actions.push(fixAllAction);
            }
        }

        return actions;
    }
}
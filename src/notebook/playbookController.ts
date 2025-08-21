import * as vscode from 'vscode';
import { CodessaApiClient, PlaybookStep } from '../api/apiClient';

export class PlaybookNotebookController {
    private controller: vscode.NotebookController;
    private apiClient: CodessaApiClient;
    private executionOrder = 0;

    constructor(apiClient: CodessaApiClient) {
        this.apiClient = apiClient;
    }

    register(): vscode.Disposable {
        this.controller = vscode.notebooks.createNotebookController(
            'codessa-playbook-controller',
            'codessa-playbook',
            'Codessa Agent Playbook'
        );

        this.controller.description = 'Execute agent playbook steps with Codessa AI';
        this.controller.supportedLanguages = ['json', 'markdown', 'yaml'];
        this.controller.supportsExecutionOrder = true;
        this.controller.executeHandler = this.executeCell.bind(this);

        return this.controller;
    }

    async createNewPlaybook(): Promise<void> {
        const uri = vscode.Uri.joinPath(
            vscode.workspace.workspaceFolders?.[0]?.uri || vscode.Uri.file(''),
            `playbook-${Date.now()}.codessa-playbook`
        );

        const notebookData = new vscode.NotebookData([
            new vscode.NotebookCellData(
                vscode.NotebookCellKind.Markup,
                '# Codessa Agent Playbook\n\nThis playbook defines a sequence of AI agent steps to automate development workflows.',
                'markdown'
            ),
            new vscode.NotebookCellData(
                vscode.NotebookCellKind.Code,
                JSON.stringify({
                    type: 'plan',
                    description: 'Analyze the codebase and create a plan',
                    input: {
                        task: 'Describe what you want to accomplish',
                        scope: 'files or directories to analyze'
                    }
                }, null, 2),
                'json'
            ),
            new vscode.NotebookCellData(
                vscode.NotebookCellKind.Code,
                JSON.stringify({
                    type: 'search',
                    description: 'Search for relevant code patterns',
                    input: {
                        query: 'search terms or patterns',
                        fileTypes: ['*.ts', '*.js']
                    }
                }, null, 2),
                'json'
            ),
            new vscode.NotebookCellData(
                vscode.NotebookCellKind.Code,
                JSON.stringify({
                    type: 'edit',
                    description: 'Apply code changes',
                    input: {
                        files: ['path/to/file.ts'],
                        changes: 'description of changes to make'
                    }
                }, null, 2),
                'json'
            ),
            new vscode.NotebookCellData(
                vscode.NotebookCellKind.Code,
                JSON.stringify({
                    type: 'test',
                    description: 'Run tests to verify changes',
                    input: {
                        command: 'npm test',
                        expectedOutput: 'all tests pass'
                    }
                }, null, 2),
                'json'
            )
        ]);

        const notebook = await vscode.workspace.openNotebookDocument('codessa-playbook', notebookData);
        await vscode.window.showNotebookDocument(notebook);
    }

    private async executeCell(
        cells: vscode.NotebookCell[],
        notebook: vscode.NotebookDocument,
        controller: vscode.NotebookController
    ): Promise<void> {
        for (const cell of cells) {
            await this.executeSingleCell(cell);
        }
    }

    private async executeSingleCell(cell: vscode.NotebookCell): Promise<void> {
        const execution = this.controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this.executionOrder;
        execution.start(Date.now());

        try {
            // Parse the cell content as a playbook step
            const stepDefinition = this.parseCellContent(cell);
            if (!stepDefinition) {
                execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.error(new Error('Invalid step definition'))
                    ])
                ]);
                execution.end(false, Date.now());
                return;
            }

            // Create playbook step
            const step: PlaybookStep = {
                id: `step-${Date.now()}`,
                type: stepDefinition.type,
                description: stepDefinition.description,
                input: stepDefinition.input,
                status: 'pending'
            };

            // Show progress
            execution.replaceOutput([
                new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.text(
                        `🔄 Executing ${step.type} step: ${step.description}`,
                        'text/plain'
                    )
                ])
            ]);

            // Execute the step via API
            const result = await this.apiClient.executePlaybookStep(step);

            // Display results
            await this.displayStepResult(execution, result);
            execution.end(true, Date.now());

        } catch (error) {
            console.error('Error executing playbook step:', error);
            execution.replaceOutput([
                new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.error(
                        error instanceof Error ? error : new Error(String(error))
                    )
                ])
            ]);
            execution.end(false, Date.now());
        }
    }

    private parseCellContent(cell: vscode.NotebookCell): any {
        try {
            if (cell.document.languageId === 'json') {
                return JSON.parse(cell.document.getText());
            } else if (cell.document.languageId === 'yaml') {
                // Simple YAML parsing - in production, use a proper YAML parser
                const text = cell.document.getText();
                const lines = text.split('\n');
                const result: any = {};
                
                for (const line of lines) {
                    const match = line.match(/^(\w+):\s*(.+)$/);
                    if (match) {
                        result[match[1]] = match[2];
                    }
                }
                return result;
            }
            return null;
        } catch (error) {
            console.error('Error parsing cell content:', error);
            return null;
        }
    }

    private async displayStepResult(
        execution: vscode.NotebookCellExecution,
        result: PlaybookStep
    ): Promise<void> {
        const outputs: vscode.NotebookCellOutput[] = [];

        // Status indicator
        const statusEmoji = this.getStatusEmoji(result.status);
        outputs.push(
            new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.text(
                    `${statusEmoji} **${result.type.toUpperCase()}**: ${result.description}`,
                    'text/markdown'
                )
            ])
        );

        // Step output
        if (result.output) {
            switch (result.type) {
                case 'plan':
                    outputs.push(
                        new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.text(
                                this.formatPlanOutput(result.output),
                                'text/markdown'
                            )
                        ])
                    );
                    break;

                case 'search':
                    outputs.push(
                        new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.text(
                                this.formatSearchOutput(result.output),
                                'text/markdown'
                            )
                        ])
                    );
                    break;

                case 'edit':
                    outputs.push(
                        new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.text(
                                this.formatEditOutput(result.output),
                                'text/markdown'
                            )
                        ])
                    );
                    break;

                case 'test':
                    outputs.push(
                        new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.text(
                                this.formatTestOutput(result.output),
                                'text/plain'
                            )
                        ])
                    );
                    break;

                case 'analyze':
                    outputs.push(
                        new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.json(
                                result.output,
                                'application/json'
                            )
                        ])
                    );
                    break;

                default:
                    outputs.push(
                        new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.json(
                                result.output,
                                'application/json'
                            )
                        ])
                    );
            }
        }

        execution.replaceOutput(outputs);
    }

    private getStatusEmoji(status: string): string {
        switch (status) {
            case 'completed': return '✅';
            case 'failed': return '❌';
            case 'running': return '🔄';
            case 'pending': return '⏳';
            default: return '❓';
        }
    }

    private formatPlanOutput(output: any): string {
        if (output.steps && Array.isArray(output.steps)) {
            let markdown = '## Execution Plan\n\n';
            output.steps.forEach((step: any, index: number) => {
                markdown += `${index + 1}. **${step.title}**\n   ${step.description}\n\n`;
            });
            return markdown;
        }
        return `## Plan\n\n${JSON.stringify(output, null, 2)}`;
    }

    private formatSearchOutput(output: any): string {
        if (output.results && Array.isArray(output.results)) {
            let markdown = '## Search Results\n\n';
            output.results.forEach((result: any) => {
                markdown += `### ${result.file}\n`;
                markdown += `**Line ${result.line}**: \`${result.match}\`\n\n`;
            });
            return markdown;
        }
        return `## Search Results\n\n${JSON.stringify(output, null, 2)}`;
    }

    private formatEditOutput(output: any): string {
        if (output.changes && Array.isArray(output.changes)) {
            let markdown = '## Applied Changes\n\n';
            output.changes.forEach((change: any) => {
                markdown += `### ${change.file}\n`;
                markdown += `- ${change.description}\n\n`;
            });
            return markdown;
        }
        return `## Changes Applied\n\n${JSON.stringify(output, null, 2)}`;
    }

    private formatTestOutput(output: any): string {
        if (typeof output === 'string') {
            return output;
        }
        return JSON.stringify(output, null, 2);
    }

    dispose(): void {
        this.controller.dispose();
    }
}
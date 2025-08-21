import * as vscode from 'vscode';
import { PlaybookNotebookController } from '../playbookController';
import { CodessaApiClient } from '../../api/apiClient';

// Mock the VS Code API
jest.mock('vscode');

// Mock the API client
jest.mock('../../api/apiClient');

describe('PlaybookNotebookController', () => {
    let notebookController: PlaybookNotebookController;
    let mockApiClient: jest.Mocked<CodessaApiClient>;
    let mockController: any;
    let mockNotebook: any;
    let mockCell: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock API client
        mockApiClient = {
            sendChatMessage: jest.fn(),
            checkPolicies: jest.fn(),
            executePlaybookStep: jest.fn(),
            updateConfiguration: jest.fn(),
            dispose: jest.fn()
        } as any;

        // Mock notebook controller
        mockController = {
            description: '',
            supportedLanguages: [],
            supportsExecutionOrder: false,
            executeHandler: undefined,
            dispose: jest.fn()
        };

        // Mock notebook and cell
        mockNotebook = {
            uri: { fsPath: '/mock/playbook.codessa-playbook' },
            cellCount: 1,
            cellAt: jest.fn()
        };

        mockCell = {
            kind: vscode.NotebookCellKind.Code,
            document: {
                getText: jest.fn().mockReturnValue('{ "type": "plan", "input": { "task": "test" } }'),
                languageId: 'json'
            },
            executionSummary: undefined,
            index: 0
        };

        // Mock VS Code APIs
        (vscode.notebooks.createNotebookController as jest.Mock).mockReturnValue(mockController);
        (vscode.NotebookCellKind.Code as any) = 2;
        (vscode.NotebookCellKind.Markup as any) = 1;
        (vscode.NotebookData as jest.Mock).mockImplementation((cells) => ({ cells }));
        (vscode.NotebookCellData as jest.Mock).mockImplementation((kind, value, languageId) => ({
            kind,
            value,
            languageId
        }));
        (vscode.Uri.joinPath as jest.Mock).mockReturnValue(vscode.Uri.file('/mock/playbook.codessa-playbook'));
        (vscode.Uri.file as jest.Mock).mockImplementation((path: string) => ({ fsPath: path }));

        // Mock workspace
        (vscode.workspace.workspaceFolders as any) = [{
            uri: { fsPath: '/mock/workspace' }
        }];
        (vscode.workspace.openNotebookDocument as jest.Mock).mockResolvedValue(mockNotebook);
        (vscode.window.showNotebookDocument as jest.Mock).mockResolvedValue({});

        notebookController = new PlaybookNotebookController(mockApiClient);
    });

    describe('register', () => {
        it('should create and configure notebook controller', () => {
            const disposable = notebookController.register();

            expect(vscode.notebooks.createNotebookController).toHaveBeenCalledWith(
                'codessa-playbook-controller',
                'codessa-playbook',
                'Codessa Agent Playbook'
            );
            expect(mockController.description).toBe('Execute agent playbook steps with Codessa AI');
            expect(mockController.supportedLanguages).toEqual(['json', 'markdown', 'yaml']);
            expect(mockController.supportsExecutionOrder).toBe(true);
            expect(mockController.executeHandler).toBeDefined();
            expect(disposable).toBe(mockController);
        });
    });

    describe('createNewPlaybook', () => {
        it('should create a new playbook with default structure', async () => {
            await notebookController.createNewPlaybook();

            expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
                expect.objectContaining({ fsPath: '/mock/workspace' }),
                expect.stringMatching(/playbook-\d+\.codessa-playbook/)
            );

            expect(vscode.NotebookData).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        kind: vscode.NotebookCellKind.Markup,
                        languageId: 'markdown'
                    }),
                    expect.objectContaining({
                        kind: vscode.NotebookCellKind.Code,
                        languageId: 'json'
                    })
                ])
            );

            expect(vscode.workspace.openNotebookDocument).toHaveBeenCalledWith(
                'codessa-playbook',
                expect.any(Object)
            );
            expect(vscode.window.showNotebookDocument).toHaveBeenCalledWith(mockNotebook);
        });

        it('should handle missing workspace folder', async () => {
            (vscode.workspace.workspaceFolders as any) = null;

            await notebookController.createNewPlaybook();

            expect(vscode.Uri.joinPath).toHaveBeenCalledWith(
                expect.objectContaining({ fsPath: '' }),
                expect.stringMatching(/playbook-\d+\.codessa-playbook/)
            );
        });
    });

    describe('cell execution', () => {
        let executeHandler: (cells: vscode.NotebookCell[], notebook: vscode.NotebookDocument, controller: vscode.NotebookController) => Promise<void>;

        beforeEach(() => {
            notebookController.register();
            executeHandler = mockController.executeHandler;
        });

        it('should execute plan step', async () => {
            const planStep = {
                type: 'plan',
                description: 'Create a plan',
                input: {
                    task: 'Implement feature X',
                    scope: 'src/'
                }
            };

            mockCell.document.getText.mockReturnValue(JSON.stringify(planStep));
            mockApiClient.executePlaybookStep = jest.fn().mockResolvedValue({
                success: true,
                output: 'Plan created successfully',
                artifacts: ['plan.md']
            });

            await executeHandler([mockCell], mockNotebook, mockController);

            expect(mockApiClient.executePlaybookStep).toHaveBeenCalledWith(planStep);
        });

        it('should execute search step', async () => {
            const searchStep = {
                type: 'search',
                description: 'Search for patterns',
                input: {
                    query: 'function declarations',
                    fileTypes: ['*.ts']
                }
            };

            mockCell.document.getText.mockReturnValue(JSON.stringify(searchStep));
            mockApiClient.executePlaybookStep = jest.fn().mockResolvedValue({
                success: true,
                output: 'Found 5 matches',
                results: ['file1.ts:10', 'file2.ts:25']
            });

            await executeHandler([mockCell], mockNotebook, mockController);

            expect(mockApiClient.executePlaybookStep).toHaveBeenCalledWith(searchStep);
        });

        it('should execute edit step', async () => {
            const editStep = {
                type: 'edit',
                description: 'Apply changes',
                input: {
                    files: ['src/component.ts'],
                    changes: 'Add error handling'
                }
            };

            mockCell.document.getText.mockReturnValue(JSON.stringify(editStep));
            mockApiClient.executePlaybookStep = jest.fn().mockResolvedValue({
                success: true,
                output: 'Changes applied successfully',
                modifiedFiles: ['src/component.ts']
            });

            await executeHandler([mockCell], mockNotebook, mockController);

            expect(mockApiClient.executePlaybookStep).toHaveBeenCalledWith(editStep);
        });

        it('should execute test step', async () => {
            const testStep = {
                type: 'test',
                description: 'Run tests',
                input: {
                    command: 'npm test',
                    expectedOutput: 'all tests pass'
                }
            };

            mockCell.document.getText.mockReturnValue(JSON.stringify(testStep));
            mockApiClient.executePlaybookStep = jest.fn().mockResolvedValue({
                success: true,
                output: 'All tests passed',
                exitCode: 0
            });

            await executeHandler([mockCell], mockNotebook, mockController);

            expect(mockApiClient.executePlaybookStep).toHaveBeenCalledWith(testStep);
        });

        it('should handle invalid JSON in cell', async () => {
            mockCell.document.getText.mockReturnValue('invalid json');
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await executeHandler([mockCell], mockNotebook, mockController);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error parsing cell content')
            );
            expect(mockApiClient.executePlaybookStep).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should handle execution errors', async () => {
            const step = {
                type: 'plan',
                input: { task: 'test' }
            };

            mockCell.document.getText.mockReturnValue(JSON.stringify(step));
            const error = new Error('Execution failed');
            mockApiClient.executePlaybookStep = jest.fn().mockRejectedValue(error);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await executeHandler([mockCell], mockNotebook, mockController);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error executing playbook step'),
                error
            );

            consoleSpy.mockRestore();
        });

        it('should execute multiple cells in sequence', async () => {
            const cell1 = {
                ...mockCell,
                document: {
                    getText: jest.fn().mockReturnValue(JSON.stringify({ type: 'plan', input: { task: 'task1' } })),
                    languageId: 'json'
                }
            };

            const cell2 = {
                ...mockCell,
                document: {
                    getText: jest.fn().mockReturnValue(JSON.stringify({ type: 'search', input: { query: 'test' } })),
                    languageId: 'json'
                }
            };

            mockApiClient.executePlaybookStep = jest.fn().mockResolvedValue({
                success: true,
                output: 'Success'
            });

            await executeHandler([cell1, cell2], mockNotebook, mockController);

            expect(mockApiClient.executePlaybookStep).toHaveBeenCalledTimes(2);
            expect(mockApiClient.executePlaybookStep).toHaveBeenNthCalledWith(1, { type: 'plan', input: { task: 'task1' } });
            expect(mockApiClient.executePlaybookStep).toHaveBeenNthCalledWith(2, { type: 'search', input: { query: 'test' } });
        });

        it('should skip markdown cells', async () => {
            const markdownCell = {
                ...mockCell,
                kind: vscode.NotebookCellKind.Markup,
                document: {
                    getText: jest.fn().mockReturnValue('# This is markdown'),
                    languageId: 'markdown'
                }
            };

            await executeHandler([markdownCell], mockNotebook, mockController);

            expect(mockApiClient.executePlaybookStep).not.toHaveBeenCalled();
        });
    });

    describe('dispose', () => {
        it('should dispose the notebook controller', () => {
            notebookController.register();
            notebookController.dispose();

            expect(mockController.dispose).toHaveBeenCalled();
        });

        it('should handle dispose when controller is not initialized', () => {
            expect(() => notebookController.dispose()).not.toThrow();
        });
    });

    describe('step validation', () => {
        let executeHandler: (cells: vscode.NotebookCell[], notebook: vscode.NotebookDocument, controller: vscode.NotebookController) => Promise<void>;

        beforeEach(() => {
            notebookController.register();
            executeHandler = mockController.executeHandler;
        });

        it('should validate required fields for plan step', async () => {
            const invalidPlanStep = {
                type: 'plan',
                // missing input field
            };

            mockCell.document.getText.mockReturnValue(JSON.stringify(invalidPlanStep));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await executeHandler([mockCell], mockNotebook, mockController);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Invalid step configuration')
            );
            expect(mockApiClient.executePlaybookStep).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should validate step type', async () => {
            const invalidStep = {
                type: 'unknown-type',
                input: { task: 'test' }
            };

            mockCell.document.getText.mockReturnValue(JSON.stringify(invalidStep));
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            await executeHandler([mockCell], mockNotebook, mockController);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Unknown step type')
            );

            consoleSpy.mockRestore();
        });
    });
});
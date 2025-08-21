import * as vscode from 'vscode';
import { MonacoEditorProvider } from '../monacoIntegration';
import { CodessaApiClient } from '../../api/apiClient';

// Mock the VS Code API
jest.mock('vscode');

// Mock the API client
jest.mock('../../api/apiClient');

describe('MonacoEditorProvider', () => {
    let monacoProvider: MonacoEditorProvider;
    let mockApiClient: jest.Mocked<CodessaApiClient>;
    let mockWebviewPanel: any;
    let mockWebview: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock API client
        mockApiClient = {
            sendChatMessage: jest.fn(),
            checkPolicies: jest.fn(),
            updateConfiguration: jest.fn(),
            dispose: jest.fn()
        } as any;

        // Mock webview
        mockWebview = {
            html: '',
            onDidReceiveMessage: jest.fn(),
            postMessage: jest.fn()
        };

        // Mock webview panel
        mockWebviewPanel = {
            webview: mockWebview,
            onDidDispose: jest.fn(),
            dispose: jest.fn()
        };

        // Mock VS Code APIs
        (vscode.window.createWebviewPanel as jest.Mock).mockReturnValue(mockWebviewPanel);
        (vscode.extensions.getExtension as jest.Mock).mockReturnValue({
            extensionUri: vscode.Uri.file('/mock/extension/path')
        });
        (vscode.Uri.joinPath as jest.Mock).mockReturnValue(vscode.Uri.file('/mock/resources/path'));
        (vscode.Uri.file as jest.Mock).mockImplementation((path: string) => ({ fsPath: path }));
        (vscode.ViewColumn.One as any) = 1;

        // Mock workspace
        (vscode.workspace.workspaceFolders as any) = [{
            uri: { fsPath: '/mock/workspace' }
        }];
        (vscode.workspace.fs as any) = {
            writeFile: jest.fn()
        };

        monacoProvider = new MonacoEditorProvider(mockApiClient);
    });

    describe('createEditorPanel', () => {
        it('should create a webview panel with correct configuration', async () => {
            const panel = await monacoProvider.createEditorPanel(
                'Test Editor',
                'typescript',
                'console.log("test");'
            );

            expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
                'codessa-monaco',
                'Test Editor',
                1, // ViewColumn.One
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [expect.any(Object)]
                }
            );
            expect(panel).toBe(mockWebviewPanel);
            expect(mockWebview.html).toContain('Monaco Editor');
        });

        it('should use default parameters when not provided', async () => {
            await monacoProvider.createEditorPanel();

            expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
                'codessa-monaco',
                'Codessa Monaco Editor',
                1,
                expect.any(Object)
            );
        });

        it('should set up message handler and dispose listener', async () => {
            await monacoProvider.createEditorPanel();

            expect(mockWebview.onDidReceiveMessage).toHaveBeenCalledWith(
                expect.any(Function),
                undefined
            );
            expect(mockWebviewPanel.onDidDispose).toHaveBeenCalledWith(
                expect.any(Function)
            );
        });

        it('should generate HTML content with correct language and initial content', async () => {
            await monacoProvider.createEditorPanel(
                'Test Editor',
                'javascript',
                'const x = 1;'
            );

            expect(mockWebview.html).toContain('Monaco Editor');
            expect(mockWebview.html).toContain('toolbar');
        });
    });

    describe('message handling', () => {
        let messageHandler: (message: any) => Promise<void>;

        beforeEach(async () => {
            await monacoProvider.createEditorPanel();
            messageHandler = (mockWebview.onDidReceiveMessage as jest.Mock).mock.calls[0][0];
        });

        it('should handle ai-assist messages', async () => {
            const mockResponse = {
                content: 'AI suggestion',
                actions: [{ type: 'edit' as const, target: 'file.ts' }]
            };
            mockApiClient.sendChatMessage.mockResolvedValue(mockResponse);

            const message = {
                type: 'ai-assist',
                data: {
                    requestId: 'req-123',
                    prompt: 'Help me with this code',
                    fileName: 'test.ts',
                    selectedText: 'const x = 1;'
                }
            };

            await messageHandler(message);

            expect(mockApiClient.sendChatMessage).toHaveBeenCalledWith({
                message: 'Help me with this code',
                context: {
                    activeFile: 'test.ts',
                    selectedText: 'const x = 1;',
                    workspaceRoot: '/mock/workspace'
                }
            });

            expect(mockWebview.postMessage).toHaveBeenCalledWith({
                type: 'ai-response',
                requestId: 'req-123',
                response: 'AI suggestion',
                actions: [{ type: 'edit', target: 'file.ts' }]
            });
        });

        it('should handle ai-assist errors', async () => {
            const error = new Error('API Error');
            mockApiClient.sendChatMessage.mockRejectedValue(error);

            const message = {
                type: 'ai-assist',
                data: {
                    requestId: 'req-123',
                    prompt: 'Help me'
                }
            };

            await messageHandler(message);

            expect(mockWebview.postMessage).toHaveBeenCalledWith({
                type: 'ai-error',
                requestId: 'req-123',
                error: 'API Error'
            });
        });

        it('should handle policy-check messages', async () => {
            const mockViolations = [
                {
                    rule: 'no-console',
                    message: 'Console statements not allowed',
                    line: 1,
                    column: 5,
                    severity: 'error' as const
                }
            ];
            mockApiClient.checkPolicies.mockResolvedValue(mockViolations);

            const message = {
                type: 'policy-check',
                data: {
                    requestId: 'req-456',
                    fileName: 'test.ts',
                    content: 'console.log("test");',
                    language: 'typescript'
                }
            };

            await messageHandler(message);

            expect(mockApiClient.checkPolicies).toHaveBeenCalledWith({
                filePath: 'test.ts',
                content: 'console.log("test");',
                language: 'typescript'
            });

            expect(mockWebview.postMessage).toHaveBeenCalledWith({
                type: 'policy-violations',
                requestId: 'req-456',
                violations: mockViolations
            });
        });

        it('should handle policy-check errors', async () => {
            const error = new Error('Policy check failed');
            mockApiClient.checkPolicies.mockRejectedValue(error);

            const message = {
                type: 'policy-check',
                data: {
                    requestId: 'req-456',
                    content: 'test code'
                }
            };

            await messageHandler(message);

            expect(mockWebview.postMessage).toHaveBeenCalledWith({
                type: 'policy-error',
                requestId: 'req-456',
                error: 'Policy check failed'
            });
        });

        it('should handle save-content messages', async () => {
            const mockEncoder = { encode: jest.fn().mockReturnValue(new Uint8Array()) };
            (global as any).TextEncoder = jest.fn(() => mockEncoder);
            (vscode.window.showInformationMessage as jest.Mock) = jest.fn();

            const message = {
                type: 'save-content',
                data: {
                    fileName: '/mock/file.ts',
                    content: 'const x = 1;'
                }
            };

            await messageHandler(message);

            expect(vscode.workspace.fs.writeFile).toHaveBeenCalledWith(
                expect.objectContaining({ fsPath: '/mock/file.ts' }),
                expect.any(Uint8Array)
            );
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Saved /mock/file.ts'
            );
        });

        it('should handle save-content errors', async () => {
            const error = new Error('Write failed');
            (vscode.workspace.fs.writeFile as jest.Mock).mockRejectedValue(error);
            (vscode.window.showErrorMessage as jest.Mock) = jest.fn();

            const message = {
                type: 'save-content',
                data: {
                    fileName: '/mock/file.ts',
                    content: 'const x = 1;'
                }
            };

            await messageHandler(message);

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Failed to save /mock/file.ts: Error: Write failed'
            );
        });

        it('should handle ready messages', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const message = {
                type: 'ready'
            };

            await messageHandler(message);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Monaco editor')
            );

            consoleSpy.mockRestore();
        });

        it('should ignore unknown message types', async () => {
            const message = {
                type: 'unknown-type',
                data: {}
            };

            // Should not throw
            await expect(messageHandler(message)).resolves.toBeUndefined();
        });
    });

    describe('panel management', () => {
        it('should track multiple panels', async () => {
            const panel1 = await monacoProvider.createEditorPanel('Editor 1');
            const panel2 = await monacoProvider.createEditorPanel('Editor 2');

            expect(panel1).toBeDefined();
            expect(panel2).toBeDefined();
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(2);
        });

        it('should clean up panels on dispose', async () => {
            await monacoProvider.createEditorPanel();
            const disposeHandler = (mockWebviewPanel.onDidDispose as jest.Mock).mock.calls[0][0];

            // Simulate panel disposal
            disposeHandler();

            // Should not throw when trying to send messages to disposed panel
            const messageHandler = (mockWebview.onDidReceiveMessage as jest.Mock).mock.calls[0][0];
            await expect(messageHandler({ type: 'ready' })).resolves.toBeUndefined();
        });
    });

    describe('HTML generation', () => {
        it('should generate valid HTML with Monaco editor setup', async () => {
            await monacoProvider.createEditorPanel(
                'Test Editor',
                'typescript',
                'console.log("test");'
            );

            const html = mockWebview.html;
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<html lang="en">');
            expect(html).toContain('Monaco Editor');
            expect(html).toContain('toolbar');
            expect(html).toContain('monaco-editor');
        });
    });
});